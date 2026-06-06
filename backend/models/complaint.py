from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Literal, Dict, Any
from datetime import datetime

class Location(BaseModel):
    type: str = "Point"
    coordinates: List[float]  # [longitude, latitude]
    address: str
    district: str
    state: str

class AIAnalysis(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    category: str
    severity: str
    estimated_cost: float
    priority: int
    confidence: float = 0.0
    duplicate_of: Optional[str] = None
    issue_type: Optional[str] = None
    severity_score: Optional[int] = None
    bounding_boxes: List[Dict[str, Any]] = []
    annotated_image: Optional[str] = None
    cost_range: Optional[List[int]] = None
    cost_reasoning: Optional[str] = None
    estimated_days: Optional[int] = None
    priority_score: Optional[int] = None
    traffic_importance: Optional[int] = None
    model: Optional[str] = None
    model_status: Optional[str] = None

class Comment(BaseModel):
    id: str
    user_id: str
    user_name: str
    content: str
    created_at: datetime

class ComplaintBase(BaseModel):
    title: str = Field(..., min_length=5, max_length=200)
    description: str = Field(..., min_length=10, max_length=2000)
    category: Literal["pothole", "crack", "flooding", "debris", "streetlight", "drainage", "other"]
    location: Location

class ComplaintCreate(ComplaintBase):
    images: List[str] = []
    traffic_importance: Optional[int] = None

class ComplaintUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    severity: Optional[Literal["low", "medium", "high", "critical"]] = None
    status: Optional[Literal["pending", "verified", "assigned", "in_progress", "resolved", "rejected", "validation_pending", "closed"]] = None
    assigned_to: Optional[str] = None
    progress_percentage: Optional[int] = None
    work_notes: Optional[str] = None
    before_work_photos: Optional[List[str]] = None
    progress_photos: Optional[List[str]] = None
    completion_photos: Optional[List[str]] = None

class ComplaintResponse(ComplaintBase):
    id: str = Field(alias="_id")
    severity: Literal["low", "medium", "high", "critical"]
    status: Literal["pending", "verified", "assigned", "in_progress", "resolved", "rejected", "validation_pending", "closed"]
    images: List[str] = []
    reported_by: str
    reported_at: datetime
    assigned_to: Optional[str] = None
    resolved_at: Optional[datetime] = None
    ai_analysis: Optional[AIAnalysis] = None
    votes: int = 0
    support_count: int = 0
    supported_by: List[str] = []
    duplicate_of: Optional[str] = None
    estimated_cost: Optional[float] = None
    cost_range: Optional[List[int]] = None
    cost_reasoning: Optional[str] = None
    estimated_days: Optional[int] = None
    priority_score: Optional[int] = None
    severity_score: Optional[int] = None
    traffic_importance: Optional[int] = None
    annotated_image: Optional[str] = None
    progress_percentage: int = 0
    before_work_photos: List[str] = []
    progress_photos: List[str] = []
    completion_photos: List[str] = []
    work_notes: Optional[str] = None
    repair_validation: Optional[Dict[str, Any]] = None
    citizen_verification: Optional[Dict[str, Any]] = None
    comments: List[Comment] = []

    class Config:
        populate_by_name = True
        json_encoders = {datetime: lambda v: v.isoformat()}

class ComplaintListResponse(BaseModel):
    complaints: List[ComplaintResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
