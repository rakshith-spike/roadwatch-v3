from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import Optional, List
from datetime import datetime
from bson import ObjectId

from database import get_database
from models.budget import BudgetCreate, BudgetResponse, BudgetListResponse
from utils.security import get_current_user, require_roles

router = APIRouter(prefix="/budget", tags=["Budget"])

def serialize_budget(entry: dict) -> dict:
    entry["_id"] = str(entry["_id"])
    if "requested_at" in entry and hasattr(entry["requested_at"], "isoformat"):
        entry["requested_at"] = entry["requested_at"].isoformat()
    if "approved_at" in entry and entry.get("approved_at") and hasattr(entry["approved_at"], "isoformat"):
        entry["approved_at"] = entry["approved_at"].isoformat()
    return entry

@router.get("/", response_model=BudgetListResponse)
async def list_budget_entries(
    status: Optional[str] = None,
    type: Optional[str] = None,
    project_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    db = get_database()
    query = {}
    if status:
        query["status"] = status
    if type:
        query["type"] = type
    if project_id:
        query["project_id"] = project_id
        
    entries = await db.budget.find(query).sort("requested_at", -1).to_list(100)
    serialized = [serialize_budget(e) for e in entries]
    return BudgetListResponse(entries=serialized, total=len(serialized))

@router.post("/", response_model=BudgetResponse, status_code=status.HTTP_201_CREATED)
async def create_budget_entry(
    entry_data: BudgetCreate,
    current_user: dict = Depends(get_current_user)
):
    db = get_database()
    entry_dict = entry_data.model_dump()
    
    # Auto-approve allocations/disbursements by admin
    is_admin = current_user["role"] in ["government", "superadmin"]
    entry_dict["status"] = "approved" if (is_admin and entry_dict["type"] in ["allocation", "disbursement"]) else "pending"
    entry_dict["requested_at"] = datetime.utcnow()
    
    if entry_dict["status"] == "approved":
        entry_dict["approved_at"] = datetime.utcnow()
        entry_dict["approved_by"] = current_user["name"]
        
        # Apply budget updates to project if project exists
        if ObjectId.is_valid(entry_dict["project_id"]):
            project = await db.projects.find_one({"_id": ObjectId(entry_dict["project_id"])})
            if project:
                if entry_dict["type"] == "allocation":
                    await db.projects.update_one(
                        {"_id": project["_id"]},
                        {"$inc": {"budget": entry_dict["amount"]}}
                    )
                elif entry_dict["type"] == "disbursement":
                    await db.projects.update_one(
                        {"_id": project["_id"]},
                        {"$inc": {"spent": entry_dict["amount"]}}
                    )
                    
    result = await db.budget.insert_one(entry_dict)
    entry_dict["_id"] = result.inserted_id
    return serialize_budget(entry_dict)

@router.post("/{entry_id}/approve", response_model=BudgetResponse)
async def approve_budget_entry(
    entry_id: str,
    current_user: dict = Depends(require_roles(["government", "superadmin"]))
):
    db = get_database()
    if not ObjectId.is_valid(entry_id):
        raise HTTPException(status_code=400, detail="Invalid budget entry ID")
        
    entry = await db.budget.find_one({"_id": ObjectId(entry_id)})
    if not entry:
        raise HTTPException(status_code=404, detail="Budget entry not found")
        
    if entry["status"] != "pending":
        raise HTTPException(status_code=400, detail=f"Budget entry is already {entry['status']}")
        
    # Apply to project
    if ObjectId.is_valid(entry["project_id"]):
        project = await db.projects.find_one({"_id": ObjectId(entry["project_id"])})
        if project:
            if entry["type"] in ["allocation", "request", "revision"]:
                await db.projects.update_one(
                    {"_id": project["_id"]},
                    {"$inc": {"budget": entry["amount"]}}
                )
            elif entry["type"] == "disbursement":
                await db.projects.update_one(
                    {"_id": project["_id"]},
                    {"$inc": {"spent": entry["amount"]}}
                )
                
    await db.budget.update_one(
        {"_id": ObjectId(entry_id)},
        {
            "$set": {
                "status": "approved",
                "approved_at": datetime.utcnow(),
                "approved_by": current_user["name"]
            }
        }
    )
    
    updated = await db.budget.find_one({"_id": ObjectId(entry_id)})
    return serialize_budget(updated)

@router.post("/{entry_id}/reject", response_model=BudgetResponse)
async def reject_budget_entry(
    entry_id: str,
    notes: Optional[str] = Query(None),
    current_user: dict = Depends(require_roles(["government", "superadmin"]))
):
    db = get_database()
    if not ObjectId.is_valid(entry_id):
        raise HTTPException(status_code=400, detail="Invalid budget entry ID")
        
    entry = await db.budget.find_one({"_id": ObjectId(entry_id)})
    if not entry:
        raise HTTPException(status_code=404, detail="Budget entry not found")
        
    if entry["status"] != "pending":
        raise HTTPException(status_code=400, detail=f"Budget entry is already {entry['status']}")
        
    update_fields = {
        "status": "rejected",
        "approved_at": datetime.utcnow(),
        "approved_by": current_user["name"]
    }
    if notes:
        update_fields["notes"] = notes
        
    await db.budget.update_one(
        {"_id": ObjectId(entry_id)},
        {"$set": update_fields}
    )
    
    updated = await db.budget.find_one({"_id": ObjectId(entry_id)})
    return serialize_budget(updated)
