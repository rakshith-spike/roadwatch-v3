from pydantic import BaseModel, Field
from typing import Optional, List, Literal
from datetime import datetime

class ProjectLocation(BaseModel):
    type: str = "Point"
    coordinates: List[float]
    address: str
    district: str

class Milestone(BaseModel):
    title: str
    completed: bool = False
    date: datetime

class WorkLog(BaseModel):
    id: str
    date: datetime
    description: str
    workers_count: int
    materials_used: List[str] = []
    images: List[str] = []
    before_work_photos: List[str] = []
    progress_photos: List[str] = []
    completion_photos: List[str] = []
    progress_percentage: Optional[int] = None
    notes: Optional[str] = None
    created_by: str

class ProjectBase(BaseModel):
    title: str
    description: str
    budget: float
    start_date: datetime
    end_date: datetime
    location: ProjectLocation

class ProjectCreate(ProjectBase):
    contractor_id: str
    complaint_ids: List[str] = []
    milestones: List[Milestone] = []

class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    budget: Optional[float] = None
    spent: Optional[float] = None
    end_date: Optional[datetime] = None
    status: Optional[Literal["planned", "in_progress", "completed", "delayed", "on_hold"]] = None
    progress: Optional[int] = None

class ProjectResponse(ProjectBase):
    id: str = Field(alias="_id")
    contractor_id: str
    complaint_ids: List[str] = []
    spent: float = 0
    status: Literal["planned", "in_progress", "completed", "delayed", "on_hold"]
    progress: int = 0
    milestones: List[Milestone] = []
    work_logs: List[WorkLog] = []
    created_at: datetime

    class Config:
        populate_by_name = True
        json_encoders = {datetime: lambda v: v.isoformat()}

class ProjectListResponse(BaseModel):
    projects: List[ProjectResponse]
    total: int
