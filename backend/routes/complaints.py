from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import Optional, List
from datetime import datetime
from bson import ObjectId

from database import get_database
from models.complaint import (
    ComplaintCreate, 
    ComplaintUpdate, 
    ComplaintResponse, 
    ComplaintListResponse
)
from utils.security import get_current_user, require_roles
from services.ai_service import ai_service

router = APIRouter(prefix="/complaints", tags=["Complaints"])

def serialize_complaint(complaint: dict) -> dict:
    """Convert MongoDB document to response format"""
    complaint["_id"] = str(complaint["_id"])
    complaint["reported_by"] = str(complaint["reported_by"])
    if complaint.get("assigned_to"):
        complaint["assigned_to"] = str(complaint["assigned_to"])
    return complaint

@router.post("/", response_model=ComplaintResponse, status_code=status.HTTP_201_CREATED)
async def create_complaint(
    complaint_data: ComplaintCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new complaint"""
    db = get_database()
    
    # Prepare complaint document
    complaint_dict = complaint_data.model_dump()
    complaint_dict["reported_by"] = current_user["_id"]
    complaint_dict["reported_at"] = datetime.utcnow()
    complaint_dict["status"] = "pending"
    complaint_dict["votes"] = 0
    complaint_dict["comments"] = []
    
    # AI Analysis
    ai_analysis = ai_service.analyze_complaint(
        complaint_dict["title"],
        complaint_dict["description"],
        complaint_dict["category"]
    )
    complaint_dict["severity"] = ai_analysis["severity"]
    complaint_dict["ai_analysis"] = {
        "category": ai_analysis["category"],
        "severity": ai_analysis["severity"],
        "estimated_cost": ai_analysis["estimated_cost"],
        "priority": ai_analysis["priority"],
        "confidence": ai_analysis["confidence"]
    }
    
    # Check for duplicates
    existing_complaints = await db.complaints.find({
        "status": {"$ne": "resolved"},
        "location.district": complaint_dict["location"]["district"]
    }).to_list(100)
    
    duplicate_check = ai_service.check_duplicate(
        complaint_dict["title"],
        complaint_dict["description"],
        existing_complaints
    )
    
    if duplicate_check["is_duplicate"]:
        complaint_dict["ai_analysis"]["duplicate_of"] = duplicate_check["duplicate_of"]
    
    # Insert complaint
    result = await db.complaints.insert_one(complaint_dict)
    complaint_dict["_id"] = result.inserted_id
    
    return serialize_complaint(complaint_dict)

@router.get("/", response_model=ComplaintListResponse)
async def list_complaints(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    status: Optional[str] = None,
    severity: Optional[str] = None,
    category: Optional[str] = None,
    district: Optional[str] = None,
    search: Optional[str] = None,
    my_complaints: bool = False,
    current_user: dict = Depends(get_current_user)
):
    """List complaints with filters and pagination"""
    db = get_database()
    
    # Build query
    query = {}
    
    if my_complaints or current_user["role"] == "citizen":
        query["reported_by"] = current_user["_id"]
    
    if status:
        query["status"] = status
    if severity:
        query["severity"] = severity
    if category:
        query["category"] = category
    if district:
        query["location.district"] = district
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}}
        ]
    
    # Get total count
    total = await db.complaints.count_documents(query)
    
    # Get complaints with pagination
    skip = (page - 1) * page_size
    complaints = await db.complaints.find(query)\
        .sort("reported_at", -1)\
        .skip(skip)\
        .limit(page_size)\
        .to_list(page_size)
    
    # Serialize
    complaints = [serialize_complaint(c) for c in complaints]
    
    return ComplaintListResponse(
        complaints=complaints,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size
    )

@router.get("/{complaint_id}", response_model=ComplaintResponse)
async def get_complaint(
    complaint_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific complaint"""
    db = get_database()
    
    if not ObjectId.is_valid(complaint_id):
        raise HTTPException(status_code=400, detail="Invalid complaint ID")
    
    complaint = await db.complaints.find_one({"_id": ObjectId(complaint_id)})
    
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    
    return serialize_complaint(complaint)

@router.put("/{complaint_id}", response_model=ComplaintResponse)
async def update_complaint(
    complaint_id: str,
    update_data: ComplaintUpdate,
    current_user: dict = Depends(require_roles(["government", "superadmin"]))
):
    """Update a complaint (government/admin only)"""
    db = get_database()
    
    if not ObjectId.is_valid(complaint_id):
        raise HTTPException(status_code=400, detail="Invalid complaint ID")
    
    # Get existing complaint
    complaint = await db.complaints.find_one({"_id": ObjectId(complaint_id)})
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    
    # Prepare update
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    
    # Handle assigned_to conversion
    if "assigned_to" in update_dict:
        if ObjectId.is_valid(update_dict["assigned_to"]):
            update_dict["assigned_to"] = ObjectId(update_dict["assigned_to"])
    
    # Set resolved_at if status changed to resolved
    if update_dict.get("status") == "resolved":
        update_dict["resolved_at"] = datetime.utcnow()
    
    if update_dict:
        await db.complaints.update_one(
            {"_id": ObjectId(complaint_id)},
            {"$set": update_dict}
        )
    
    # Get updated complaint
    updated = await db.complaints.find_one({"_id": ObjectId(complaint_id)})
    return serialize_complaint(updated)

@router.post("/{complaint_id}/vote")
async def vote_complaint(
    complaint_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Upvote a complaint"""
    db = get_database()
    
    if not ObjectId.is_valid(complaint_id):
        raise HTTPException(status_code=400, detail="Invalid complaint ID")
    
    result = await db.complaints.update_one(
        {"_id": ObjectId(complaint_id)},
        {"$inc": {"votes": 1}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Complaint not found")
    
    return {"message": "Vote recorded"}

@router.post("/{complaint_id}/comment")
async def add_comment(
    complaint_id: str,
    content: str,
    current_user: dict = Depends(get_current_user)
):
    """Add a comment to a complaint"""
    db = get_database()
    
    if not ObjectId.is_valid(complaint_id):
        raise HTTPException(status_code=400, detail="Invalid complaint ID")
    
    comment = {
        "id": str(ObjectId()),
        "user_id": str(current_user["_id"]),
        "user_name": current_user["name"],
        "content": content,
        "created_at": datetime.utcnow()
    }
    
    result = await db.complaints.update_one(
        {"_id": ObjectId(complaint_id)},
        {"$push": {"comments": comment}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Complaint not found")
    
    return {"message": "Comment added", "comment": comment}

@router.post("/{complaint_id}/assign")
async def assign_complaint(
    complaint_id: str,
    contractor_id: str,
    current_user: dict = Depends(require_roles(["government", "superadmin"]))
):
    """Assign a complaint to a contractor"""
    db = get_database()
    
    if not ObjectId.is_valid(complaint_id) or not ObjectId.is_valid(contractor_id):
        raise HTTPException(status_code=400, detail="Invalid ID format")
    
    # Verify contractor exists
    contractor = await db.contractors.find_one({"_id": ObjectId(contractor_id)})
    if not contractor:
        raise HTTPException(status_code=404, detail="Contractor not found")
    
    # Update complaint
    result = await db.complaints.update_one(
        {"_id": ObjectId(complaint_id)},
        {
            "$set": {
                "assigned_to": ObjectId(contractor_id),
                "status": "assigned"
            }
        }
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Complaint not found")
    
    return {"message": "Complaint assigned successfully"}

@router.post("/analyze")
async def analyze_complaint_text(
    title: str,
    description: str,
    category: Optional[str] = None
):
    """Get AI analysis for complaint text (preview before submission)"""
    analysis = ai_service.analyze_complaint(title, description, category)
    return analysis

# ── Photo Upload ──────────────────────────────────────────────────────────────
from fastapi import UploadFile, File
import aiofiles
import os
import uuid
from PIL import Image
import io

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}

@router.post("/upload-image")
async def upload_complaint_image(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Upload an image for a complaint. Returns the image URL."""
    from config import settings

    # Validate content type
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type '{file.content_type}'. Allowed: JPEG, PNG, WEBP, GIF"
        )

    # Read file content
    contents = await file.read()

    # Validate size
    if len(contents) > settings.MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Max size is {settings.MAX_FILE_SIZE // 1024 // 1024}MB"
        )

    # Validate it's a real image with Pillow
    try:
        img = Image.open(io.BytesIO(contents))
        img.verify()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid image file")

    # Re-open after verify (verify closes the file)
    img = Image.open(io.BytesIO(contents))

    # Resize if larger than 2000x2000
    max_dim = 2000
    if img.width > max_dim or img.height > max_dim:
        img.thumbnail((max_dim, max_dim), Image.LANCZOS)

    # Save with unique filename
    ext = "jpg" if file.content_type == "image/jpeg" else file.content_type.split("/")[1]
    filename = f"{uuid.uuid4().hex}.{ext}"
    save_path = os.path.join(settings.UPLOAD_DIR, filename)

    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

    buf = io.BytesIO()
    save_format = "JPEG" if ext == "jpg" else ext.upper()
    if save_format == "JPEG":
        img = img.convert("RGB")
    img.save(buf, format=save_format, quality=85)

    async with aiofiles.open(save_path, "wb") as f:
        await f.write(buf.getvalue())

    # Return the URL that the frontend can use
    image_url = f"/uploads/{filename}"
    return {
        "url": image_url,
        "filename": filename,
        "size": len(buf.getvalue()),
        "content_type": file.content_type
    }
