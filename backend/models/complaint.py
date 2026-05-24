from pydantic import BaseModel, Field
from typing import Optional, List, Literal
from datetime import datetime

class Location(BaseModel):
    type: str = "Point"
    coordinates: List[float]  # [longitude, latitude]
    address: str
    district: str
    state: str

class AIAnalysis(BaseModel):
    category: str
    severity: str
    estimated_cost: float
    priority: int
    confidence: float = 0.0
    duplicate_of: Optional[str] = None

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

class ComplaintUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    severity: Optional[Literal["low", "medium", "high", "critical"]] = None
    status: Optional[Literal["pending", "verified", "assigned", "in_progress", "resolved", "rejected"]] = None
    assigned_to: Optional[str] = None

class ComplaintResponse(ComplaintBase):
    id: str = Field(alias="_id")
    severity: Literal["low", "medium", "high", "critical"]
    status: Literal["pending", "verified", "assigned", "in_progress", "resolved", "rejected"]
    images: List[str] = []
    reported_by: str
    reported_at: datetime
    assigned_to: Optional[str] = None
    resolved_at: Optional[datetime] = None
    ai_analysis: Optional[AIAnalysis] = None
    votes: int = 0
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
