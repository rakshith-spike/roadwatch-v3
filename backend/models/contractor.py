from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class ContractorBase(BaseModel):
    company: str
    license: str
    regions: List[str] = []
    specialization: List[str] = []

class ContractorCreate(ContractorBase):
    user_id: str

class ContractorUpdate(BaseModel):
    company: Optional[str] = None
    license: Optional[str] = None
    regions: Optional[List[str]] = None
    specialization: Optional[List[str]] = None

class ContractorResponse(ContractorBase):
    id: str = Field(alias="_id")
    user_id: str
    rating: float = 0.0
    completed_projects: int = 0
    active_projects: int = 0
    total_budget: float = 0.0
    performance_score: int = 0
    created_at: datetime

    class Config:
        populate_by_name = True
        json_encoders = {datetime: lambda v: v.isoformat()}

class ContractorListResponse(BaseModel):
    contractors: List[ContractorResponse]
    total: int
