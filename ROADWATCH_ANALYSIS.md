# ROADWATCH V3 Repository Analysis

## Current Folder Structure

- `backend/`: FastAPI API server.
  - `main.py`: App bootstrap, CORS, static upload mount, router registration, health/public stats.
  - `config.py`: Environment-backed settings for MongoDB, JWT, CORS, upload limits, Grok.
  - `database.py`: MongoDB connection, index creation, demo seed data.
  - `models/`: Pydantic models for users, complaints, contractors, projects.
  - `routes/`: API routers for auth, complaints, contractors, projects, analytics, alerts, AI assistant.
  - `services/ai_service.py`: Rule-based/Grok-assisted text AI for complaints, duplicate checks, chat, analytics.
  - `utils/security.py`: Password/JWT helpers and role guards.
- `src/`: React + Vite + Tailwind frontend.
  - `App.tsx`: Role-based dashboard/page routing.
  - `store/useStore.ts`: Zustand app store with mock data and local persistence.
  - `services/api.ts`: HTTP client for backend endpoints and image upload.
  - `components/dashboards/`: Citizen, Government, Contractor, Super Admin dashboards.
  - `components/pages/`: Complaints, Map, Projects, Budget, Analytics, AI Assistant, Alerts, management pages.
  - `components/ui/`, `components/charts/`, `components/layout/`: Shared UI, charts, shell.
- `public/`: Static assets.
- Root scripts: `start-frontend.*`, `start-backend.*`.

## Existing APIs

- `GET /`, `GET /health`, `GET /api/stats`
- Auth: `/api/auth/login`, `/api/auth/register`, `/api/auth/me`
- Complaints:
  - `POST /api/complaints/`
  - `GET /api/complaints/`
  - `GET /api/complaints/{id}`
  - `PUT /api/complaints/{id}`
  - `POST /api/complaints/{id}/vote`
  - `POST /api/complaints/{id}/comment`
  - `POST /api/complaints/{id}/assign`
  - `POST /api/complaints/analyze`
  - `POST /api/complaints/upload-image`
- Projects:
  - `POST /api/projects/`
  - `GET /api/projects/`
  - `GET /api/projects/{id}`
  - `PUT /api/projects/{id}`
  - `POST /api/projects/{id}/work-log`
  - `PUT /api/projects/{id}/milestone/{index}`
- Contractors: list/profile/performance routes in `backend/routes/contractors.py`.
- Analytics: dashboard, trends, districts, contractors, AI insights, hotspots, SLA.
- Alerts: list, read, read-all, delete, create.
- AI: chat, recommendations, predictive maintenance, complaint analysis, duplicate check.

## Existing MongoDB Collections

- `users`: Demo roles include citizen, contractor, government, superadmin. Indexed by email and role.
- `complaints`: Road issue documents with GeoJSON location, status, severity, AI analysis, votes, comments, images. Indexed by status, severity, category, reporter, reported time, and geospatial coordinates.
- `contractors`: Contractor profiles linked to users, regions, specialization, rating, project counts, performance score.
- `projects`: Contractor work items linked to complaints, budget, progress, milestones, work logs.
- `alerts`: Role/user targeted notification records.

## Existing Dashboard Modules

- Citizen dashboard: Citizen overview and issue tracking.
- Government dashboard: Complaint review, verification, contractor assignment, budget approvals, SLA, trends, hotspots.
- Contractor dashboard: Active projects, budget usage, deadlines, performance, recommendations.
- Super Admin dashboard: National/system metrics, state performance, AI governance, audit logs.
- Supporting pages: Complaints, Map View, Projects, Work Progress, Budget, Analytics, Alerts, Contractor/User Management, AI Assistant.

## Existing Complaint Workflow

Current backend and frontend flow:

1. Citizen creates complaint with title, description, category, location, optional images.
2. Backend runs text AI analysis for category, severity, cost, priority, confidence.
3. Backend marks potential duplicates in `ai_analysis.duplicate_of` but still inserts a new complaint.
4. Government verifies, rejects, or assigns.
5. Assignment links a contractor/project and moves status toward `assigned` or `in_progress`.
6. Project completion moves related complaints to `resolved`.

## Existing Map Implementation

- `src/components/pages/MapViewPage.tsx` uses Leaflet and OpenStreetMap tiles.
- It combines store complaints with many generated mock Bangalore issues.
- It currently renders individual markers, supports filters, layers, selected detail panel, and stats.
- It has a layer selector for heatmap/hotspots, but the underlying map mostly uses marker rendering.

## Missing Components

- Real image-based defect detection service.
- Pluggable model configuration for pretrained YOLO now and custom model later.
- Duplicate handling that supports an existing complaint instead of creating another one.
- Structured fields for GPS capture, support count/supporters, bounding boxes, annotated image, severity score, cost/time estimates, priority score, traffic importance.
- Repair validation from before/after images.
- Citizen verification and reopen flow.
- Contractor progress photo fields and richer contractor metrics.
- Notification emission for key lifecycle transitions.
- Backend map clustering/heatmap endpoints.
- Dashboard surfaces for AI priority queue, severity/cost/time filters, hotspot analytics, contractor ranking, duplicate/fraud analytics.

## Recommended Modifications

- Add a dedicated road AI service that wraps YOLOv8 with lazy loading and environment-configured model path.
- Keep `yolov8n.pt` as the initial pretrained model and allow `YOLO_MODEL_PATH` to point to a custom trained model later.
- Extend existing complaint models rather than creating duplicate complaint modules.
- Upgrade `POST /api/complaints/` to run image analysis, duplicate detection, scoring, cost/time/priority engines, and notification creation.
- Add explicit endpoints for image analysis preview, complaint support, repair validation, citizen verification, priority queue, and map intelligence.
- Keep static upload handling and generate annotated images into the same upload directory.
- Preserve frontend dashboards and enrich their cards/tables with new fields.
- Replace high-volume marker rendering with client-side clustering and heatmap density rendering in the existing map page.
