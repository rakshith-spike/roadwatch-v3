from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import Optional, List
from datetime import datetime
from bson import ObjectId

from database import get_database
from models.project import (
    ProjectCreate,
    ProjectUpdate,
    ProjectResponse,
    ProjectListResponse
)
from utils.security import get_current_user, require_roles

router = APIRouter(prefix="/projects", tags=["Projects"])

def serialize_project(project: dict) -> dict:
    """Convert MongoDB document to response format"""
    project["_id"] = str(project["_id"])
    project["contractor_id"] = str(project["contractor_id"])
    project["complaint_ids"] = [str(c) for c in project.get("complaint_ids", [])]
    return project

@router.post("/", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    project_data: ProjectCreate,
    current_user: dict = Depends(require_roles(["government", "superadmin"]))
):
    """Create a new project"""
    db = get_database()
    
    # Verify contractor exists
    if not ObjectId.is_valid(project_data.contractor_id):
        raise HTTPException(status_code=400, detail="Invalid contractor ID")
    
    contractor = await db.contractors.find_one({"_id": ObjectId(project_data.contractor_id)})
    if not contractor:
        raise HTTPException(status_code=404, detail="Contractor not found")
    
    # Prepare project document
    project_dict = project_data.model_dump()
    project_dict["contractor_id"] = ObjectId(project_data.contractor_id)
    project_dict["complaint_ids"] = [ObjectId(c) for c in project_data.complaint_ids]
    project_dict["spent"] = 0
    project_dict["status"] = "planned"
    project_dict["progress"] = 0
    project_dict["work_logs"] = []
    project_dict["created_at"] = datetime.utcnow()
    
    # Insert project
    result = await db.projects.insert_one(project_dict)
    project_dict["_id"] = result.inserted_id
    
    # Update contractor active projects count
    await db.contractors.update_one(
        {"_id": ObjectId(project_data.contractor_id)},
        {"$inc": {"active_projects": 1}}
    )
    
    # Update complaints status
    if project_data.complaint_ids:
        await db.complaints.update_many(
            {"_id": {"$in": [ObjectId(c) for c in project_data.complaint_ids]}},
            {"$set": {"status": "in_progress", "assigned_to": ObjectId(project_data.contractor_id)}}
        )
    
    return serialize_project(project_dict)

@router.get("/", response_model=ProjectListResponse)
async def list_projects(
    status: Optional[str] = None,
    contractor_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """List projects"""
    db = get_database()
    
    query = {}
    
    # Contractors can only see their own projects
    if current_user["role"] == "contractor":
        contractor = await db.contractors.find_one({"user_id": current_user["_id"]})
        if contractor:
            query["contractor_id"] = contractor["_id"]
    elif contractor_id and ObjectId.is_valid(contractor_id):
        query["contractor_id"] = ObjectId(contractor_id)
    
    if status:
        query["status"] = status
    
    projects = await db.projects.find(query)\
        .sort("created_at", -1)\
        .to_list(100)
    
    projects = [serialize_project(p) for p in projects]
    
    return ProjectListResponse(projects=projects, total=len(projects))

@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific project"""
    db = get_database()
    
    if not ObjectId.is_valid(project_id):
        raise HTTPException(status_code=400, detail="Invalid project ID")
    
    project = await db.projects.find_one({"_id": ObjectId(project_id)})
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    return serialize_project(project)

@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: str,
    update_data: ProjectUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update a project"""
    db = get_database()
    
    if not ObjectId.is_valid(project_id):
        raise HTTPException(status_code=400, detail="Invalid project ID")
    
    # Get existing project
    project = await db.projects.find_one({"_id": ObjectId(project_id)})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Check permissions
    if current_user["role"] == "contractor":
        contractor = await db.contractors.find_one({"user_id": current_user["_id"]})
        if not contractor or contractor["_id"] != project["contractor_id"]:
            raise HTTPException(status_code=403, detail="Not authorized")
    
    # Prepare update
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    
    # Handle project completion
    old_status = project.get("status")
    new_status = update_dict.get("status")
    
    if update_dict:
        await db.projects.update_one(
            {"_id": ObjectId(project_id)},
            {"$set": update_dict}
        )
    
    # Update contractor stats if completed
    if new_status == "completed" and old_status != "completed":
        await db.contractors.update_one(
            {"_id": project["contractor_id"]},
            {
                "$inc": {"completed_projects": 1, "active_projects": -1}
            }
        )
        
        # Update related complaints
        await db.complaints.update_many(
            {"_id": {"$in": project.get("complaint_ids", [])}},
            {"$set": {"status": "resolved", "resolved_at": datetime.utcnow()}}
        )
    
    updated = await db.projects.find_one({"_id": ObjectId(project_id)})
    return serialize_project(updated)

@router.post("/{project_id}/work-log")
async def add_work_log(
    project_id: str,
    description: str,
    workers_count: int,
    materials_used: List[str] = [],
    current_user: dict = Depends(get_current_user)
):
    """Add a work log entry"""
    db = get_database()
    
    if not ObjectId.is_valid(project_id):
        raise HTTPException(status_code=400, detail="Invalid project ID")
    
    work_log = {
        "id": str(ObjectId()),
        "date": datetime.utcnow(),
        "description": description,
        "workers_count": workers_count,
        "materials_used": materials_used,
        "images": [],
        "created_by": str(current_user["_id"])
    }
    
    result = await db.projects.update_one(
        {"_id": ObjectId(project_id)},
        {"$push": {"work_logs": work_log}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    
    return {"message": "Work log added", "work_log": work_log}

@router.put("/{project_id}/milestone/{milestone_index}")
async def update_milestone(
    project_id: str,
    milestone_index: int,
    completed: bool,
    current_user: dict = Depends(get_current_user)
):
    """Update a milestone status"""
    db = get_database()
    
    if not ObjectId.is_valid(project_id):
        raise HTTPException(status_code=400, detail="Invalid project ID")
    
    result = await db.projects.update_one(
        {"_id": ObjectId(project_id)},
        {"$set": {f"milestones.{milestone_index}.completed": completed}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Project or milestone not found")
    
    return {"message": "Milestone updated"}
