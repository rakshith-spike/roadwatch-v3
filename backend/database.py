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
        IndexModel([("priority_score", DESCENDING)]),
        IndexModel([("support_count", DESCENDING)]),
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

    # Budget collection indexes
    await db.db.budget.create_indexes([
        IndexModel([("project_id", ASCENDING)]),
        IndexModel([("status", ASCENDING)]),
        IndexModel([("requested_at", DESCENDING)]),
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

    # ── Demo Users ────────────────────────────────────────────────────────────
    citizen_id = ObjectId()
    contractor1_user_id = ObjectId()
    contractor2_user_id = ObjectId()
    contractor3_user_id = ObjectId()
    govt_user_id = ObjectId()
    superadmin_user_id = ObjectId()

    demo_users = [
        {
            "_id": citizen_id,
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
            "_id": contractor1_user_id,
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
            "_id": contractor2_user_id,
            "name": "Priya Sharma",
            "email": "contractor2@demo.com",
            "password": get_password_hash("demo123"),
            "role": "contractor",
            "phone": "+91 9876543215",
            "district": "Bangalore Urban",
            "state": "Karnataka",
            "created_at": datetime.utcnow(),
            "is_active": True
        },
        {
            "_id": contractor3_user_id,
            "name": "Mohammed Ali",
            "email": "contractor3@demo.com",
            "password": get_password_hash("demo123"),
            "role": "contractor",
            "phone": "+91 9876543216",
            "district": "Mysore",
            "state": "Karnataka",
            "created_at": datetime.utcnow(),
            "is_active": True
        },
        {
            "_id": govt_user_id,
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
            "_id": superadmin_user_id,
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

    # ── Contractor Profiles ───────────────────────────────────────────────────
    contractor1_id = ObjectId()
    contractor2_id = ObjectId()
    contractor3_id = ObjectId()

    contractors = [
        {
            "_id": contractor1_id,
            "user_id": contractor1_user_id,
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
        },
        {
            "_id": contractor2_id,
            "user_id": contractor2_user_id,
            "company": "Sharma Constructions",
            "license": "KA-INFRA-2020-042",
            "rating": 4.8,
            "completed_projects": 62,
            "active_projects": 5,
            "total_budget": 45000000,
            "regions": ["Bangalore Urban", "Mysore"],
            "specialization": ["Street Lighting", "Road Construction"],
            "performance_score": 92,
            "created_at": datetime.utcnow()
        },
        {
            "_id": contractor3_id,
            "user_id": contractor3_user_id,
            "company": "Ali Roads & Bridges",
            "license": "KA-INFRA-2019-087",
            "rating": 4.2,
            "completed_projects": 38,
            "active_projects": 2,
            "total_budget": 18000000,
            "regions": ["Mysore", "Bangalore Rural"],
            "specialization": ["Bridge Repair", "Road Repair"],
            "performance_score": 78,
            "created_at": datetime.utcnow()
        }
    ]

    await db.db.contractors.insert_many(contractors)

    # ── Demo Complaints ───────────────────────────────────────────────────────
    complaint1_id = ObjectId()
    complaint2_id = ObjectId()
    complaint3_id = ObjectId()
    complaint4_id = ObjectId()
    complaint5_id = ObjectId()
    complaint6_id = ObjectId()

    complaints = [
        {
            "_id": complaint1_id,
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
            "updated_at": datetime.utcnow() - timedelta(days=2),
            "assigned_to": contractor1_id,
            "assigned_contractor_name": "Kumar Infrastructure Pvt Ltd",
            "ai_analysis": {
                "category": "pothole",
                "severity": "critical",
                "estimated_cost": 87000,
                "priority": 95,
                "confidence": 0.94,
                "issue_type": "pothole",
                "severity_score": 88,
                "priority_score": 95,
                "model_status": "yolo-high-confidence"
            },
            "estimated_cost": 87000,
            "cost_range": [69600, 108750],
            "priority_score": 95,
            "severity_score": 88,
            "traffic_importance": 90,
            "progress_percentage": 60,
            "votes": 234,
            "support_count": 15,
            "supported_by": [citizen_id],
            "comments": [],
            "before_work_photos": [],
            "progress_photos": [],
            "completion_photos": [],
        },
        {
            "_id": complaint2_id,
            "title": "Street Lights Not Working — 5th Block",
            "description": "Multiple street lights not functioning for 2 weeks in 5th Block area. Safety concern for residents walking at night.",
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
            "updated_at": datetime.utcnow() - timedelta(days=1),
            "assigned_to": contractor2_id,
            "assigned_contractor_name": "Sharma Constructions",
            "ai_analysis": {
                "category": "streetlight",
                "severity": "medium",
                "estimated_cost": 25000,
                "priority": 60,
                "confidence": 0.89,
                "issue_type": "streetlight",
                "severity_score": 50,
                "priority_score": 60,
                "model_status": "user-preferred"
            },
            "estimated_cost": 25000,
            "cost_range": [20000, 31250],
            "priority_score": 60,
            "severity_score": 50,
            "traffic_importance": 65,
            "progress_percentage": 10,
            "votes": 89,
            "support_count": 8,
            "supported_by": [citizen_id],
            "comments": [],
            "before_work_photos": [],
            "progress_photos": [],
            "completion_photos": [],
        },
        {
            "_id": complaint3_id,
            "title": "Road Crack Spreading Fast — HSR Layout",
            "description": "Major crack in road surface extending over 50 meters. Getting worse with each passing day. Risk of further road collapse.",
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
            "updated_at": datetime.utcnow() - timedelta(hours=12),
            "ai_analysis": {
                "category": "crack",
                "severity": "high",
                "estimated_cost": 153000,
                "priority": 82,
                "confidence": 0.91,
                "issue_type": "crack",
                "severity_score": 72,
                "priority_score": 82,
                "model_status": "yolo-high-confidence"
            },
            "estimated_cost": 153000,
            "cost_range": [122400, 191250],
            "priority_score": 82,
            "severity_score": 72,
            "traffic_importance": 65,
            "progress_percentage": 0,
            "votes": 156,
            "support_count": 12,
            "supported_by": [citizen_id],
            "comments": [],
            "before_work_photos": [],
            "progress_photos": [],
            "completion_photos": [],
        },
        {
            "_id": complaint4_id,
            "title": "Drainage Overflow — Whitefield",
            "description": "Storm drain overflowing during rains causing severe flooding in residential area. Children cannot go to school.",
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
            "updated_at": datetime.utcnow() - timedelta(hours=6),
            "ai_analysis": {
                "category": "flooding",
                "severity": "high",
                "estimated_cost": 306000,
                "priority": 78,
                "confidence": 0.87,
                "issue_type": "waterlogging",
                "severity_score": 68,
                "priority_score": 78,
                "model_status": "keyword-match"
            },
            "estimated_cost": 306000,
            "cost_range": [244800, 382500],
            "priority_score": 78,
            "severity_score": 68,
            "traffic_importance": 65,
            "progress_percentage": 0,
            "votes": 312,
            "support_count": 22,
            "supported_by": [citizen_id],
            "comments": [],
            "before_work_photos": [],
            "progress_photos": [],
            "completion_photos": [],
        },
        {
            "_id": complaint5_id,
            "title": "Construction Debris Blocking Road",
            "description": "Construction debris blocking half the road near the metro construction site. Traffic badly affected.",
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
            "updated_at": datetime.utcnow() - timedelta(days=5),
            "resolved_at": datetime.utcnow() - timedelta(days=5),
            "assigned_to": contractor1_id,
            "assigned_contractor_name": "Kumar Infrastructure Pvt Ltd",
            "ai_analysis": {
                "category": "debris",
                "severity": "medium",
                "estimated_cost": 18000,
                "priority": 55,
                "confidence": 0.92,
                "issue_type": "garbage_obstruction",
                "severity_score": 45,
                "priority_score": 55,
                "model_status": "keyword-match"
            },
            "estimated_cost": 18000,
            "cost_range": [14400, 22500],
            "priority_score": 55,
            "severity_score": 45,
            "traffic_importance": 65,
            "progress_percentage": 100,
            "votes": 78,
            "support_count": 5,
            "supported_by": [citizen_id],
            "comments": [],
            "before_work_photos": [],
            "progress_photos": [],
            "completion_photos": [],
        },
        {
            "_id": complaint6_id,
            "title": "Multiple Potholes — Electronic City",
            "description": "Multiple deep potholes near tech park entrance causing traffic jams and vehicle damage. At least 8 potholes in 500m stretch.",
            "category": "pothole",
            "severity": "high",
            "status": "pending",
            "location": {
                "type": "Point",
                "coordinates": [77.6600, 12.8447],
                "address": "Electronic City Phase 1",
                "district": "Bangalore Urban",
                "state": "Karnataka"
            },
            "images": [],
            "reported_by": citizen_id,
            "reported_at": datetime.utcnow() - timedelta(hours=18),
            "updated_at": datetime.utcnow() - timedelta(hours=18),
            "ai_analysis": {
                "category": "pothole",
                "severity": "high",
                "estimated_cost": 59500,
                "priority": 75,
                "confidence": 0.88,
                "issue_type": "pothole",
                "severity_score": 65,
                "priority_score": 75,
                "model_status": "yolo-moderate"
            },
            "estimated_cost": 59500,
            "cost_range": [47600, 74375],
            "priority_score": 75,
            "severity_score": 65,
            "traffic_importance": 90,
            "progress_percentage": 0,
            "votes": 189,
            "support_count": 18,
            "supported_by": [citizen_id],
            "comments": [],
            "before_work_photos": [],
            "progress_photos": [],
            "completion_photos": [],
        }
    ]

    await db.db.complaints.insert_many(complaints)

    # ── Demo Projects ─────────────────────────────────────────────────────────
    project1_id = ObjectId()
    project2_id = ObjectId()
    projects = [
        {
            "_id": project1_id,
            "title": "MG Road Pothole Repair",
            "description": "Emergency repair of critical potholes on MG Road stretch",
            "contractor_id": contractor1_id,
            "complaint_ids": [complaint1_id],
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
                {"title": "Site Inspection", "completed": True, "date": (datetime.utcnow() - timedelta(days=3)).isoformat()},
                {"title": "Material Procurement", "completed": True, "date": (datetime.utcnow() - timedelta(days=2)).isoformat()},
                {"title": "Repair Work", "completed": False, "date": (datetime.utcnow() + timedelta(days=2)).isoformat()},
                {"title": "Quality Check", "completed": False, "date": (datetime.utcnow() + timedelta(days=4)).isoformat()}
            ],
            "work_logs": [
                {
                    "id": str(ObjectId()),
                    "date": (datetime.utcnow() - timedelta(days=2)).isoformat(),
                    "description": "Procured bitumen and aggregates. Site demarcated.",
                    "workers_count": 8,
                    "materials_used": ["Bitumen 500kg", "Aggregates 2 tonnes"],
                    "photos": [],
                    "added_by": "Rajesh Kumar"
                },
                {
                    "id": str(ObjectId()),
                    "date": (datetime.utcnow() - timedelta(days=1)).isoformat(),
                    "description": "Started filling first 5 potholes. Traffic diversions set up.",
                    "workers_count": 12,
                    "materials_used": ["Bitumen 200kg", "Compactor 1 unit"],
                    "photos": [],
                    "added_by": "Rajesh Kumar"
                }
            ],
            "road_type": "MDR",
            "last_relaying_date": "2023-11-12",
            "responsible_authority": "BBMP Road Infrastructure Division",
            "executive_engineer": "Er. Kavitha Rao, East Zone",
            "budget_source": "BBMP Ward Infrastructure Grant FY 2024-25",
            "quality_score": 72,
            "approved_by": "Dr. Ananya Reddy",
            "notes": "High priority — CM office flagged",
            "created_at": datetime.utcnow() - timedelta(days=3),
        },
        {
            "_id": project2_id,
            "title": "Koramangala Street Light Restoration",
            "description": "Restoration of non-functional street lights in 5th Block",
            "contractor_id": contractor2_id,
            "complaint_ids": [complaint2_id],
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
                {"title": "Assessment", "completed": True, "date": (datetime.utcnow() - timedelta(days=1)).isoformat()},
                {"title": "Equipment Setup", "completed": False, "date": datetime.utcnow().isoformat()},
                {"title": "Installation", "completed": False, "date": (datetime.utcnow() + timedelta(days=3)).isoformat()}
            ],
            "work_logs": [
                {
                    "id": str(ObjectId()),
                    "date": (datetime.utcnow() - timedelta(days=1)).isoformat(),
                    "description": "Assessed 12 non-functional lights. 8 need replacement, 4 need rewiring.",
                    "workers_count": 4,
                    "materials_used": ["LED bulbs 8 units", "Wiring 50m"],
                    "photos": [],
                    "added_by": "Priya Sharma"
                }
            ],
            "road_type": "Ward Road",
            "last_relaying_date": "2022-09-28",
            "responsible_authority": "BBMP Electrical and Road Safety Cell",
            "executive_engineer": "Er. Meera Iyer, South Zone",
            "budget_source": "Urban Safety and Street Lighting Fund",
            "quality_score": 81,
            "approved_by": "Dr. Ananya Reddy",
            "created_at": datetime.utcnow() - timedelta(days=1),
        }
    ]

    await db.db.projects.insert_many(projects)

    # ── Demo Budgets ──────────────────────────────────────────────────────────
    budget_entries = [
        {
            "_id": ObjectId(),
            "project_id": str(project1_id),
            "project_title": "MG Road Pothole Repair",
            "contractor": "Kumar Infrastructure Pvt Ltd",
            "amount": 500000.0,
            "type": "allocation",
            "status": "approved",
            "requested_at": datetime.utcnow() - timedelta(days=3),
            "approved_at": datetime.utcnow() - timedelta(days=3),
            "approved_by": "Dr. Ananya Reddy",
            "district": "Bangalore Urban",
            "source": "BBMP Ward Infrastructure Grant FY 2024-25",
            "sanction_reference": "RW/BLR/94821"
        },
        {
            "_id": ObjectId(),
            "project_id": str(project1_id),
            "project_title": "MG Road Pothole Repair",
            "contractor": "Kumar Infrastructure Pvt Ltd",
            "amount": 320000.0,
            "type": "disbursement",
            "status": "approved",
            "requested_at": datetime.utcnow() - timedelta(days=2),
            "approved_at": datetime.utcnow() - timedelta(days=2),
            "approved_by": "Dr. Ananya Reddy",
            "district": "Bangalore Urban",
            "source": "BBMP Ward Infrastructure Grant FY 2024-25",
            "sanction_reference": "RW/BLR/94822"
        },
        {
            "_id": ObjectId(),
            "project_id": str(project2_id),
            "project_title": "Koramangala Street Light Restoration",
            "contractor": "Sharma Constructions",
            "amount": 150000.0,
            "type": "allocation",
            "status": "approved",
            "requested_at": datetime.utcnow() - timedelta(days=1),
            "approved_at": datetime.utcnow() - timedelta(days=1),
            "approved_by": "Dr. Ananya Reddy",
            "district": "Bangalore Urban",
            "source": "Urban Safety and Street Lighting Fund",
            "sanction_reference": "RW/BLR/94823"
        },
        {
            "_id": ObjectId(),
            "project_id": str(project2_id),
            "project_title": "Koramangala Street Light Restoration",
            "contractor": "Sharma Constructions",
            "amount": 45000.0,
            "type": "disbursement",
            "status": "approved",
            "requested_at": datetime.utcnow() - timedelta(hours=12),
            "approved_at": datetime.utcnow() - timedelta(hours=12),
            "approved_by": "Dr. Ananya Reddy",
            "district": "Bangalore Urban",
            "source": "Urban Safety and Street Lighting Fund",
            "sanction_reference": "RW/BLR/94824"
        }
    ]
    await db.db.budget.insert_many(budget_entries)


    # ── Alerts ────────────────────────────────────────────────────────────────
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
            "message": "Complaint for HSR Layout crack is approaching SLA deadline (48h remaining).",
            "created_at": datetime.utcnow() - timedelta(hours=1),
            "read": False,
            "actionable": True,
            "target_roles": ["government", "superadmin"]
        },
        {
            "_id": ObjectId(),
            "type": "info",
            "title": "New Hotspot Detected",
            "message": "AI identified Koramangala as emerging hotspot with 34% more complaints vs last month.",
            "location": "Koramangala, Bangalore",
            "created_at": datetime.utcnow() - timedelta(hours=2),
            "read": False,
            "actionable": True,
            "target_roles": ["government", "superadmin"]
        },
        {
            "_id": ObjectId(),
            "type": "success",
            "title": "Repair Completed",
            "message": "Indiranagar debris clearance completed and verified by citizen.",
            "created_at": datetime.utcnow() - timedelta(hours=3),
            "read": True,
            "actionable": False,
            "target_roles": ["government", "superadmin", "contractor"]
        }
    ]

    await db.db.alerts.insert_many(alerts)

    print("Initial data seeded successfully!")
    print("\n📧 Demo Login Credentials:")
    print("   Citizen:         citizen@demo.com     / demo123")
    print("   Contractor 1:    contractor@demo.com  / demo123  (Kumar Infrastructure)")
    print("   Contractor 2:    contractor2@demo.com / demo123  (Sharma Constructions)")
    print("   Contractor 3:    contractor3@demo.com / demo123  (Ali Roads & Bridges)")
    print("   Government Admin: admin@demo.com      / demo123")
    print("   Super Admin:     superadmin@demo.com  / demo123\n")

def get_database():
    return db.db
