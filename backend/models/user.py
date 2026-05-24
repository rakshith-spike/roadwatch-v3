from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Literal
from datetime import datetime
from bson import ObjectId

class PyObjectId(str):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v, handler):
        if isinstance(v, ObjectId):
            return str(v)
        if isinstance(v, str) and ObjectId.is_valid(v):
            return v
        raise ValueError("Invalid ObjectId")

class UserBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    phone: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None

class UserCreate(UserBase):
    password: str = Field(..., min_length=6)
    role: Literal["citizen", "contractor", "government", "superadmin"] = "citizen"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None

class UserResponse(UserBase):
    id: str = Field(alias="_id")
    role: str
    created_at: datetime
    is_active: bool = True

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str, datetime: lambda v: v.isoformat()}

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class UserInDB(UserBase):
    id: str
    role: str
    password: str
    created_at: datetime
    is_active: bool = True
