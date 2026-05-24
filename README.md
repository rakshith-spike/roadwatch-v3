# 🛣️ ROAD-WATCH: AI-Powered Smart Governance Platform

A comprehensive platform for monitoring road infrastructure, managing complaints, tracking contractor activity, and ensuring government transparency.

![ROAD-WATCH](https://img.shields.io/badge/ROAD--WATCH-v1.0.0-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.109.0-green)
![React](https://img.shields.io/badge/React-19.x-blue)
![MongoDB](https://img.shields.io/badge/MongoDB-7.x-green)

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Demo Credentials](#demo-credentials)
- [Architecture](#architecture)

## ✨ Features

### 🎯 Core Features

- **Role-Based Dashboards**: Citizen, Contractor, Government Admin, Super Admin
- **AI-Powered Analysis**: Automatic categorization, severity prediction, duplicate detection
- **Interactive Maps**: GIS integration with heatmaps and live issue markers
- **Smart Analytics**: Comprehensive dashboards with predictive insights
- **Real-time Alerts**: Instant notifications for SLA breaches and emergencies
- **Transparency Portal**: Complete visibility into budgets and contractor performance

### 👥 Role-Based Features

| Feature | Citizen | Contractor | Government | Super Admin |
|---------|---------|------------|------------|-------------|
| Dashboard | ✅ | ✅ | ✅ | ✅ |
| File Complaints | ✅ | ❌ | ❌ | ❌ |
| Track Status | ✅ | ✅ | ✅ | ✅ |
| Manage Projects | ❌ | ✅ | ✅ | ✅ |
| Analytics | Basic | Basic | Advanced | Full |
| User Management | ❌ | ❌ | ❌ | ✅ |
| System Settings | ❌ | ❌ | Limited | Full |

## 🛠️ Tech Stack

### Frontend
- **React 19** with TypeScript
- **Vite** for fast development
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **Recharts** for data visualization
- **Zustand** for state management

### Backend
- **FastAPI** (Python 3.11+)
- **MongoDB** with Motor (async driver)
- **JWT Authentication**
- **Pydantic** for data validation

### AI Services
- Complaint categorization
- Severity prediction
- Duplicate detection
- Predictive maintenance

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18+ and npm
- **Python** 3.11+
- **MongoDB** 6+ (local or cloud)
- **Git**

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd roadwatch
```

### 2. Setup Backend

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env

# Start MongoDB (if not running)
# On Windows: mongod
# On macOS: brew services start mongodb-community
# On Linux: sudo systemctl start mongod

# Run the backend server
python main.py
```

The backend will start at `http://localhost:8000`
- API Docs: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

### 3. Setup Frontend

```bash
# Open a new terminal
# Navigate to project root (not backend folder)
cd ..

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will start at `http://localhost:5173`

### 4. Access the Application

1. Open `http://localhost:5173` in your browser
2. Use the role selector to log in as any role
3. Explore the dashboard!

## 📁 Project Structure

```
roadwatch/
├── backend/                    # FastAPI Backend
│   ├── main.py                # Application entry point
│   ├── config.py              # Configuration settings
│   ├── database.py            # MongoDB connection & seeding
│   ├── requirements.txt       # Python dependencies
│   ├── models/                # Pydantic models
│   │   ├── user.py
│   │   ├── complaint.py
│   │   ├── contractor.py
│   │   └── project.py
│   ├── routes/                # API routes
│   │   ├── auth.py
│   │   ├── complaints.py
│   │   ├── contractors.py
│   │   ├── projects.py
│   │   ├── analytics.py
│   │   ├── alerts.py
│   │   └── ai.py
│   ├── services/              # Business logic
│   │   └── ai_service.py
│   └── utils/                 # Utilities
│       └── security.py
│
├── src/                       # React Frontend
│   ├── App.tsx               # Main application
│   ├── main.tsx              # Entry point
│   ├── index.css             # Global styles
│   ├── store/                # State management
│   │   └── useStore.ts
│   ├── components/
│   │   ├── ui/               # Reusable UI components
│   │   ├── layout/           # Layout components
│   │   ├── charts/           # Chart components
│   │   ├── dashboards/       # Role-based dashboards
│   │   └── pages/            # Feature pages
│   └── utils/                # Utilities
│
├── public/                    # Static assets
├── index.html                # HTML entry point
├── package.json              # Node dependencies
├── vite.config.ts            # Vite configuration
└── README.md                 # This file
```

## 🔑 Demo Credentials

After starting the backend, the following demo accounts are automatically created:

| Role | Email | Password |
|------|-------|----------|
| Citizen | citizen@demo.com | demo123 |
| Contractor | contractor@demo.com | demo123 |
| Government Admin | admin@demo.com | demo123 |
| Super Admin | superadmin@demo.com | demo123 |

## 📚 API Documentation

### Base URL
```
http://localhost:8000/api
```

### Authentication
All endpoints (except `/auth/login` and `/auth/register`) require JWT authentication.

Include the token in the Authorization header:
```
Authorization: Bearer <access_token>
```

### Main Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login user |
| GET | `/auth/me` | Get current user |
| GET | `/complaints` | List complaints |
| POST | `/complaints` | Create complaint |
| GET | `/complaints/{id}` | Get complaint |
| PUT | `/complaints/{id}` | Update complaint |
| GET | `/projects` | List projects |
| POST | `/projects` | Create project |
| GET | `/contractors` | List contractors |
| GET | `/analytics/dashboard` | Get dashboard stats |
| GET | `/analytics/trends` | Get trend data |
| POST | `/ai/chat` | AI chat assistant |
| GET | `/alerts` | Get alerts |

### Full API Documentation
Visit `http://localhost:8000/docs` for interactive API documentation.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         ROAD-WATCH                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌───────────────┐    ┌───────────────┐    ┌───────────────┐    │
│  │   Frontend    │    │    Backend    │    │   Database    │    │
│  │   React/Vite  │───▶│    FastAPI    │───▶│   MongoDB     │    │
│  │   Port 5173   │    │   Port 8000   │    │  Port 27017   │    │
│  └───────────────┘    └───────────────┘    └───────────────┘    │
│         │                    │                                    │
│         │                    ▼                                    │
│         │            ┌───────────────┐                           │
│         │            │  AI Service   │                           │
│         │            │  - Classify   │                           │
│         │            │  - Predict    │                           │
│         └───────────▶│  - Recommend  │                           │
│                      └───────────────┘                           │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## 🔧 Configuration

### Backend (.env)
```env
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=roadwatch
SECRET_KEY=your-secret-key
DEBUG=True
```

### Frontend
The frontend automatically connects to `http://localhost:8000` for API calls.

## 🐛 Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running: `mongod`
- Check connection string in `.env`

### Port Already in Use
- Backend: Change PORT in `.env`
- Frontend: `npm run dev -- --port 3000`

### Module Not Found (Python)
```bash
pip install -r requirements.txt
```

### Module Not Found (Node)
```bash
npm install
```

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 Support

For support, email support@roadwatch.gov.in or create an issue in the repository.

---

Built with ❤️ for better infrastructure management
