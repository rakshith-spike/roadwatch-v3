from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import Optional, List
from datetime import datetime
from bson import ObjectId
import re
import os

from database import get_database
from models.complaint import (
    ComplaintCreate, 
    ComplaintUpdate, 
    ComplaintResponse, 
    ComplaintListResponse
)
from utils.security import get_current_user, require_roles
from services.ai_service import ai_service
from services.road_ai_service import road_ai_service
from config import settings

router = APIRouter(prefix="/complaints", tags=["Complaints"])

def serialize_complaint(complaint: dict) -> dict:
    """Convert MongoDB document to response format"""
    complaint["_id"] = str(complaint["_id"])
    complaint["reported_by"] = str(complaint["reported_by"])
    if complaint.get("assigned_to"):
        complaint["assigned_to"] = str(complaint["assigned_to"])
    complaint["supported_by"] = [str(u) for u in complaint.get("supported_by", [])]
    return complaint

def image_url_to_path(image_url: str) -> Optional[str]:
    if not image_url:
        return None
    filename = image_url.split("/uploads/")[-1] if "/uploads/" in image_url else image_url
    filename = os.path.basename(filename)
    path = os.path.join(settings.UPLOAD_DIR, filename)
    return path if os.path.exists(path) else None

async def create_notification(db, title: str, message: str, target_roles: List[str], complaint_id: Optional[ObjectId] = None):
    await db.alerts.insert_one({
        "type": "info",
        "title": title,
        "message": message,
        "complaint_id": complaint_id,
        "target_roles": target_roles,
        "actionable": True,
        "read": False,
        "created_at": datetime.utcnow()
    })

def normalize_issue_type(issue_type: str) -> str:
    mapping = {
        "waterlogging": "flooding",
        "garbage_obstruction": "debris",
        "road_edge_damage": "crack",
        "open_manhole": "drainage",
    }
    return mapping.get(issue_type, issue_type)

def text_similarity(a: str, b: str) -> float:
    words_a = set(re.findall(r"\w+", a.lower()))
    words_b = set(re.findall(r"\w+", b.lower()))
    if not words_a:
        return 0
    return len(words_a & words_b) / len(words_a | words_b or words_a)

def validate_complaint_location(location: dict) -> None:
    """Reject complaints that were submitted without a real captured location."""
    coordinates = location.get("coordinates") if location else None
    address = (location.get("address") if location else "" or "").strip()
    if not isinstance(coordinates, list) or len(coordinates) != 2:
        raise HTTPException(status_code=400, detail="Capture GPS location before submitting complaint")

    try:
        longitude = float(coordinates[0])
        latitude = float(coordinates[1])
    except (TypeError, ValueError):
        raise HTTPException(status_code=400, detail="Invalid GPS coordinates")

    if not (-180 <= longitude <= 180 and -90 <= latitude <= 90):
        raise HTTPException(status_code=400, detail="Invalid GPS coordinates")

    invalid_addresses = {"", "location not specified", "captured gps location"}
    if address.lower() in invalid_addresses or len(address) < 5:
        raise HTTPException(status_code=400, detail="A verified address is required before submitting complaint")

@router.post("/", response_model=ComplaintResponse, status_code=status.HTTP_201_CREATED)
async def create_complaint(
    complaint_data: ComplaintCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new complaint"""
    db = get_database()
    
    complaint_dict = complaint_data.model_dump()
    validate_complaint_location(complaint_dict.get("location", {}))
    complaint_dict["reported_by"] = current_user["_id"]
    complaint_dict["reported_at"] = datetime.utcnow()
    complaint_dict["status"] = "pending"
    complaint_dict["votes"] = 0
    complaint_dict["support_count"] = 1
    complaint_dict["supported_by"] = [current_user["_id"]]
    complaint_dict["comments"] = []
    complaint_dict["progress_percentage"] = 0
    complaint_dict["before_work_photos"] = []
    complaint_dict["progress_photos"] = []
    complaint_dict["completion_photos"] = []

    yolo_analysis = None
    for image_url in complaint_dict.get("images", []):
        image_path = image_url_to_path(image_url)
        if image_path:
            yolo_analysis = road_ai_service.analyze_image(
                image_path,
                preferred_category=complaint_dict["category"],
                title=complaint_dict["title"],
                description=complaint_dict["description"],
            )
            break
    
    ai_analysis = ai_service.analyze_complaint(
        complaint_dict["title"],
        complaint_dict["description"],
        complaint_dict["category"]
    )

    issue_type = yolo_analysis["issueType"] if yolo_analysis else ai_analysis["category"]
    category = normalize_issue_type(issue_type)
    confidence = yolo_analysis["confidence"] if yolo_analysis else ai_analysis["confidence"]
    boxes = yolo_analysis.get("boundingBoxes", []) if yolo_analysis else []
    detection_boxes = []
    for box in boxes:
        detection_boxes.append(type("Box", (), {
            "area_ratio": box.get("areaRatio", 0.05),
            "confidence": box.get("confidence", confidence),
        })())
    severity_score = road_ai_service.calculate_severity_score(confidence, detection_boxes, 1)
    severity = road_ai_service.score_to_level(severity_score)
    cost = road_ai_service.estimate_cost(issue_type, severity)
    estimated_days = road_ai_service.estimate_days(issue_type, severity)
    traffic_importance = complaint_data.traffic_importance or road_ai_service.traffic_importance(complaint_dict["location"])
    priority_score = road_ai_service.priority_score(severity_score, 1, traffic_importance)

    complaint_dict["category"] = category if category in ["pothole", "crack", "flooding", "debris", "streetlight", "drainage", "other"] else complaint_dict["category"]
    complaint_dict["severity"] = severity
    complaint_dict["estimated_cost"] = cost["estimatedCost"]
    complaint_dict["cost_range"] = cost["costRange"]
    complaint_dict["cost_reasoning"] = cost["reasoning"]
    complaint_dict["estimated_days"] = estimated_days
    complaint_dict["priority_score"] = priority_score
    complaint_dict["severity_score"] = severity_score
    complaint_dict["traffic_importance"] = traffic_importance
    complaint_dict["annotated_image"] = yolo_analysis.get("annotatedImage") if yolo_analysis else None
    complaint_dict["ai_analysis"] = {
        "category": complaint_dict["category"],
        "severity": severity,
        "estimated_cost": cost["estimatedCost"],
        "priority": priority_score,
        "confidence": confidence,
        "issue_type": issue_type,
        "severity_score": severity_score,
        "bounding_boxes": boxes,
        "annotated_image": complaint_dict["annotated_image"],
        "cost_range": cost["costRange"],
        "cost_reasoning": cost["reasoning"],
        "estimated_days": estimated_days,
        "priority_score": priority_score,
        "traffic_importance": traffic_importance,
        "model": yolo_analysis.get("model") if yolo_analysis else "text-rules",
        "model_status": yolo_analysis.get("modelStatus") if yolo_analysis else "text-analysis"
    }
    
    coordinates = complaint_dict["location"]["coordinates"]
    existing_complaints = await db.complaints.find({
        "status": {"$nin": ["resolved", "closed", "rejected"]},
        "location.coordinates": {
            "$near": {
                "$geometry": {"type": "Point", "coordinates": coordinates},
                "$maxDistance": settings.DUPLICATE_RADIUS_METERS,
            }
        }
    }).to_list(25)

    incoming_text = f"{complaint_dict['title']} {complaint_dict['description']} {complaint_dict['category']}"
    duplicate = None
    for existing in existing_complaints:
        same_category = existing.get("category") == complaint_dict["category"]
        similarity = text_similarity(incoming_text, f"{existing.get('title', '')} {existing.get('description', '')} {existing.get('category', '')}")
        if same_category or similarity >= 0.25:
            duplicate = existing
            break

    if duplicate:
        await db.complaints.update_one(
            {"_id": duplicate["_id"]},
            {
                "$inc": {"votes": 1, "support_count": 1},
                "$addToSet": {"supported_by": current_user["_id"]},
                "$set": {"updated_at": datetime.utcnow()}
            }
        )
        updated = await db.complaints.find_one({"_id": duplicate["_id"]})
        updated["duplicate_supported"] = True
        await create_notification(
            db,
            "Duplicate Complaint Supported",
            f"{current_user['name']} supported an existing complaint near {updated['location'].get('address', 'the reported location')}.",
            ["government", "superadmin"],
            duplicate["_id"],
        )
        return serialize_complaint(updated)
    
    result = await db.complaints.insert_one(complaint_dict)
    complaint_dict["_id"] = result.inserted_id

    await create_notification(
        db,
        "Complaint Created",
        f"New {complaint_dict['severity']} {complaint_dict['category']} complaint submitted.",
        ["government", "superadmin"],
        result.inserted_id,
    )
    
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
        .sort([("priority_score", -1), ("reported_at", -1)])\
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

@router.get("/priority-queue")
async def get_priority_queue(
    severity: Optional[str] = None,
    current_user: dict = Depends(require_roles(["government", "superadmin"]))
):
    """AI priority queue for government review."""
    db = get_database()
    query = {"status": {"$in": ["pending", "verified", "assigned", "in_progress", "validation_pending"]}}
    if severity:
        query["severity"] = severity
    complaints = await db.complaints.find(query).sort([("priority_score", -1), ("support_count", -1)]).limit(50).to_list(50)
    return {"complaints": [serialize_complaint(c) for c in complaints]}

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
        if "status" in update_dict:
            title_by_status = {
                "verified": "Complaint Verified",
                "assigned": "Assigned",
                "in_progress": "In Progress",
                "resolved": "Completed",
                "validation_pending": "Verification Requested",
                "closed": "Complaint Closed",
            }
            if update_dict["status"] in title_by_status:
                await create_notification(
                    db,
                    title_by_status[update_dict["status"]],
                    f"Complaint {complaint_id} status changed to {update_dict['status'].replace('_', ' ')}.",
                    ["citizen", "government", "superadmin", "contractor"],
                    ObjectId(complaint_id),
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

@router.post("/{complaint_id}/support", response_model=ComplaintResponse)
async def support_complaint(
    complaint_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Support an existing nearby complaint instead of creating a duplicate."""
    db = get_database()

    if not ObjectId.is_valid(complaint_id):
        raise HTTPException(status_code=400, detail="Invalid complaint ID")

    result = await db.complaints.update_one(
        {"_id": ObjectId(complaint_id)},
        {
            "$inc": {"votes": 1, "support_count": 1},
            "$addToSet": {"supported_by": current_user["_id"]},
            "$set": {"updated_at": datetime.utcnow()}
        }
    )

    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Complaint not found")

    updated = await db.complaints.find_one({"_id": ObjectId(complaint_id)})
    support_count = updated.get("support_count", 0)
    severity_score = road_ai_service.calculate_severity_score(
        updated.get("ai_analysis", {}).get("confidence", 0.6),
        [],
        support_count,
    )
    priority_score = road_ai_service.priority_score(
        max(updated.get("severity_score", severity_score), severity_score),
        support_count,
        updated.get("traffic_importance", 50),
    )
    await db.complaints.update_one(
        {"_id": ObjectId(complaint_id)},
        {"$set": {"priority_score": priority_score, "ai_analysis.priority_score": priority_score, "ai_analysis.priority": priority_score}}
    )
    updated = await db.complaints.find_one({"_id": ObjectId(complaint_id)})
    return serialize_complaint(updated)

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
    contractor = await db.contractors.find_one({"_id": ObjectId(contractor_id), "user_id": {"$exists": True}})
    if not contractor:
        raise HTTPException(status_code=404, detail="Contractor not found")

    contractor_user = await db.users.find_one({"_id": contractor["user_id"], "role": "contractor", "is_active": True})
    if not contractor_user:
        raise HTTPException(status_code=400, detail="Contractor is not linked to an active contractor login")
    
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
    
    await create_notification(db, "Assigned", "Complaint assigned to a contractor.", ["contractor", "government", "superadmin"], ObjectId(complaint_id))
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

@router.post("/analyze-image")
async def analyze_complaint_image(
    image_url: str,
    category: Optional[str] = None,
    title: str = "",
    description: str = "",
    filename: str = "",
    current_user: dict = Depends(get_current_user)
):
    """Run YOLO road-defect analysis for an uploaded image."""
    image_path = image_url_to_path(image_url)
    if not image_path:
        raise HTTPException(status_code=404, detail="Uploaded image not found")
    return road_ai_service.analyze_image(
        image_path,
        preferred_category=category,
        title=title,
        description=description,
        original_filename=filename,
    )

@router.post("/{complaint_id}/repair-validation")
async def validate_repair(
    complaint_id: str,
    after_image_url: str,
    current_user: dict = Depends(get_current_user)
):
    """Compare before and after repair images and request citizen verification."""
    db = get_database()
    if not ObjectId.is_valid(complaint_id):
        raise HTTPException(status_code=400, detail="Invalid complaint ID")

    complaint = await db.complaints.find_one({"_id": ObjectId(complaint_id)})
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    after_path = image_url_to_path(after_image_url)
    after_analysis = road_ai_service.analyze_image(after_path) if after_path else None
    validation = road_ai_service.validate_repair(complaint.get("ai_analysis"), after_analysis)
    await db.complaints.update_one(
        {"_id": ObjectId(complaint_id)},
        {
            "$set": {
                "repair_validation": validation,
                "status": "validation_pending" if validation["status"] == "verified" else "in_progress",
                "completion_photos": list(set(complaint.get("completion_photos", []) + [after_image_url])),
            }
        }
    )
    await create_notification(db, "Verification Requested", "AI repair validation complete. Citizen verification requested.", ["citizen", "government"], ObjectId(complaint_id))
    return validation

@router.post("/{complaint_id}/citizen-verification")
async def citizen_verification(
    complaint_id: str,
    fixed: bool,
    notes: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Citizen confirms whether completed repair is fixed."""
    db = get_database()
    if not ObjectId.is_valid(complaint_id):
        raise HTTPException(status_code=400, detail="Invalid complaint ID")
    status_value = "closed" if fixed else "in_progress"
    verification = {
        "fixed": fixed,
        "notes": notes,
        "verified_by": str(current_user["_id"]),
        "verified_at": datetime.utcnow(),
    }
    result = await db.complaints.update_one(
        {"_id": ObjectId(complaint_id)},
        {"$set": {"citizen_verification": verification, "status": status_value}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Complaint not found")
    await create_notification(
        db,
        "Complaint Verified" if fixed else "Complaint Reopened",
        "Citizen accepted the repair." if fixed else "Citizen rejected the repair and reopened the complaint.",
        ["government", "superadmin", "contractor"],
        ObjectId(complaint_id),
    )
    return {"message": "Verification recorded", "status": status_value}

# ── Photo Upload ──────────────────────────────────────────────────────────────
from fastapi import UploadFile, File
import aiofiles
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
