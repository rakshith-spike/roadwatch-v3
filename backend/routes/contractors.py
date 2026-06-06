from fastapi import APIRouter, HTTPException, status, Depends, Query
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
from utils.security import get_current_user, require_roles

router = APIRouter(prefix="/contractors", tags=["Contractors"])

def serialize_contractor(contractor: dict) -> dict:
    """Convert MongoDB document to response format"""
    contractor["_id"] = str(contractor["_id"])
    contractor["user_id"] = str(contractor["user_id"])
    return contractor

@router.get("/", response_model=ContractorListResponse)
async def list_contractors(
    region: Optional[str] = None,
    specialization: Optional[str] = None,
    min_rating: Optional[float] = None,
    current_user: dict = Depends(require_roles(["government", "superadmin"]))
):
    """List all contractors"""
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

    valid_user_ids = [c["user_id"] for c in contractors if c.get("user_id")]
    valid_users = await db.users.find({
        "_id": {"$in": valid_user_ids},
        "role": "contractor",
        "is_active": True,
    }).to_list(100)
    valid_user_map = {user["_id"]: user for user in valid_users}
    contractors = [
        {
            **c,
            "user_name": valid_user_map[c["user_id"]].get("name"),
            "email": valid_user_map[c["user_id"]].get("email"),
            "phone": valid_user_map[c["user_id"]].get("phone"),
        }
        for c in contractors
        if c.get("user_id") in valid_user_map
    ]
    
    contractors = [serialize_contractor(c) for c in contractors]
    
    return ContractorListResponse(contractors=contractors, total=len(contractors))

@router.get("/me", response_model=ContractorResponse)
async def get_my_contractor_profile(
    current_user: dict = Depends(get_current_user)
):
    """Get contractor profile for current user"""
    if current_user["role"] != "contractor":
        raise HTTPException(status_code=403, detail="Not a contractor")
    
    db = get_database()
    contractor = await db.contractors.find_one({"user_id": current_user["_id"]})
    
    if not contractor:
        raise HTTPException(status_code=404, detail="Contractor profile not found")
    
    return serialize_contractor(contractor)

@router.get("/{contractor_id}", response_model=ContractorResponse)
async def get_contractor(
    contractor_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific contractor"""
    db = get_database()
    
    if not ObjectId.is_valid(contractor_id):
        raise HTTPException(status_code=400, detail="Invalid contractor ID")
    
    contractor = await db.contractors.find_one({"_id": ObjectId(contractor_id)})
    
    if not contractor:
        raise HTTPException(status_code=404, detail="Contractor not found")
    
    return serialize_contractor(contractor)

@router.put("/{contractor_id}", response_model=ContractorResponse)
async def update_contractor(
    contractor_id: str,
    update_data: ContractorUpdate,
    current_user: dict = Depends(require_roles(["government", "superadmin"]))
):
    """Update contractor details"""
    db = get_database()
    
    if not ObjectId.is_valid(contractor_id):
        raise HTTPException(status_code=400, detail="Invalid contractor ID")
    
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    
    if update_dict:
        await db.contractors.update_one(
            {"_id": ObjectId(contractor_id)},
            {"$set": update_dict}
        )
    
    contractor = await db.contractors.find_one({"_id": ObjectId(contractor_id)})
    
    if not contractor:
        raise HTTPException(status_code=404, detail="Contractor not found")
    
    return serialize_contractor(contractor)

@router.get("/{contractor_id}/projects")
async def get_contractor_projects(
    contractor_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get all projects for a contractor"""
    db = get_database()
    
    if not ObjectId.is_valid(contractor_id):
        raise HTTPException(status_code=400, detail="Invalid contractor ID")
    
    projects = await db.projects.find({"contractor_id": ObjectId(contractor_id)})\
        .sort("created_at", -1)\
        .to_list(100)
    
    # Serialize
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
    """Get contractor performance metrics"""
    db = get_database()
    
    if not ObjectId.is_valid(contractor_id):
        raise HTTPException(status_code=400, detail="Invalid contractor ID")
    
    contractor = await db.contractors.find_one({"_id": ObjectId(contractor_id)})
    if not contractor:
        raise HTTPException(status_code=404, detail="Contractor not found")
    
    # Get projects stats
    projects = await db.projects.find({"contractor_id": ObjectId(contractor_id)}).to_list(100)
    
    completed = sum(1 for p in projects if p.get("status") == "completed")
    total_budget = sum(p.get("budget", 0) for p in projects)
    total_spent = sum(p.get("spent", 0) for p in projects)
    
    # Calculate metrics
    on_time = sum(1 for p in projects if p.get("status") == "completed" and 
                  p.get("end_date") and datetime.utcnow() <= p["end_date"])
    
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
        "on_time_completion_rate": round(on_time / completed * 100, 1) if completed > 0 else 0,
        "metrics": {
            "quality": 92,  # In production, calculate from ratings
            "timeliness": 85,
            "cost_efficiency": 88,
            "safety": 95
        }
    }
