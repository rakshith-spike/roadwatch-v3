from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional, List
from datetime import datetime
from bson import ObjectId

from database import get_database
from utils.security import get_current_user

router = APIRouter(prefix="/alerts", tags=["Alerts"])

@router.get("/")
async def get_alerts(
    type: Optional[str] = None,
    read: Optional[bool] = None,
    limit: int = Query(50, ge=1, le=100),
    current_user: dict = Depends(get_current_user)
):
    """Get alerts for current user"""
    db = get_database()
    
    query = {
        "$or": [
            {"target_roles": current_user["role"]},
            {"target_users": current_user["_id"]}
        ]
    }
    
    if type:
        query["type"] = type
    if read is not None:
        query["read"] = read
    
    alerts = await db.alerts.find(query)\
        .sort("created_at", -1)\
        .limit(limit)\
        .to_list(limit)
    
    # Serialize
    for alert in alerts:
        alert["_id"] = str(alert["_id"])
        if "target_users" in alert:
            alert["target_users"] = [str(u) for u in alert["target_users"]]
    
    unread_count = await db.alerts.count_documents({
        **query,
        "read": False
    })
    
    return {
        "alerts": alerts,
        "total": len(alerts),
        "unread_count": unread_count
    }

@router.put("/{alert_id}/read")
async def mark_alert_read(
    alert_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Mark an alert as read"""
    db = get_database()
    
    if not ObjectId.is_valid(alert_id):
        raise HTTPException(status_code=400, detail="Invalid alert ID")
    
    result = await db.alerts.update_one(
        {"_id": ObjectId(alert_id)},
        {"$set": {"read": True}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    return {"message": "Alert marked as read"}

@router.put("/read-all")
async def mark_all_read(
    current_user: dict = Depends(get_current_user)
):
    """Mark all alerts as read"""
    db = get_database()
    
    result = await db.alerts.update_many(
        {
            "$or": [
                {"target_roles": current_user["role"]},
                {"target_users": current_user["_id"]}
            ],
            "read": False
        },
        {"$set": {"read": True}}
    )
    
    return {"message": f"{result.modified_count} alerts marked as read"}

@router.delete("/{alert_id}")
async def delete_alert(
    alert_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete an alert"""
    db = get_database()
    
    if not ObjectId.is_valid(alert_id):
        raise HTTPException(status_code=400, detail="Invalid alert ID")
    
    result = await db.alerts.delete_one({"_id": ObjectId(alert_id)})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    return {"message": "Alert deleted"}

@router.post("/")
async def create_alert(
    type: str,
    title: str,
    message: str,
    location: Optional[str] = None,
    target_roles: List[str] = ["government", "superadmin"],
    actionable: bool = False,
    current_user: dict = Depends(get_current_user)
):
    """Create a new alert (admin only)"""
    if current_user["role"] not in ["government", "superadmin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db = get_database()
    
    alert = {
        "type": type,
        "title": title,
        "message": message,
        "location": location,
        "target_roles": target_roles,
        "actionable": actionable,
        "read": False,
        "created_at": datetime.utcnow(),
        "created_by": current_user["_id"]
    }
    
    result = await db.alerts.insert_one(alert)
    alert["_id"] = str(result.inserted_id)
    
    return alert
