from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime
from bson import ObjectId

from database import get_database
from models.user import UserCreate, UserLogin, UserUpdate, UserResponse, TokenResponse
from utils.security import (
    get_password_hash, 
    verify_password, 
    create_access_token,
    get_current_user
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

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
        is_active=user_dict["is_active"]
    )
    
    return TokenResponse(access_token=access_token, user=user_response)

@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    """Login user and return access token"""
    db = get_database()
    
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
        is_active=user.get("is_active", True)
    )
    
    return TokenResponse(access_token=access_token, user=user_response)

@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(current_user: dict = Depends(get_current_user)):
    """Get current user profile"""
    return UserResponse(
        _id=str(current_user["_id"]),
        name=current_user["name"],
        email=current_user["email"],
        phone=current_user.get("phone"),
        district=current_user.get("district"),
        state=current_user.get("state"),
        role=current_user["role"],
        created_at=current_user["created_at"],
        is_active=current_user.get("is_active", True)
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
    
    return UserResponse(
        _id=str(updated_user["_id"]),
        name=updated_user["name"],
        email=updated_user["email"],
        phone=updated_user.get("phone"),
        district=updated_user.get("district"),
        state=updated_user.get("state"),
        role=updated_user["role"],
        created_at=updated_user["created_at"],
        is_active=updated_user.get("is_active", True)
    )

@router.post("/logout")
async def logout(current_user: dict = Depends(get_current_user)):
    """Logout user (client should discard token)"""
    return {"message": "Successfully logged out"}
