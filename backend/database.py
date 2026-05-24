from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import IndexModel, ASCENDING, DESCENDING, GEOSPHERE
from config import settings
import asyncio

class Database:
    client: AsyncIOMotorClient = None
    db = None

db = Database()

async def connect_to_mongo():
    """Connect to MongoDB"""
    print(f"Connecting to MongoDB at {settings.MONGODB_URL}...")
    db.client = AsyncIOMotorClient(settings.MONGODB_URL)
    db.db = db.client[settings.DATABASE_NAME]
    
    # Create indexes
    await create_indexes()
    
    # Seed initial data if empty
    await seed_initial_data()
    
    print("Connected to MongoDB successfully!")

async def close_mongo_connection():
    """Close MongoDB connection"""
    print("Closing MongoDB connection...")
    if db.client:
        db.client.close()
    print("MongoDB connection closed.")

async def create_indexes():
    """Create database indexes for better performance"""
    # Users collection indexes
    await db.db.users.create_indexes([
        IndexModel([("email", ASCENDING)], unique=True),
        IndexModel([("role", ASCENDING)]),
    ])
    
    # Complaints collection indexes
    await db.db.complaints.create_indexes([
        IndexModel([("status", ASCENDING)]),
        IndexModel([("severity", ASCENDING)]),
        IndexModel([("category", ASCENDING)]),
        IndexModel([("reported_by", ASCENDING)]),
        IndexModel([("reported_at", DESCENDING)]),
        IndexModel([("location.coordinates", GEOSPHERE)]),
    ])
    
    # Contractors collection indexes
    await db.db.contractors.create_indexes([
        IndexModel([("user_id", ASCENDING)], unique=True),
        IndexModel([("regions", ASCENDING)]),
        IndexModel([("performance_score", DESCENDING)]),
    ])
    
    # Projects collection indexes
    await db.db.projects.create_indexes([
        IndexModel([("contractor_id", ASCENDING)]),
        IndexModel([("status", ASCENDING)]),
        IndexModel([("end_date", ASCENDING)]),
    ])
    
    print("Database indexes created.")

async def seed_initial_data():
    """Seed initial data if database is empty"""
    from utils.security import get_password_hash
    from datetime import datetime, timedelta
    from bson import ObjectId
    
    # Check if users exist
    user_count = await db.db.users.count_documents({})
    if user_count > 0:
        print("Database already has data, skipping seed.")
        return
    
    print("Seeding initial data...")
    
    # Create demo users
    demo_users = [
        {
            "_id": ObjectId(),
            "name": "Amit Patel",
            "email": "citizen@demo.com",
            "password": get_password_hash("demo123"),
            "role": "citizen",
            "phone": "+91 9876543210",
            "district": "Bangalore Urban",
            "state": "Karnataka",
            "created_at": datetime.utcnow(),
            "is_active": True
        },
        {
            "_id": ObjectId(),
            "name": "Rajesh Kumar",
            "email": "contractor@demo.com",
            "password": get_password_hash("demo123"),
            "role": "contractor",
            "phone": "+91 9876543211",
            "district": "Bangalore Urban",
            "state": "Karnataka",
            "created_at": datetime.utcnow(),
            "is_active": True
        },
        {
            "_id": ObjectId(),
            "name": "Dr. Ananya Reddy",
            "email": "admin@demo.com",
            "password": get_password_hash("demo123"),
            "role": "government",
            "phone": "+91 9876543212",
            "district": "Bangalore Urban",
            "state": "Karnataka",
            "created_at": datetime.utcnow(),
            "is_active": True
        },
        {
            "_id": ObjectId(),
            "name": "System Administrator",
            "email": "superadmin@demo.com",
            "password": get_password_hash("demo123"),
            "role": "superadmin",
            "phone": "+91 9876543213",
            "district": "National",
            "state": "India",
            "created_at": datetime.utcnow(),
            "is_active": True
        }
    ]
    
    await db.db.users.insert_many(demo_users)
    
    citizen_id = demo_users[0]["_id"]
    contractor_user_id = demo_users[1]["_id"]
    
    # Create contractor profile
    contractor = {
        "_id": ObjectId(),
        "user_id": contractor_user_id,
        "company": "Kumar Infrastructure Pvt Ltd",
        "license": "KA-INFRA-2021-001",
        "rating": 4.5,
        "completed_projects": 45,
        "active_projects": 3,
        "total_budget": 25000000,
        "regions": ["Bangalore Urban", "Bangalore Rural"],
        "specialization": ["Road Repair", "Drainage Systems"],
        "performance_score": 87,
        "created_at": datetime.utcnow()
    }
    
    await db.db.contractors.insert_one(contractor)
    contractor_id = contractor["_id"]
    
    # Create demo complaints
    complaints = [
        {
            "_id": ObjectId(),
            "title": "Large Pothole on MG Road",
            "description": "Dangerous pothole causing accidents near the junction. Multiple vehicles have been damaged. Needs immediate attention.",
            "category": "pothole",
            "severity": "critical",
            "status": "in_progress",
            "location": {
                "type": "Point",
                "coordinates": [77.5946, 12.9716],
                "address": "MG Road, Bangalore",
                "district": "Bangalore Urban",
                "state": "Karnataka"
            },
            "images": [],
            "reported_by": citizen_id,
            "reported_at": datetime.utcnow() - timedelta(days=5),
            "assigned_to": contractor_id,
            "ai_analysis": {
                "category": "pothole",
                "severity": "critical",
                "estimated_cost": 50000,
                "priority": 95,
                "confidence": 0.94
            },
            "votes": 234,
            "comments": []
        },
        {
            "_id": ObjectId(),
            "title": "Street Light Not Working",
            "description": "Multiple street lights not functioning for 2 weeks in 5th Block area. Safety concern for residents.",
            "category": "streetlight",
            "severity": "medium",
            "status": "assigned",
            "location": {
                "type": "Point",
                "coordinates": [77.6245, 12.9352],
                "address": "Koramangala 5th Block",
                "district": "Bangalore Urban",
                "state": "Karnataka"
            },
            "images": [],
            "reported_by": citizen_id,
            "reported_at": datetime.utcnow() - timedelta(days=3),
            "assigned_to": contractor_id,
            "ai_analysis": {
                "category": "streetlight",
                "severity": "medium",
                "estimated_cost": 15000,
                "priority": 60,
                "confidence": 0.89
            },
            "votes": 89,
            "comments": []
        },
        {
            "_id": ObjectId(),
            "title": "Road Crack Spreading Fast",
            "description": "Major crack in road surface extending over 50 meters. Getting worse with each passing day.",
            "category": "crack",
            "severity": "high",
            "status": "verified",
            "location": {
                "type": "Point",
                "coordinates": [77.6476, 12.9081],
                "address": "HSR Layout Sector 2",
                "district": "Bangalore Urban",
                "state": "Karnataka"
            },
            "images": [],
            "reported_by": citizen_id,
            "reported_at": datetime.utcnow() - timedelta(days=2),
            "ai_analysis": {
                "category": "crack",
                "severity": "high",
                "estimated_cost": 120000,
                "priority": 82,
                "confidence": 0.91
            },
            "votes": 156,
            "comments": []
        },
        {
            "_id": ObjectId(),
            "title": "Drainage Overflow Issue",
            "description": "Storm drain overflowing during rains causing flooding in residential area.",
            "category": "drainage",
            "severity": "high",
            "status": "pending",
            "location": {
                "type": "Point",
                "coordinates": [77.7500, 12.9698],
                "address": "Whitefield Main Road",
                "district": "Bangalore Urban",
                "state": "Karnataka"
            },
            "images": [],
            "reported_by": citizen_id,
            "reported_at": datetime.utcnow() - timedelta(days=1),
            "ai_analysis": {
                "category": "drainage",
                "severity": "high",
                "estimated_cost": 200000,
                "priority": 78,
                "confidence": 0.87
            },
            "votes": 312,
            "comments": []
        },
        {
            "_id": ObjectId(),
            "title": "Construction Debris on Road",
            "description": "Construction debris blocking half the road near the metro construction site.",
            "category": "debris",
            "severity": "medium",
            "status": "resolved",
            "location": {
                "type": "Point",
                "coordinates": [77.6271, 12.9279],
                "address": "Indiranagar 100ft Road",
                "district": "Bangalore Urban",
                "state": "Karnataka"
            },
            "images": [],
            "reported_by": citizen_id,
            "reported_at": datetime.utcnow() - timedelta(days=7),
            "resolved_at": datetime.utcnow() - timedelta(days=5),
            "ai_analysis": {
                "category": "debris",
                "severity": "medium",
                "estimated_cost": 25000,
                "priority": 55,
                "confidence": 0.92
            },
            "votes": 78,
            "comments": []
        }
    ]
    
    await db.db.complaints.insert_many(complaints)
    
    # Create demo projects
    projects = [
        {
            "_id": ObjectId(),
            "title": "MG Road Pothole Repair",
            "description": "Emergency repair of critical potholes on MG Road stretch",
            "contractor_id": contractor_id,
            "complaint_ids": [complaints[0]["_id"]],
            "budget": 500000,
            "spent": 320000,
            "start_date": datetime.utcnow() - timedelta(days=3),
            "end_date": datetime.utcnow() + timedelta(days=5),
            "status": "in_progress",
            "progress": 65,
            "location": {
                "type": "Point",
                "coordinates": [77.5946, 12.9716],
                "address": "MG Road",
                "district": "Bangalore Urban"
            },
            "milestones": [
                {"title": "Site Inspection", "completed": True, "date": datetime.utcnow() - timedelta(days=3)},
                {"title": "Material Procurement", "completed": True, "date": datetime.utcnow() - timedelta(days=2)},
                {"title": "Repair Work", "completed": False, "date": datetime.utcnow() + timedelta(days=2)},
                {"title": "Quality Check", "completed": False, "date": datetime.utcnow() + timedelta(days=4)}
            ],
            "work_logs": [],
            "created_at": datetime.utcnow()
        },
        {
            "_id": ObjectId(),
            "title": "Koramangala Street Light Restoration",
            "description": "Restoration of non-functional street lights in 5th Block",
            "contractor_id": contractor_id,
            "complaint_ids": [complaints[1]["_id"]],
            "budget": 150000,
            "spent": 45000,
            "start_date": datetime.utcnow() - timedelta(days=1),
            "end_date": datetime.utcnow() + timedelta(days=4),
            "status": "in_progress",
            "progress": 30,
            "location": {
                "type": "Point",
                "coordinates": [77.6245, 12.9352],
                "address": "Koramangala 5th Block",
                "district": "Bangalore Urban"
            },
            "milestones": [
                {"title": "Assessment", "completed": True, "date": datetime.utcnow() - timedelta(days=1)},
                {"title": "Equipment Setup", "completed": False, "date": datetime.utcnow()},
                {"title": "Installation", "completed": False, "date": datetime.utcnow() + timedelta(days=3)}
            ],
            "work_logs": [],
            "created_at": datetime.utcnow()
        }
    ]
    
    await db.db.projects.insert_many(projects)
    
    # Create alerts
    alerts = [
        {
            "_id": ObjectId(),
            "type": "critical",
            "title": "Flood Risk Alert",
            "message": "Heavy rainfall predicted in Whitefield area. 3 drainage complaints in critical zone.",
            "location": "Whitefield, Bangalore",
            "created_at": datetime.utcnow(),
            "read": False,
            "actionable": True,
            "target_roles": ["government", "superadmin"]
        },
        {
            "_id": ObjectId(),
            "type": "warning",
            "title": "SLA Breach Warning",
            "message": "Complaint for HSR Layout crack is approaching SLA deadline.",
            "created_at": datetime.utcnow() - timedelta(hours=1),
            "read": False,
            "actionable": True,
            "target_roles": ["government", "superadmin"]
        },
        {
            "_id": ObjectId(),
            "type": "info",
            "title": "New Hotspot Detected",
            "message": "AI identified Koramangala as emerging hotspot with increased complaints.",
            "location": "Koramangala, Bangalore",
            "created_at": datetime.utcnow() - timedelta(hours=2),
            "read": False,
            "actionable": True,
            "target_roles": ["government", "superadmin"]
        }
    ]
    
    await db.db.alerts.insert_many(alerts)
    
    print("Initial data seeded successfully!")
    print("\n📧 Demo Login Credentials:")
    print("   Citizen: citizen@demo.com / demo123")
    print("   Contractor: contractor@demo.com / demo123")
    print("   Government Admin: admin@demo.com / demo123")
    print("   Super Admin: superadmin@demo.com / demo123\n")

def get_database():
    return db.db
