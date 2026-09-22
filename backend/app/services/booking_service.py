from datetime import datetime

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.booking import Booking
from app.models.booking_resource import BookingResource
from app.models.meeting_room import MeetingRoom
from app.models.resource import Resource
from app.models.user import User
from app.utils.booking_constants import BOOKING_STATUS_CANCELLED

def validate_booking_times(
    start_time: datetime,
    end_time: datetime,
):
    if end_time <= start_time:
        raise HTTPException(
            status_code=400,
            detail="End time must be after start time",
        )


def check_room_exists(
    db: Session,
    room_id: int,
) -> MeetingRoom:

    room = (
        db.query(MeetingRoom)
        .filter(MeetingRoom.id == room_id)
        .first()
    )

    if not room:
        raise HTTPException(
            status_code=404,
            detail="Meeting room not found",
        )

    if not room.is_available:
        raise HTTPException(
            status_code=400,
            detail="Meeting room is currently unavailable",
        )

    return room


def check_room_conflict(
    db: Session,
    room_id: int,
    start_time: datetime,
    end_time: datetime,
    exclude_booking_id: int | None = None,
):
    query = (
        db.query(Booking)
        .filter(
            Booking.room_id == room_id,
            Booking.status != BOOKING_STATUS_CANCELLED,
            Booking.start_time < end_time,
            Booking.end_time > start_time,
        )
    )

    if exclude_booking_id is not None:
        query = query.filter(
            Booking.id != exclude_booking_id
        )

    conflicting_booking = query.first()

    if conflicting_booking:
        raise HTTPException(
            status_code=409,
            detail=(
                "Meeting room is already booked "
                "during the requested time slot"
            ),
        )

    return True


def validate_room_booking(
    db: Session,
    room_id: int,
    start_time: datetime,
    end_time: datetime,
    exclude_booking_id: int | None = None,
):
    validate_booking_times(
        start_time=start_time,
        end_time=end_time,
    )

    check_room_exists(
        db=db,
        room_id=room_id,
    )

    check_room_conflict(
        db=db,
        room_id=room_id,
        start_time=start_time,
        end_time=end_time,
        exclude_booking_id=exclude_booking_id,
    )

    return True


def check_booking_owner(
    booking: Booking,
    current_user: User,
):
    if (
        booking.user_id != current_user.id
        and current_user.role
        and current_user.role.name != "ADMIN"
    ):
        raise HTTPException(
            status_code=403,
            detail="You can only manage your own bookings",
        )

    return True

def check_resource_conflict(
    db: Session,
    resource_id: int,
    requested_quantity: int,
    start_time: datetime,
    end_time: datetime,
    exclude_booking_id: int | None = None,
):
    resource = (
        db.query(Resource)
        .filter(Resource.id == resource_id)
        .first()
    )

    if not resource:
        raise HTTPException(
            status_code=404,
            detail=f"Resource with ID {resource_id} not found",
        )

    if not resource.is_available:
        raise HTTPException(
            status_code=400,
            detail=f"Resource '{resource.name}' is currently unavailable",
        )

    if requested_quantity > resource.quantity:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Requested quantity for '{resource.name}' "
                f"exceeds total available quantity"
            ),
        )

    query = (
        db.query(BookingResource)
        .join(
            Booking,
            Booking.id == BookingResource.booking_id,
        )
        .filter(
            BookingResource.resource_id == resource_id,
            Booking.status != "CANCELLED",
            Booking.start_time < end_time,
            Booking.end_time > start_time,
        )
    )

    if exclude_booking_id is not None:
        query = query.filter(
            Booking.id != exclude_booking_id
        )

    existing_assignments = query.all()

    reserved_quantity = sum(
        assignment.quantity
        for assignment in existing_assignments
    )

    remaining_quantity = resource.quantity - reserved_quantity

    if requested_quantity > remaining_quantity:
        raise HTTPException(
            status_code=409,
            detail=(
                f"Resource '{resource.name}' does not have enough "
                f"available quantity for the requested time slot. "
                f"Available: {remaining_quantity}, "
                f"Requested: {requested_quantity}"
            ),
        )

    return True