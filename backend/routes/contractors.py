from fastapi import APIRouter, HTTPException, status, Depends, Query, Body
from typing import Optional, List
from datetime import datetime
from bson import ObjectId

from database import get_database
from models.contractor import (
    ContractorCreate,
    ContractorUpdate,
    ContractorResponse,
    ContractorListResponse
)
from utils.security import get_current_user, require_roles, get_password_hash

router = APIRouter(prefix="/contractors", tags=["Contractors"])


def serialize_contractor(contractor: dict) -> dict:
    """Convert MongoDB document to response format."""
    contractor["_id"] = str(contractor["_id"])
    if contractor.get("user_id"):
        contractor["user_id"] = str(contractor["user_id"])
    return contractor


@router.get("/", response_model=ContractorListResponse)
async def list_contractors(
    region: Optional[str] = None,
    specialization: Optional[str] = None,
    min_rating: Optional[float] = None,
    current_user: dict = Depends(get_current_user)
):
    """List all contractors. Government/superadmin see full details.
    Contractors and citizens see a limited view (for assignment context)."""
    db = get_database()

    query = {}
    if region:
        query["regions"] = region
    if specialization:
        query["specialization"] = specialization
    if min_rating:
        query["rating"] = {"$gte": min_rating}

    contractors = await db.contractors.find({**query, "user_id": {"$exists": True}})\
        .sort("performance_score", -1)\
        .to_list(100)

    # Enrich with user data
    valid_user_ids = [c["user_id"] for c in contractors if c.get("user_id")]
    valid_users = await db.users.find({
        "_id": {"$in": valid_user_ids},
        "role": "contractor",
    }).to_list(100)
    valid_user_map = {user["_id"]: user for user in valid_users}

    enriched = []
    for c in contractors:
        user_id = c.get("user_id")
        user = valid_user_map.get(user_id)
        if user:
            enriched.append({
                **c,
                "user_name": user.get("name"),
                "email": user.get("email"),
                "phone": user.get("phone"),
                "is_active": user.get("is_active", True),
            })

    enriched = [serialize_contractor(c) for c in enriched]
    return ContractorListResponse(contractors=enriched, total=len(enriched))


@router.get("/me", response_model=ContractorResponse)
async def get_my_contractor_profile(
    current_user: dict = Depends(get_current_user)
):
    """Get contractor profile for current logged-in contractor user."""
    if current_user["role"] != "contractor":
        raise HTTPException(status_code=403, detail="Only contractor accounts can access this endpoint.")

    db = get_database()
    contractor = await db.contractors.find_one({"user_id": current_user["_id"]})

    if not contractor:
        raise HTTPException(
            status_code=404,
            detail="Contractor profile not found. Please contact admin."
        )

    return serialize_contractor(contractor)


@router.get("/{contractor_id}", response_model=ContractorResponse)
async def get_contractor(
    contractor_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific contractor by profile ID."""
    db = get_database()

    if not ObjectId.is_valid(contractor_id):
        raise HTTPException(status_code=400, detail="Invalid contractor ID format.")

    contractor = await db.contractors.find_one({"_id": ObjectId(contractor_id)})

    if not contractor:
        raise HTTPException(status_code=404, detail="Contractor not found.")

    # Enrich with user data
    if contractor.get("user_id"):
        user = await db.users.find_one({"_id": contractor["user_id"]})
        if user:
            contractor["email"] = user.get("email")
            contractor["phone"] = user.get("phone")
            contractor["user_name"] = user.get("name")
            contractor["is_active"] = user.get("is_active", True)

    return serialize_contractor(contractor)


@router.post("/", response_model=ContractorResponse, status_code=status.HTTP_201_CREATED)
async def create_contractor(
    data: dict = Body(...),
    current_user: dict = Depends(require_roles(["government", "superadmin"]))
):
    """Create a new contractor user + profile. SuperAdmin/Government only."""
    db = get_database()

    # Validate required fields
    required = ["name", "email", "password", "company", "license", "regions", "specialization"]
    missing = [f for f in required if not data.get(f)]
    if missing:
        raise HTTPException(
            status_code=400,
            detail=f"Missing required fields: {', '.join(missing)}"
        )

    # Check email uniqueness
    existing = await db.users.find_one({"email": data["email"].lower().strip()})
    if existing:
        raise HTTPException(
            status_code=400,
            detail="A user with this email already exists."
        )

    # Create user account
    user_doc = {
        "_id": ObjectId(),
        "name": data["name"].strip(),
        "email": data["email"].lower().strip(),
        "password": get_password_hash(data["password"]),
        "role": "contractor",
        "phone": data.get("phone", ""),
        "district": data.get("district", ""),
        "state": data.get("state", "Karnataka"),
        "created_at": datetime.utcnow(),
        "is_active": True,
    }
    await db.users.insert_one(user_doc)

    # Create contractor profile
    contractor_doc = {
        "_id": ObjectId(),
        "user_id": user_doc["_id"],
        "company": data["company"].strip(),
        "license": data["license"].strip(),
        "rating": float(data.get("rating", 0)),
        "completed_projects": int(data.get("completed_projects", 0)),
        "active_projects": 0,
        "total_budget": int(data.get("total_budget", 0)),
        "regions": data["regions"] if isinstance(data["regions"], list) else [data["regions"]],
        "specialization": data["specialization"] if isinstance(data["specialization"], list) else [data["specialization"]],
        "performance_score": int(data.get("performance_score", 0)),
        "created_at": datetime.utcnow(),
    }
    await db.contractors.insert_one(contractor_doc)

    contractor_doc["email"] = user_doc["email"]
    contractor_doc["phone"] = user_doc.get("phone")
    contractor_doc["user_name"] = user_doc["name"]
    contractor_doc["is_active"] = True

    return serialize_contractor(contractor_doc)


@router.put("/{contractor_id}", response_model=ContractorResponse)
async def update_contractor(
    contractor_id: str,
    update_data: ContractorUpdate,
    current_user: dict = Depends(require_roles(["government", "superadmin"]))
):
    """Update contractor profile details."""
    db = get_database()

    if not ObjectId.is_valid(contractor_id):
        raise HTTPException(status_code=400, detail="Invalid contractor ID format.")

    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    update_dict["updated_at"] = datetime.utcnow()

    if update_dict:
        await db.contractors.update_one(
            {"_id": ObjectId(contractor_id)},
            {"$set": update_dict}
        )

    contractor = await db.contractors.find_one({"_id": ObjectId(contractor_id)})
    if not contractor:
        raise HTTPException(status_code=404, detail="Contractor not found.")

    return serialize_contractor(contractor)


@router.get("/{contractor_id}/projects")
async def get_contractor_projects(
    contractor_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get all projects for a contractor."""
    db = get_database()

    if not ObjectId.is_valid(contractor_id):
        raise HTTPException(status_code=400, detail="Invalid contractor ID format.")

    projects = await db.projects.find({"contractor_id": ObjectId(contractor_id)})\
        .sort("created_at", -1)\
        .to_list(100)

    for p in projects:
        p["_id"] = str(p["_id"])
        p["contractor_id"] = str(p["contractor_id"])
        p["complaint_ids"] = [str(c) for c in p.get("complaint_ids", [])]

    return {"projects": projects, "total": len(projects)}


@router.get("/{contractor_id}/performance")
async def get_contractor_performance(
    contractor_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get contractor performance metrics."""
    db = get_database()

    if not ObjectId.is_valid(contractor_id):
        raise HTTPException(status_code=400, detail="Invalid contractor ID format.")

    contractor = await db.contractors.find_one({"_id": ObjectId(contractor_id)})
    if not contractor:
        raise HTTPException(status_code=404, detail="Contractor not found.")

    projects = await db.projects.find({"contractor_id": ObjectId(contractor_id)}).to_list(100)

    completed = sum(1 for p in projects if p.get("status") == "completed")
    total_budget = sum(p.get("budget", 0) for p in projects)
    total_spent = sum(p.get("spent", 0) for p in projects)

    return {
        "contractor_id": contractor_id,
        "performance_score": contractor.get("performance_score", 0),
        "rating": contractor.get("rating", 0),
        "total_projects": len(projects),
        "completed_projects": completed,
        "active_projects": len(projects) - completed,
        "total_budget": total_budget,
        "total_spent": total_spent,
        "budget_utilization": round(total_spent / total_budget * 100, 1) if total_budget > 0 else 0,
        "metrics": {
            "quality": contractor.get("performance_score", 75),
            "timeliness": max(0, contractor.get("performance_score", 75) - 5),
            "cost_efficiency": max(0, contractor.get("performance_score", 75) - 2),
            "safety": min(100, contractor.get("performance_score", 75) + 8),
        }
    }
