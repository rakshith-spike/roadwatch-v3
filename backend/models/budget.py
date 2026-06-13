from pydantic import BaseModel, Field
from typing import Optional, List, Literal
from datetime import datetime

class BudgetBase(BaseModel):
    project_id: str
    project_title: str
    contractor: str
    amount: float
    type: Literal["allocation", "disbursement", "request", "revision"]
    notes: Optional[str] = None
    district: str
    source: Optional[str] = None
    sanction_reference: Optional[str] = None

class BudgetCreate(BudgetBase):
    pass

class BudgetResponse(BudgetBase):
    id: str = Field(alias="_id")
    status: Literal["pending", "approved", "rejected"]
    requested_at: datetime
    approved_at: Optional[datetime] = None
    approved_by: Optional[str] = None

    class Config:
        populate_by_name = True
        json_encoders = {datetime: lambda v: v.isoformat()}

class BudgetListResponse(BaseModel):
    entries: List[BudgetResponse]
    total: int
