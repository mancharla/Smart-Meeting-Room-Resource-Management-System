from datetime import datetime, time

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.models.booking import Booking
from app.models.meeting_room import MeetingRoom
from app.models.resource import Resource
from app.models.user import User
from sqlalchemy import extract
from app.models.booking_resource import BookingResource
from app.schemas.dashboard import DashboardSummaryResponse
from app.schemas.dashboard import (
    DashboardSummaryResponse,
    UpcomingMeetingResponse,
    RoomUtilizationResponse,
    ResourceUsageResponse,
    MonthlyBookingResponse,
)
from app.schemas.meeting_room import MeetingRoomResponse

router = APIRouter(
    prefix="/api/v1/dashboard",
    tags=["Dashboard"],
)


@router.get(
    "/summary",
    response_model=DashboardSummaryResponse,
)
def get_dashboard_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Room statistics
    total_rooms = db.query(MeetingRoom).count()

    available_rooms = (
        db.query(MeetingRoom)
        .filter(MeetingRoom.is_available.is_(True))
        .count()
    )

    unavailable_rooms = (
        db.query(MeetingRoom)
        .filter(MeetingRoom.is_available.is_(False))
        .count()
    )

    # Resource statistics
    total_resources = db.query(Resource).count()

    available_resources = (
        db.query(Resource)
        .filter(Resource.is_available.is_(True))
        .count()
    )

    unavailable_resources = (
        db.query(Resource)
        .filter(Resource.is_available.is_(False))
        .count()
    )

    # Booking statistics
    total_bookings = db.query(Booking).count()

    today = datetime.now().date()

    today_start = datetime.combine(today, time.min)
    today_end = datetime.combine(today, time.max)

    today_bookings = (
        db.query(Booking)
        .filter(
            Booking.start_time >= today_start,
            Booking.start_time <= today_end,
            Booking.status != "CANCELLED",
        )
        .count()
    )

    now = datetime.now()

    upcoming_bookings = (
        db.query(Booking)
        .filter(
            Booking.start_time > now,
            Booking.status != "CANCELLED",
        )
        .count()
    )

    cancelled_bookings = (
        db.query(Booking)
        .filter(
            Booking.status == "CANCELLED",
        )
        .count()
    )

    return DashboardSummaryResponse(
        total_rooms=total_rooms,
        available_rooms=available_rooms,
        unavailable_rooms=unavailable_rooms,
        total_resources=total_resources,
        available_resources=available_resources,
        unavailable_resources=unavailable_resources,
        total_bookings=total_bookings,
        today_bookings=today_bookings,
        upcoming_bookings=upcoming_bookings,
        cancelled_bookings=cancelled_bookings,
    )
@router.get(
    "/upcoming-meetings",
    response_model=list[UpcomingMeetingResponse],
)
def get_upcoming_meetings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = (
        db.query(Booking)
        .filter(
            Booking.start_time > datetime.now(),
            Booking.status != "CANCELLED",
        )
    )

    # Employees can only see their own meetings.
    # Admins can see all upcoming meetings.
    if not current_user.role or current_user.role.name != "ADMIN":
        query = query.filter(
            Booking.user_id == current_user.id
        )

    bookings = (
        query
        .order_by(Booking.start_time.asc())
        .limit(10)
        .all()
    )

    return bookings
@router.get(
    "/available-rooms",
    response_model=list[MeetingRoomResponse],
)
def get_available_rooms(
    start_time: datetime,
    end_time: datetime,
    min_capacity: int | None = None,
    location: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if end_time <= start_time:
        raise HTTPException(
            status_code=400,
            detail="End time must be after start time",
        )

    query = (
        db.query(MeetingRoom)
        .filter(MeetingRoom.is_available.is_(True))
    )

    if min_capacity is not None:
        query = query.filter(
            MeetingRoom.capacity >= min_capacity
        )

    if location:
        query = query.filter(
            MeetingRoom.location.ilike(f"%{location}%")
        )

    rooms = query.order_by(MeetingRoom.name.asc()).all()

    available_rooms = []

    for room in rooms:
        conflicting_booking = (
            db.query(Booking)
            .filter(
                Booking.room_id == room.id,
                Booking.status != "CANCELLED",
                Booking.start_time < end_time,
                Booking.end_time > start_time,
            )
            .first()
        )

        if not conflicting_booking:
            available_rooms.append(room)

    return available_rooms
@router.get(
    "/room-utilization",
    response_model=list[RoomUtilizationResponse],
)
def get_room_utilization(
    start_date: datetime,
    end_date: datetime,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if end_date <= start_date:
        raise HTTPException(
            status_code=400,
            detail="End date must be after start date",
        )

    rooms = (
        db.query(MeetingRoom)
        .order_by(MeetingRoom.name.asc())
        .all()
    )

    total_days = (end_date.date() - start_date.date()).days + 1

    available_hours = total_days * 9

    results = []

    for room in rooms:
        bookings = (
            db.query(Booking)
            .filter(
                Booking.room_id == room.id,
                Booking.status != "CANCELLED",
                Booking.start_time < end_date,
                Booking.end_time > start_date,
            )
            .all()
        )

        booked_seconds = 0

        for booking in bookings:
            booking_start = max(
                booking.start_time,
                start_date,
            )

            booking_end = min(
                booking.end_time,
                end_date,
            )

            if booking_end > booking_start:
                booked_seconds += (
                    booking_end - booking_start
                ).total_seconds()

        booked_hours = booked_seconds / 3600

        if available_hours > 0:
            utilization_percentage = (
                booked_hours / available_hours
            ) * 100
        else:
            utilization_percentage = 0

        results.append(
            RoomUtilizationResponse(
                room_id=room.id,
                room_name=room.name,
                total_bookings=len(bookings),
                booked_hours=round(booked_hours, 2),
                utilization_percentage=round(
                    utilization_percentage,
                    2,
                ),
            )
        )

    return results
@router.get(
    "/resource-usage",
    response_model=list[ResourceUsageResponse],
)
def get_resource_usage(
    start_date: datetime,
    end_date: datetime,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if end_date <= start_date:
        raise HTTPException(
            status_code=400,
            detail="End date must be after start date",
        )

    resources = (
        db.query(Resource)
        .order_by(Resource.name.asc())
        .all()
    )

    results = []

    for resource in resources:
        booking_resources = (
            db.query(BookingResource)
            .join(
                Booking,
                Booking.id == BookingResource.booking_id,
            )
            .filter(
                BookingResource.resource_id == resource.id,
                Booking.status != "CANCELLED",
                Booking.start_time < end_date,
                Booking.end_time > start_date,
            )
            .all()
        )

        total_quantity_hours = 0.0
        booking_ids = set()

        for booking_resource in booking_resources:
            booking = booking_resource.booking

            booking_start = max(
                booking.start_time,
                start_date,
            )

            booking_end = min(
                booking.end_time,
                end_date,
            )

            if booking_end > booking_start:
                duration_hours = (
                    booking_end - booking_start
                ).total_seconds() / 3600

                total_quantity_hours += (
                    duration_hours
                    * booking_resource.quantity
                )

                booking_ids.add(booking.id)

        results.append(
            ResourceUsageResponse(
                resource_id=resource.id,
                resource_name=resource.name,
                resource_type=resource.resource_type,
                total_quantity=resource.quantity,
                total_bookings=len(booking_ids),
                quantity_hours=round(
                    total_quantity_hours,
                    2,
                ),
            )
        )

    return results
@router.get(
    "/monthly-bookings",
    response_model=list[MonthlyBookingResponse],
)
def get_monthly_bookings(
    year: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if year < 2000 or year > 2100:
        raise HTTPException(
            status_code=400,
            detail="Year must be between 2000 and 2100",
        )

    month_names = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
    ]

    results = []

    for month in range(1, 13):
        query = (
            db.query(Booking)
            .filter(
                extract("year", Booking.start_time) == year,
                extract("month", Booking.start_time) == month,
            )
        )

        # Employees see only their own booking statistics.
        # Admins see organization-wide statistics.
        if not current_user.role or current_user.role.name != "ADMIN":
            query = query.filter(
                Booking.user_id == current_user.id
            )

        bookings = query.all()

        total_bookings = len(bookings)

        confirmed_bookings = sum(
            1
            for booking in bookings
            if booking.status == "CONFIRMED"
        )

        cancelled_bookings = sum(
            1
            for booking in bookings
            if booking.status == "CANCELLED"
        )

        completed_bookings = sum(
            1
            for booking in bookings
            if booking.status == "COMPLETED"
        )

        results.append(
            MonthlyBookingResponse(
                month=month,
                month_name=month_names[month - 1],
                total_bookings=total_bookings,
                confirmed_bookings=confirmed_bookings,
                cancelled_bookings=cancelled_bookings,
                completed_bookings=completed_bookings,
            )
        )

    return results