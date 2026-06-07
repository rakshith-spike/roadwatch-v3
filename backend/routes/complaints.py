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
from services.road_ai_service import road_ai_service, ISSUE_TO_APP_CATEGORY
from config import settings

router = APIRouter(prefix="/complaints", tags=["Complaints"])


def serialize_complaint(complaint: dict) -> dict:
    """Convert MongoDB document to response-friendly format."""
    complaint["_id"] = str(complaint["_id"])
    complaint["reported_by"] = str(complaint["reported_by"])
    if complaint.get("assigned_to"):
        complaint["assigned_to"] = str(complaint["assigned_to"])
    complaint["supported_by"] = [str(u) for u in complaint.get("supported_by", [])]
    # Normalize comments — backend stores list of dicts, ensure it's serializable
    comments = complaint.get("comments", [])
    if isinstance(comments, list):
        for c in comments:
            if isinstance(c, dict) and "created_at" in c:
                if hasattr(c["created_at"], "isoformat"):
                    c["created_at"] = c["created_at"].isoformat()
    return complaint


def image_url_to_path(image_url: str) -> Optional[str]:
    if not image_url:
        return None
    filename = image_url.split("/uploads/")[-1] if "/uploads/" in image_url else image_url
    filename = os.path.basename(filename)
    path = os.path.join(settings.UPLOAD_DIR, filename)
    return path if os.path.exists(path) else None


async def create_notification(
    db, title: str, message: str, target_roles: List[str],
    complaint_id: Optional[ObjectId] = None
):
    """Insert an alert/notification into the alerts collection."""
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
    """Map internal YOLO issue type → frontend category name."""
    return ISSUE_TO_APP_CATEGORY.get(issue_type, issue_type)


def text_similarity(a: str, b: str) -> float:
    words_a = set(re.findall(r"\w+", a.lower()))
    words_b = set(re.findall(r"\w+", b.lower()))
    if not words_a:
        return 0
    union = words_a | words_b
    return len(words_a & words_b) / len(union) if union else 0


def validate_complaint_location(location: dict) -> None:
    """Validate GPS coordinates are real and address is non-trivial."""
    coordinates = location.get("coordinates") if location else None
    address = (location.get("address") if location else "" or "").strip()

    if not isinstance(coordinates, list) or len(coordinates) != 2:
        raise HTTPException(
            status_code=400,
            detail="Please capture your GPS location before submitting the complaint."
        )

    try:
        longitude = float(coordinates[0])
        latitude = float(coordinates[1])
    except (TypeError, ValueError):
        raise HTTPException(status_code=400, detail="Invalid GPS coordinates provided.")

    if not (-180 <= longitude <= 180 and -90 <= latitude <= 90):
        raise HTTPException(status_code=400, detail="GPS coordinates are out of valid range.")

    # Require a meaningful address (but allow short ones if GPS is provided)
    trivial = {"", "location not specified", "captured gps location", "unknown"}
    if address.lower() in trivial or len(address) < 3:
        raise HTTPException(
            status_code=400,
            detail="Please enter a valid address before submitting the complaint."
        )


# ── CREATE ────────────────────────────────────────────────────────────────────

@router.post("/", response_model=ComplaintResponse, status_code=status.HTTP_201_CREATED)
async def create_complaint(
    complaint_data: ComplaintCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new complaint with AI analysis."""
    db = get_database()

    complaint_dict = complaint_data.model_dump()
    validate_complaint_location(complaint_dict.get("location", {}))

    complaint_dict["reported_by"] = current_user["_id"]
    complaint_dict["reported_at"] = datetime.utcnow()
    complaint_dict["updated_at"] = datetime.utcnow()
    complaint_dict["status"] = "pending"
    complaint_dict["votes"] = 0
    complaint_dict["support_count"] = 1
    complaint_dict["supported_by"] = [current_user["_id"]]
    complaint_dict["comments"] = []
    complaint_dict["progress_percentage"] = 0
    complaint_dict["before_work_photos"] = []
    complaint_dict["progress_photos"] = []
    complaint_dict["completion_photos"] = []

    # ── YOLO image analysis ───────────────────────────────────────────────────
    yolo_analysis = None
    for image_url in complaint_dict.get("images", []):
        image_path = image_url_to_path(image_url)
        if image_path:
            try:
                yolo_analysis = road_ai_service.analyze_image(
                    image_path,
                    preferred_category=complaint_dict["category"],
                    title=complaint_dict["title"],
                    description=complaint_dict["description"],
                )
            except Exception as e:
                print(f"YOLO analysis failed: {e}")
            break

    # ── Text-based AI analysis (fallback) ────────────────────────────────────
    ai_analysis = ai_service.analyze_complaint(
        complaint_dict["title"],
        complaint_dict["description"],
        complaint_dict["category"]
    )

    # Determine category — YOLO wins if available, else text AI
    issue_type = yolo_analysis["issueType"] if yolo_analysis else ai_analysis["category"]
    category = normalize_issue_type(issue_type)
    # Guard: only use recognized categories
    valid_categories = ["pothole", "crack", "flooding", "debris", "streetlight", "drainage", "other"]
    if category not in valid_categories:
        category = complaint_dict["category"]  # keep user selection

    confidence = yolo_analysis["confidence"] if yolo_analysis else ai_analysis.get("confidence", 0.7)

    # Build DetectionBox-like objects for severity calculation
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

    complaint_dict["category"] = category
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
        "category": category,
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

    # ── Duplicate detection ───────────────────────────────────────────────────
    coordinates = complaint_dict["location"]["coordinates"]
    try:
        existing_complaints = await db.complaints.find({
            "status": {"$nin": ["resolved", "closed", "rejected"]},
            "location.coordinates": {
                "$near": {
                    "$geometry": {"type": "Point", "coordinates": coordinates},
                    "$maxDistance": settings.DUPLICATE_RADIUS_METERS,
                }
            }
        }).to_list(25)
    except Exception:
        existing_complaints = []

    incoming_text = f"{complaint_dict['title']} {complaint_dict['description']} {complaint_dict['category']}"
    duplicate = None
    for existing in existing_complaints:
        same_category = existing.get("category") == complaint_dict["category"]
        similarity = text_similarity(
            incoming_text,
            f"{existing.get('title', '')} {existing.get('description', '')} {existing.get('category', '')}"
        )
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
        "New Complaint Filed",
        f"New {complaint_dict['severity']} severity {complaint_dict['category']} complaint submitted by {current_user['name']}.",
        ["government", "superadmin"],
        result.inserted_id,
    )

    return serialize_complaint(complaint_dict)


# ── LIST ──────────────────────────────────────────────────────────────────────

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
    """List complaints with filters and pagination."""
    db = get_database()

    query = {}

    # Citizens always see only their own complaints
    if my_complaints or current_user["role"] == "citizen":
        query["reported_by"] = current_user["_id"]
    elif current_user["role"] == "contractor":
        # Contractors see their assigned complaints
        contractor = await db.contractors.find_one({"user_id": current_user["_id"]})
        if contractor:
            query["assigned_to"] = contractor["_id"]

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

    total = await db.complaints.count_documents(query)
    skip = (page - 1) * page_size
    complaints = await db.complaints.find(query)\
        .sort([("priority_score", -1), ("reported_at", -1)])\
        .skip(skip)\
        .limit(page_size)\
        .to_list(page_size)

    complaints = [serialize_complaint(c) for c in complaints]

    return ComplaintListResponse(
        complaints=complaints,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size
    )


# ── PRIORITY QUEUE ────────────────────────────────────────────────────────────

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
    complaints = await db.complaints.find(query)\
        .sort([("priority_score", -1), ("support_count", -1)])\
        .limit(50)\
        .to_list(50)
    return {"complaints": [serialize_complaint(c) for c in complaints]}


# ── GET ONE ───────────────────────────────────────────────────────────────────

@router.get("/{complaint_id}", response_model=ComplaintResponse)
async def get_complaint(
    complaint_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific complaint by ID."""
    db = get_database()

    if not ObjectId.is_valid(complaint_id):
        raise HTTPException(status_code=400, detail="Invalid complaint ID format.")

    complaint = await db.complaints.find_one({"_id": ObjectId(complaint_id)})

    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found.")

    return serialize_complaint(complaint)


# ── UPDATE ────────────────────────────────────────────────────────────────────

@router.put("/{complaint_id}", response_model=ComplaintResponse)
async def update_complaint(
    complaint_id: str,
    update_data: ComplaintUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update a complaint. Government/superadmin can update any field.
    Contractors can update progress on their assigned complaints."""
    db = get_database()

    if not ObjectId.is_valid(complaint_id):
        raise HTTPException(status_code=400, detail="Invalid complaint ID format.")

    complaint = await db.complaints.find_one({"_id": ObjectId(complaint_id)})
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found.")

    if complaint.get("status") in ["closed", "rejected"]:
        raise HTTPException(status_code=400, detail=f"Cannot update a {complaint.get('status')} complaint.")

    role = current_user.get("role")

    # Role-based field restrictions
    if role == "contractor":
        # Contractors may only update progress on their assigned complaints
        contractor = await db.contractors.find_one({"user_id": current_user["_id"]})
        if not contractor or complaint.get("assigned_to") != contractor["_id"]:
            raise HTTPException(
                status_code=403,
                detail="You can only update complaints assigned to you."
            )
        # Contractors limited to progress fields only
        allowed_fields = {"progress_percentage", "work_notes", "progress_photos", "completion_photos"}
        update_data_dict = update_data.model_dump()
        update_dict = {k: v for k, v in update_data_dict.items() if k in allowed_fields and v is not None}
    elif role in ["government", "superadmin"]:
        update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    else:
        raise HTTPException(status_code=403, detail="Insufficient permissions.")

    # Handle assigned_to conversion for gov/admin
    if "assigned_to" in update_dict and role in ["government", "superadmin"]:
        if ObjectId.is_valid(update_dict["assigned_to"]):
            contractor_oid = ObjectId(update_dict["assigned_to"])
            contractor = await db.contractors.find_one({"_id": contractor_oid})
            if contractor:
                update_dict["assigned_to"] = contractor_oid
                # Store the company name for display
                update_dict["assigned_contractor_name"] = contractor.get("company", "Unknown Contractor")

    if update_dict.get("status") == "resolved":
        update_dict["resolved_at"] = datetime.utcnow()

    update_dict["updated_at"] = datetime.utcnow()

    if update_dict:
        await db.complaints.update_one(
            {"_id": ObjectId(complaint_id)},
            {"$set": update_dict}
        )
        # Notify on status changes
        if "status" in update_dict:
            title_by_status = {
                "verified": "Complaint Verified",
                "assigned": "Complaint Assigned to Contractor",
                "in_progress": "Repair Work Started",
                "resolved": "Repair Completed",
                "validation_pending": "Citizen Verification Requested",
                "closed": "Complaint Closed",
                "rejected": "Complaint Rejected",
            }
            notif_title = title_by_status.get(update_dict["status"])
            if notif_title:
                await create_notification(
                    db,
                    notif_title,
                    f"Complaint status updated to '{update_dict['status'].replace('_', ' ')}'.",
                    ["citizen", "government", "superadmin", "contractor"],
                    ObjectId(complaint_id),
                )

    updated = await db.complaints.find_one({"_id": ObjectId(complaint_id)})
    return serialize_complaint(updated)


# ── VOTE ──────────────────────────────────────────────────────────────────────

@router.post("/{complaint_id}/vote")
async def vote_complaint(
    complaint_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Upvote a complaint."""
    db = get_database()

    if not ObjectId.is_valid(complaint_id):
        raise HTTPException(status_code=400, detail="Invalid complaint ID.")

    result = await db.complaints.update_one(
        {"_id": ObjectId(complaint_id)},
        {"$inc": {"votes": 1}, "$set": {"updated_at": datetime.utcnow()}}
    )

    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Complaint not found.")

    return {"message": "Vote recorded successfully."}


# ── SUPPORT ───────────────────────────────────────────────────────────────────

@router.post("/{complaint_id}/support", response_model=ComplaintResponse)
async def support_complaint(
    complaint_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Support an existing nearby complaint instead of creating a duplicate."""
    db = get_database()

    if not ObjectId.is_valid(complaint_id):
        raise HTTPException(status_code=400, detail="Invalid complaint ID.")

    result = await db.complaints.update_one(
        {"_id": ObjectId(complaint_id)},
        {
            "$inc": {"votes": 1, "support_count": 1},
            "$addToSet": {"supported_by": current_user["_id"]},
            "$set": {"updated_at": datetime.utcnow()}
        }
    )

    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Complaint not found.")

    updated = await db.complaints.find_one({"_id": ObjectId(complaint_id)})
    support_count = updated.get("support_count", 1)
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
        {"$set": {
            "priority_score": priority_score,
            "ai_analysis.priority_score": priority_score,
            "ai_analysis.priority": priority_score
        }}
    )
    updated = await db.complaints.find_one({"_id": ObjectId(complaint_id)})
    return serialize_complaint(updated)


# ── COMMENT ───────────────────────────────────────────────────────────────────

@router.post("/{complaint_id}/comment")
async def add_comment(
    complaint_id: str,
    content: str,
    current_user: dict = Depends(get_current_user)
):
    """Add a comment to a complaint."""
    db = get_database()

    if not ObjectId.is_valid(complaint_id):
        raise HTTPException(status_code=400, detail="Invalid complaint ID.")

    if not content or not content.strip():
        raise HTTPException(status_code=400, detail="Comment content cannot be empty.")

    comment = {
        "id": str(ObjectId()),
        "user_id": str(current_user["_id"]),
        "user_name": current_user["name"],
        "user_role": current_user.get("role", "citizen"),
        "content": content.strip(),
        "created_at": datetime.utcnow()
    }

    result = await db.complaints.update_one(
        {"_id": ObjectId(complaint_id)},
        {
            "$push": {"comments": comment},
            "$set": {"updated_at": datetime.utcnow()}
        }
    )

    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Complaint not found.")

    # Serialize datetime for response
    comment["created_at"] = comment["created_at"].isoformat()
    return {"message": "Comment added successfully.", "comment": comment}


# ── ASSIGN ────────────────────────────────────────────────────────────────────

@router.post("/{complaint_id}/assign")
async def assign_complaint(
    complaint_id: str,
    contractor_id: str,
    current_user: dict = Depends(require_roles(["government", "superadmin"]))
):
    """Assign a complaint to a contractor by contractor profile ID."""
    db = get_database()

    if not ObjectId.is_valid(complaint_id) or not ObjectId.is_valid(contractor_id):
        raise HTTPException(status_code=400, detail="Invalid ID format.")

    # Find contractor profile
    contractor = await db.contractors.find_one({"_id": ObjectId(contractor_id)})
    if not contractor:
        raise HTTPException(status_code=404, detail="Contractor not found.")

    # Verify the contractor has an active linked user
    if contractor.get("user_id"):
        contractor_user = await db.users.find_one({
            "_id": contractor["user_id"],
            "role": "contractor",
            "is_active": True
        })
        if not contractor_user:
            raise HTTPException(
                status_code=400,
                detail="Contractor is not linked to an active user account."
            )

    result = await db.complaints.update_one(
        {"_id": ObjectId(complaint_id)},
        {
            "$set": {
                "assigned_to": ObjectId(contractor_id),
                "assigned_contractor_name": contractor.get("company", "Unknown Contractor"),
                "status": "assigned",
                "updated_at": datetime.utcnow()
            }
        }
    )

    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Complaint not found.")

    await create_notification(
        db,
        "Complaint Assigned",
        f"Complaint assigned to {contractor.get('company', 'contractor')} by {current_user['name']}.",
        ["contractor", "government", "superadmin"],
        ObjectId(complaint_id)
    )
    return {
        "message": "Complaint assigned successfully.",
        "contractor_name": contractor.get("company")
    }


# ── ANALYZE TEXT ──────────────────────────────────────────────────────────────

@router.post("/analyze")
async def analyze_complaint_text(
    title: str,
    description: str,
    category: Optional[str] = None
):
    """Get AI analysis for complaint text preview (no auth required)."""
    if not title or not description:
        raise HTTPException(status_code=400, detail="Title and description are required.")
    analysis = ai_service.analyze_complaint(title, description, category)
    return analysis


# ── ANALYZE IMAGE ─────────────────────────────────────────────────────────────

@router.post("/analyze-image")
async def analyze_complaint_image(
    image_url: str,
    category: Optional[str] = None,
    title: str = "",
    description: str = "",
    filename: str = "",
    current_user: dict = Depends(get_current_user)
):
    """Run YOLO road-defect analysis on an uploaded image."""
    image_path = image_url_to_path(image_url)
    if not image_path:
        raise HTTPException(status_code=404, detail="Uploaded image not found. Please re-upload.")
    try:
        result = road_ai_service.analyze_image(
            image_path,
            preferred_category=category,
            title=title,
            description=description,
            original_filename=filename,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image analysis failed: {str(e)}")


# ── REPAIR VALIDATION ─────────────────────────────────────────────────────────

@router.post("/{complaint_id}/repair-validation")
async def validate_repair(
    complaint_id: str,
    after_image_url: str,
    current_user: dict = Depends(get_current_user)
):
    """Compare before and after repair images and request citizen verification."""
    db = get_database()
    if not ObjectId.is_valid(complaint_id):
        raise HTTPException(status_code=400, detail="Invalid complaint ID.")

    complaint = await db.complaints.find_one({"_id": ObjectId(complaint_id)})
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found.")

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
                "updated_at": datetime.utcnow()
            }
        }
    )
    await create_notification(
        db,
        "Verification Requested",
        "AI repair validation complete. Citizen verification requested.",
        ["citizen", "government"],
        ObjectId(complaint_id)
    )
    return validation


# ── CITIZEN VERIFICATION ──────────────────────────────────────────────────────

@router.post("/{complaint_id}/citizen-verification")
async def citizen_verification(
    complaint_id: str,
    fixed: bool,
    notes: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Citizen confirms whether a completed repair is satisfactory."""
    db = get_database()
    if not ObjectId.is_valid(complaint_id):
        raise HTTPException(status_code=400, detail="Invalid complaint ID.")

    status_value = "closed" if fixed else "in_progress"
    verification = {
        "fixed": fixed,
        "notes": notes,
        "verified_by": str(current_user["_id"]),
        "verified_at": datetime.utcnow().isoformat(),
    }
    result = await db.complaints.update_one(
        {"_id": ObjectId(complaint_id)},
        {
            "$set": {
                "citizen_verification": verification,
                "status": status_value,
                "updated_at": datetime.utcnow()
            }
        }
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Complaint not found.")

    await create_notification(
        db,
        "Repair Verified ✓" if fixed else "Repair Rejected — Reopened",
        "Citizen accepted the repair." if fixed else "Citizen rejected the repair and the complaint has been reopened.",
        ["government", "superadmin", "contractor"],
        ObjectId(complaint_id),
    )
    return {"message": "Verification recorded.", "status": status_value}


# ── IMAGE UPLOAD ──────────────────────────────────────────────────────────────

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
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"File type '{file.content_type}' not allowed. Use JPEG, PNG, WEBP, or GIF."
        )

    contents = await file.read()

    if len(contents) > settings.MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size is {settings.MAX_FILE_SIZE // 1024 // 1024}MB."
        )

    # Validate it's a real image
    try:
        img = Image.open(io.BytesIO(contents))
        img.verify()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid or corrupted image file.")

    # Re-open after verify (verify closes the file)
    img = Image.open(io.BytesIO(contents))

    # Resize if too large
    max_dim = 2000
    if img.width > max_dim or img.height > max_dim:
        img.thumbnail((max_dim, max_dim), Image.LANCZOS)

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

    return {
        "url": f"/uploads/{filename}",
        "filename": filename,
        "size": len(buf.getvalue()),
        "content_type": file.content_type
    }
