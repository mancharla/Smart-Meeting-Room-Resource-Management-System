from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers.auth import router as auth_router
from app.routers.departments import router as departments_router
from app.routers.users import router as users_router
from app.routers.meeting_rooms import router as meeting_rooms_router
from app.routers.resources import router as resources_router
from app.routers.room_resources import router as room_resources_router
from app.routers import bookings
from app.routers.notifications import router as notifications_router
from app.routers import dashboard
from app.routers import reports
from app.routers import audit_logs

app = FastAPI(
    title="Smart Meeting Room & Resource Management System",
    description="Enterprise Meeting Room and Office Resource Management API",
    version="1.0.0",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(departments_router)
app.include_router(users_router)
app.include_router(meeting_rooms_router)
app.include_router(resources_router)
app.include_router(room_resources_router)
app.include_router(bookings.router)
app.include_router(notifications_router)
app.include_router(dashboard.router)
app.include_router(reports.router)
app.include_router(audit_logs.router)

@app.get("/health")
def health_check():
    return {
        "status": "success",
        "message": "Smart Meeting Room API is running",
    }