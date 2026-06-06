from fastapi import APIRouter, Depends, Query
from typing import Optional
from datetime import datetime, timedelta
from bson import ObjectId
from collections import defaultdict

from database import get_database
from utils.security import get_current_user, require_roles
from services.ai_service import ai_service

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/dashboard")
async def get_dashboard_analytics(
    district: Optional[str] = None,
    days: int = Query(30, ge=1, le=365),
    current_user: dict = Depends(get_current_user)
):
    """Get dashboard analytics"""
    db = get_database()
    
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Build query
    query = {"reported_at": {"$gte": start_date}}
    if district:
        query["location.district"] = district
    
    # Get complaints
    complaints = await db.complaints.find(query).to_list(1000)
    
    # Calculate stats
    total = len(complaints)
    resolved = sum(1 for c in complaints if c.get("status") == "resolved")
    pending = sum(1 for c in complaints if c.get("status") == "pending")
    in_progress = sum(1 for c in complaints if c.get("status") == "in_progress")
    
    # Category breakdown
    categories = {}
    for c in complaints:
        cat = c.get("category", "other")
        categories[cat] = categories.get(cat, 0) + 1
    
    # Severity breakdown
    severities = {}
    for c in complaints:
        sev = c.get("severity", "medium")
        severities[sev] = severities.get(sev, 0) + 1
    
    # Get projects
    projects = await db.projects.find({}).to_list(100)
    active_projects = sum(1 for p in projects if p.get("status") == "in_progress")
    
    # Budget info
    total_budget = sum(p.get("budget", 0) for p in projects)
    total_spent = sum(p.get("spent", 0) for p in projects)
    
    # Get contractors count
    contractors_count = await db.contractors.count_documents({})
    
    return {
        "summary": {
            "total_complaints": total,
            "resolved": resolved,
            "pending": pending,
            "in_progress": in_progress,
            "resolution_rate": round(resolved / total * 100, 1) if total > 0 else 0,
            "active_projects": active_projects,
            "contractors": contractors_count,
            "total_budget": total_budget,
            "budget_utilized": total_spent,
            "budget_utilization_rate": round(total_spent / total_budget * 100, 1) if total_budget > 0 else 0
        },
        "categories": categories,
        "severities": severities,
        "period_days": days
    }

@router.get("/trends")
async def get_trends(
    days: int = Query(30, ge=7, le=365),
    district: Optional[str] = None,
    current_user: dict = Depends(require_roles(["government", "superadmin"]))
):
    """Get complaint trends over time"""
    db = get_database()
    
    start_date = datetime.utcnow() - timedelta(days=days)
    
    query = {"reported_at": {"$gte": start_date}}
    if district:
        query["location.district"] = district
    
    complaints = await db.complaints.find(query).to_list(1000)
    
    # Group by date
    daily_data = {}
    for c in complaints:
        date_key = c["reported_at"].strftime("%Y-%m-%d")
        if date_key not in daily_data:
            daily_data[date_key] = {"complaints": 0, "resolved": 0}
        daily_data[date_key]["complaints"] += 1
        if c.get("status") == "resolved":
            daily_data[date_key]["resolved"] += 1
    
    # Sort by date
    sorted_data = [
        {"date": k, **v} 
        for k, v in sorted(daily_data.items())
    ]
    
    return {"trends": sorted_data, "period_days": days}

@router.get("/districts")
async def get_district_analytics(
    current_user: dict = Depends(require_roles(["government", "superadmin"]))
):
    """Get analytics by district"""
    db = get_database()
    
    pipeline = [
        {
            "$group": {
                "_id": "$location.district",
                "total": {"$sum": 1},
                "resolved": {
                    "$sum": {"$cond": [{"$eq": ["$status", "resolved"]}, 1, 0]}
                },
                "pending": {
                    "$sum": {"$cond": [{"$eq": ["$status", "pending"]}, 1, 0]}
                },
                "critical": {
                    "$sum": {"$cond": [{"$eq": ["$severity", "critical"]}, 1, 0]}
                }
            }
        },
        {"$sort": {"total": -1}}
    ]
    
    results = await db.complaints.aggregate(pipeline).to_list(100)
    
    districts = []
    for r in results:
        districts.append({
            "district": r["_id"],
            "total_complaints": r["total"],
            "resolved": r["resolved"],
            "pending": r["pending"],
            "critical": r["critical"],
            "resolution_rate": round(r["resolved"] / r["total"] * 100, 1) if r["total"] > 0 else 0
        })
    
    return {"districts": districts}

@router.get("/contractors")
async def get_contractor_analytics(
    current_user: dict = Depends(require_roles(["government", "superadmin"]))
):
    """Get contractor performance analytics"""
    db = get_database()
    
    contractors = await db.contractors.find({}).to_list(100)
    
    contractor_stats = []
    for c in contractors:
        projects = await db.projects.find({"contractor_id": c["_id"]}).to_list(100)
        
        completed = sum(1 for p in projects if p.get("status") == "completed")
        total_budget = sum(p.get("budget", 0) for p in projects)
        total_spent = sum(p.get("spent", 0) for p in projects)
        
        contractor_stats.append({
            "id": str(c["_id"]),
            "company": c.get("company"),
            "rating": c.get("rating", 0),
            "performance_score": c.get("performance_score", 0),
            "total_projects": len(projects),
            "completed_projects": completed,
            "active_projects": len(projects) - completed,
            "total_budget": total_budget,
            "total_spent": total_spent,
            "budget_efficiency": round(total_spent / total_budget * 100, 1) if total_budget > 0 else 0
        })
    
    # Sort by performance score
    contractor_stats.sort(key=lambda x: x["performance_score"], reverse=True)
    
    return {"contractors": contractor_stats}

@router.get("/ai-insights")
async def get_ai_insights(
    current_user: dict = Depends(require_roles(["government", "superadmin"]))
):
    """Get AI-powered insights and predictions"""
    db = get_database()
    
    # Get recent complaints
    complaints = await db.complaints.find({}).to_list(500)
    projects = await db.projects.find({}).to_list(100)
    
    # Generate AI insights
    insights = ai_service.generate_analytics_insights(complaints, projects)
    
    return insights

@router.get("/hotspots")
async def get_hotspot_zones(
    current_user: dict = Depends(require_roles(["government", "superadmin"]))
):
    """Get hotspot zones with high complaint density"""
    db = get_database()
    
    pipeline = [
        {"$match": {"status": {"$ne": "resolved"}}},
        {
            "$group": {
                "_id": "$location.address",
                "count": {"$sum": 1},
                "critical_count": {
                    "$sum": {"$cond": [{"$eq": ["$severity", "critical"]}, 1, 0]}
                },
                "coordinates": {"$first": "$location.coordinates"}
            }
        },
        {"$match": {"count": {"$gte": 2}}},
        {"$sort": {"count": -1}},
        {"$limit": 10}
    ]
    
    results = await db.complaints.aggregate(pipeline).to_list(10)
    
    hotspots = []
    for r in results:
        hotspots.append({
            "location": r["_id"],
            "issue_count": r["count"],
            "critical_count": r["critical_count"],
            "coordinates": r.get("coordinates"),
            "severity": "critical" if r["critical_count"] > 0 else "high" if r["count"] > 5 else "medium"
        })
    
    return {"hotspots": hotspots}

@router.get("/map-intelligence")
async def get_map_intelligence(
    mode: str = Query("government", pattern="^(government|citizen)$"),
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    radius_meters: int = Query(3000, ge=250, le=25000),
    current_user: dict = Depends(get_current_user)
):
    """Return clusters, heatmap cells, and hotspot regions without thousands of raw markers."""
    db = get_database()

    query = {"status": {"$nin": ["resolved", "closed", "rejected"]}}
    if mode == "citizen" and lat is not None and lng is not None:
        query["location.coordinates"] = {
            "$near": {
                "$geometry": {"type": "Point", "coordinates": [lng, lat]},
                "$maxDistance": radius_meters,
            }
        }

    limit = 250 if mode == "citizen" else 2000
    complaints = await db.complaints.find(query).sort("priority_score", -1).limit(limit).to_list(limit)

    cells = defaultdict(lambda: {
        "count": 0,
        "critical": 0,
        "priority_total": 0,
        "lat_total": 0.0,
        "lng_total": 0.0,
        "categories": defaultdict(int),
    })

    for complaint in complaints:
        coords = complaint.get("location", {}).get("coordinates", [0, 0])
        if len(coords) < 2:
            continue
        lng_value, lat_value = coords[0], coords[1]
        key = f"{round(lat_value, 2)}:{round(lng_value, 2)}"
        cell = cells[key]
        cell["count"] += 1
        cell["critical"] += 1 if complaint.get("severity") == "critical" else 0
        cell["priority_total"] += complaint.get("priority_score", complaint.get("ai_analysis", {}).get("priority", 50))
        cell["lat_total"] += lat_value
        cell["lng_total"] += lng_value
        cell["categories"][complaint.get("category", "other")] += 1

    clusters = []
    heatmap = []
    for key, cell in cells.items():
        count = cell["count"]
        categories = dict(cell["categories"])
        dominant_category = max(categories, key=categories.get) if categories else "other"
        avg_priority = round(cell["priority_total"] / count, 1)
        cluster = {
            "id": key,
            "lat": cell["lat_total"] / count,
            "lng": cell["lng_total"] / count,
            "count": count,
            "critical": cell["critical"],
            "averagePriority": avg_priority,
            "dominantCategory": dominant_category,
            "severity": "critical" if cell["critical"] else "high" if avg_priority >= 70 else "medium",
        }
        clusters.append(cluster)
        heatmap.append({
            "lat": cluster["lat"],
            "lng": cluster["lng"],
            "intensity": min(1, (count / 12) + (avg_priority / 200)),
            "count": count,
        })

    clusters.sort(key=lambda item: (item["averagePriority"], item["count"]), reverse=True)
    hotspot_regions = [
        {
            "name": f"{cluster['dominantCategory'].replace('_', ' ').title()} hotspot",
            "lat": cluster["lat"],
            "lng": cluster["lng"],
            "issueCount": cluster["count"],
            "riskScore": min(100, round(cluster["averagePriority"] + cluster["critical"] * 5)),
        }
        for cluster in clusters[:10]
    ]

    return {
        "clusters": clusters[:75],
        "heatmap": heatmap,
        "hotspotRegions": hotspot_regions,
        "nearbyOnly": mode == "citizen",
        "sourceCount": len(complaints),
    }

@router.get("/sla")
async def get_sla_metrics(
    current_user: dict = Depends(require_roles(["government", "superadmin"]))
):
    """Get SLA compliance metrics"""
    db = get_database()
    
    # SLA thresholds in days
    SLA_DAYS = {
        "critical": 2,
        "high": 5,
        "medium": 10,
        "low": 15
    }
    
    complaints = await db.complaints.find({"status": {"$ne": "resolved"}}).to_list(500)
    
    now = datetime.utcnow()
    within_sla = 0
    approaching = 0
    breached = 0
    
    for c in complaints:
        severity = c.get("severity", "medium")
        sla_days = SLA_DAYS.get(severity, 10)
        
        reported_at = c.get("reported_at", now)
        days_elapsed = (now - reported_at).days
        
        if days_elapsed > sla_days:
            breached += 1
        elif days_elapsed > sla_days * 0.8:
            approaching += 1
        else:
            within_sla += 1
    
    total = within_sla + approaching + breached
    
    return {
        "total_active": total,
        "within_sla": within_sla,
        "within_sla_percent": round(within_sla / total * 100, 1) if total > 0 else 0,
        "approaching": approaching,
        "approaching_percent": round(approaching / total * 100, 1) if total > 0 else 0,
        "breached": breached,
        "breached_percent": round(breached / total * 100, 1) if total > 0 else 0,
        "sla_thresholds": SLA_DAYS
    }
