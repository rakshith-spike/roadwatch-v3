from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime
from bson import ObjectId
import asyncio

from database import get_database, seed_initial_data
from models.user import UserCreate, UserLogin, UserUpdate, UserResponse, TokenResponse
from utils.security import (
    get_password_hash, 
    verify_password, 
    create_access_token,
    get_current_user
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

async def _attach_contractor_id(db, user_dict):
    """If user is a contractor, attach their contractor profile ID."""
    if user_dict.get("role") == "contractor":
        contractor = await db.contractors.find_one({"user_id": user_dict["_id"]})
        if contractor:
            user_dict["contractor_id"] = str(contractor["_id"])
    return user_dict

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate):
    """Register a new user"""
    db = get_database()
    
    # Check if email already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create user
    user_dict = user_data.model_dump()
    user_dict["password"] = get_password_hash(user_dict["password"])
    user_dict["created_at"] = datetime.utcnow()
    user_dict["is_active"] = True
    
    result = await db.users.insert_one(user_dict)
    user_dict["_id"] = result.inserted_id
    
    # If a contractor registers themselves, create an empty profile
    if user_dict["role"] == "contractor":
        contractor_doc = {
            "user_id": user_dict["_id"],
            "company": f"{user_dict['name']} Infrastructure",
            "license": f"PENDING-{str(user_dict['_id'])[-6:]}",
            "rating": 0,
            "completed_projects": 0,
            "active_projects": 0,
            "total_budget": 0,
            "regions": [user_dict.get("district", "Bangalore Urban")],
            "specialization": ["General Road Repair"],
            "performance_score": 0,
            "created_at": datetime.utcnow()
        }
        c_result = await db.contractors.insert_one(contractor_doc)
        user_dict["contractor_id"] = str(c_result.inserted_id)

    # Create access token
    access_token = create_access_token(data={"sub": str(result.inserted_id)})
    
    # Prepare response
    user_response = UserResponse(
        _id=str(user_dict["_id"]),
        name=user_dict["name"],
        email=user_dict["email"],
        phone=user_dict.get("phone"),
        district=user_dict.get("district"),
        state=user_dict.get("state"),
        role=user_dict["role"],
        created_at=user_dict["created_at"],
        is_active=user_dict["is_active"],
        contractor_id=user_dict.get("contractor_id")
    )
    
    return TokenResponse(access_token=access_token, user=user_response)

@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    """Login user and return access token"""
    db = get_database()
    
    # Fast-path for demo seeding fallback: 
    # If DB was dropped but someone tries to login with demo credentials
    if credentials.email.endswith("@demo.com") and credentials.password == "demo123":
        user_count = await db.users.count_documents({})
        if user_count == 0:
            await seed_initial_data()
    
    # Find user
    user = await db.users.find_one({"email": credentials.email})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Verify password
    if not verify_password(credentials.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Check if active
    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is disabled"
        )

    # Attach contractor_id if applicable
    user = await _attach_contractor_id(db, user)
    
    # Create access token
    access_token = create_access_token(data={"sub": str(user["_id"])})
    
    # Prepare response
    user_response = UserResponse(
        _id=str(user["_id"]),
        name=user["name"],
        email=user["email"],
        phone=user.get("phone"),
        district=user.get("district"),
        state=user.get("state"),
        role=user["role"],
        created_at=user["created_at"],
        is_active=user.get("is_active", True),
        contractor_id=user.get("contractor_id")
    )
    
    return TokenResponse(access_token=access_token, user=user_response)

@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(current_user: dict = Depends(get_current_user)):
    """Get current user profile"""
    db = get_database()
    user = await _attach_contractor_id(db, current_user)

    return UserResponse(
        _id=str(user["_id"]),
        name=user["name"],
        email=user["email"],
        phone=user.get("phone"),
        district=user.get("district"),
        state=user.get("state"),
        role=user["role"],
        created_at=user["created_at"],
        is_active=user.get("is_active", True),
        contractor_id=user.get("contractor_id")
    )

@router.put("/me", response_model=UserResponse)
async def update_profile(
    update_data: UserUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update current user profile"""
    db = get_database()
    
    # Filter out None values
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    
    if update_dict:
        await db.users.update_one(
            {"_id": current_user["_id"]},
            {"$set": update_dict}
        )
    
    # Get updated user
    updated_user = await db.users.find_one({"_id": current_user["_id"]})
    updated_user = await _attach_contractor_id(db, updated_user)
    
    return UserResponse(
        _id=str(updated_user["_id"]),
        name=updated_user["name"],
        email=updated_user["email"],
        phone=updated_user.get("phone"),
        district=updated_user.get("district"),
        state=updated_user.get("state"),
        role=updated_user["role"],
        created_at=updated_user["created_at"],
        is_active=updated_user.get("is_active", True),
        contractor_id=updated_user.get("contractor_id")
    )

@router.post("/logout")
async def logout(current_user: dict = Depends(get_current_user)):
    """Logout user (client should discard token)"""
    return {"message": "Successfully logged out"}
