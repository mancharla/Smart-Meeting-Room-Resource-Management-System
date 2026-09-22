# Smart Meeting Room & Resource Management System

## Overview

The **Smart Meeting Room & Resource Management System** is a full-stack enterprise web application that helps organizations manage meeting rooms, shared resources, bookings, notifications, analytics, and reports from a centralized platform.

## Technologies Used

### Frontend

* React.js
* TypeScript
* Material UI
* React Router
* Axios
* FullCalendar
* Chart.js

### Backend

* Python 3.12
* FastAPI
* SQLAlchemy
* Pydantic
* JWT Authentication
* Celery
* Redis

### Database & Tools

* MySQL 8.0
* Alembic
* Pytest
* OpenPyXL
* ReportLab
* Swagger UI

## Key Features

* User registration and JWT-based login
* Role-Based Access Control (Admin and Employee)
* Meeting room CRUD management
* Office resource management and room-resource assignment
* Room and resource booking
* Room and resource conflict detection
* Recurring meeting validation
* Booking modification and cancellation
* Notifications and background tasks
* Dashboard and room utilization analytics
* Monthly booking and resource usage reports
* Excel and PDF report generation
* Audit logging
* API validation and unit testing

## Architecture

The project follows a **Full-Stack Layered Architecture**:

```text
React + TypeScript
        ↓
Axios REST API
        ↓
FastAPI Backend
        ↓
Service Layer + SQLAlchemy ORM
        ↓
MySQL Database

FastAPI → Redis → Celery Workers
```

## User Roles

### Admin

* Manage users and departments
* Manage meeting rooms and resources
* View bookings and reports
* Access analytics and audit logs

### Employee

* View room availability
* Create and manage personal bookings
* Reserve shared resources
* View notifications

## Project Structure

```text
backend/
├── app/
│   ├── routers/
│   ├── models/
│   ├── schemas/
│   ├── services/
│   ├── dependencies/
│   └── tasks/
└── tests/

frontend/
└── src/
    ├── api/
    ├── components/
    ├── context/
    ├── pages/
    ├── routes/
    ├── services/
    └── types/
```

## Running the Project

### Backend

```powershell
cd "D:\projects\Smart Meeting Room & Resource Management System\backend"
uvicorn app.main:app --reload
```

### Frontend

```powershell
cd "D:\projects\Smart Meeting Room & Resource Management System\frontend"
node .\node_modules\vite\bin\vite.js
```

### Application URLs

* Frontend: `http://localhost:5173`
* API Documentation: `http://127.0.0.1:8000/docs`

## Conclusion

This project demonstrates full-stack development, REST API integration, secure authentication, database management, booking conflict prevention, background processing, analytics, and enterprise application architecture.
