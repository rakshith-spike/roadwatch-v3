from fastapi import APIRouter, Depends
from typing import Optional, List
from pydantic import BaseModel

from utils.security import get_current_user
from services.ai_service import ai_service

router = APIRouter(prefix="/ai", tags=["AI Services"])

class ChatMessage(BaseModel):
    message: str
    context: Optional[dict] = None

class AnalyzeRequest(BaseModel):
    title: str
    description: str
    category: Optional[str] = None

@router.post("/chat")
async def ai_chat(
    chat_message: ChatMessage,
    current_user: dict = Depends(get_current_user)
):
    """Chat with AI assistant (Grok-powered with fallback)"""
    response = await ai_service.chat_response_async(
        chat_message.message,
        chat_message.context
    )
    return {
        "response": response,
        "user": current_user["name"]
    }

@router.post("/analyze-complaint")
async def analyze_complaint(
    request: AnalyzeRequest,
    current_user: dict = Depends(get_current_user)
):
    """Analyze complaint text and get AI insights (Grok-powered with fallback)"""
    analysis = await ai_service.analyze_complaint_async(
        request.title,
        request.description,
        request.category
    )
    return analysis

@router.get("/recommendations")
async def get_recommendations(
    complaint_id: Optional[str] = None,
    category: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get AI recommendations"""
    from database import get_database
    from bson import ObjectId
    
    db = get_database()
    recommendations = []
    
    if complaint_id and ObjectId.is_valid(complaint_id):
        complaint = await db.complaints.find_one({"_id": ObjectId(complaint_id)})
        if complaint:
            analysis = await ai_service.analyze_complaint_async(
                complaint.get("title", ""),
                complaint.get("description", ""),
                complaint.get("category")
            )
            recommendations = analysis.get("recommendations", [])
    elif category:
        category_recommendations = {
            "pothole": ["Use cold mix asphalt for temporary fix", "Schedule permanent repair within 7 days", "Mark area with warning signs"],
            "drainage": ["Clear blockages first", "Check upstream connections", "Consider pump installation for low-lying areas"],
            "streetlight": ["Check electrical supply", "Verify fixture condition", "Consider LED upgrade for efficiency"],
            "crack": ["Seal before monsoon season", "Monitor for spreading", "Apply sealant for minor cracks"]
        }
        recommendations = category_recommendations.get(category, ["Standard repair protocol"])
    
    return {"recommendations": recommendations}

@router.get("/predict-maintenance")
async def predict_maintenance(
    district: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get predictive maintenance insights"""
    import random
    predictions = {
        "high_risk_zones": [
            {"location": "MG Road Junction", "risk_score": 85, "predicted_issues": ["potholes", "cracks"]},
            {"location": "Silk Board", "risk_score": 78, "predicted_issues": ["flooding", "drainage"]},
            {"location": "Whitefield", "risk_score": 72, "predicted_issues": ["potholes"]}
        ],
        "predicted_complaints_next_week": random.randint(50, 100),
        "weather_impact": {
            "rain_expected": True,
            "increase_probability": 25,
            "affected_categories": ["flooding", "drainage", "potholes"]
        },
        "resource_recommendations": [
            "Allocate additional crew for drainage maintenance",
            "Stock up on cold mix asphalt for pothole repairs",
            "Pre-position pumps in flood-prone areas"
        ]
    }
    return predictions

@router.get("/duplicate-check")
async def check_for_duplicates(
    title: str,
    description: str,
    district: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Check if a complaint might be a duplicate"""
    from database import get_database
    db = get_database()
    
    query = {"status": {"$ne": "resolved"}}
    if district:
        query["location.district"] = district
    
    existing_complaints = await db.complaints.find(query).to_list(100)
    result = ai_service.check_duplicate(title, description, existing_complaints)
    return result

@router.get("/status")
async def get_ai_status(current_user: dict = Depends(get_current_user)):
    """Check if Grok AI is configured"""
    api_key = ai_service._get_api_key()
    return {
        "grok_configured": api_key is not None,
        "model": ai_service._get_model(),
        "mode": "grok" if api_key else "rule-based-fallback"
    }
