from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import get_current_user, require_role
from app.models.meeting_room import MeetingRoom
from app.models.user import User
from app.schemas.meeting_room import (
    MeetingRoomCreate,
    MeetingRoomResponse,
    MeetingRoomUpdate,
)
from app.services.audit_service import create_audit_log


router = APIRouter(
    prefix="/api/v1/meeting-rooms",
    tags=["Meeting Rooms"],
)


# ============================================================
# CREATE MEETING ROOM
# ADMIN ONLY
# ============================================================

@router.post(
    "",
    response_model=MeetingRoomResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_meeting_room(
    data: MeetingRoomCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    existing_room = (
        db.query(MeetingRoom)
        .filter(MeetingRoom.name == data.name)
        .first()
    )

    if existing_room:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Meeting room with this name already exists",
        )

    room = MeetingRoom(
        name=data.name,
        location=data.location,
        capacity=data.capacity,
        description=data.description,
        facilities=data.facilities,
        is_available=data.is_available,
    )

    db.add(room)
    db.commit()
    db.refresh(room)

    # --------------------------------------------------------
    # Audit log
    # --------------------------------------------------------

    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="CREATE",
        entity_type="MEETING_ROOM",
        entity_id=room.id,
        description=(
            f"Meeting room created: {room.name}"
        ),
    )

    return room


# ============================================================
# GET ALL MEETING ROOMS
# ADMIN + EMPLOYEE
# ============================================================

@router.get(
    "",
    response_model=list[MeetingRoomResponse],
)
def get_meeting_rooms(
    search: str | None = Query(default=None),
    location: str | None = Query(default=None),
    min_capacity: int | None = Query(default=None, gt=0),
    is_available: bool | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(MeetingRoom)

    # Search by room name
    if search:
        search_value = f"%{search}%"

        query = query.filter(
            MeetingRoom.name.ilike(search_value)
        )

    # Filter by location
    if location:
        location_value = f"%{location}%"

        query = query.filter(
            MeetingRoom.location.ilike(location_value)
        )

    # Filter by minimum capacity
    if min_capacity is not None:
        query = query.filter(
            MeetingRoom.capacity >= min_capacity
        )

    # Filter by availability
    if is_available is not None:
        query = query.filter(
            MeetingRoom.is_available == is_available
        )

    return (
        query
        .order_by(MeetingRoom.name.asc())
        .all()
    )


# ============================================================
# GET SINGLE MEETING ROOM
# ADMIN + EMPLOYEE
# ============================================================

@router.get(
    "/{room_id}",
    response_model=MeetingRoomResponse,
)
def get_meeting_room(
    room_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    room = (
        db.query(MeetingRoom)
        .filter(MeetingRoom.id == room_id)
        .first()
    )

    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting room not found",
        )

    return room


# ============================================================
# UPDATE MEETING ROOM
# ADMIN ONLY
# ============================================================

@router.put(
    "/{room_id}",
    response_model=MeetingRoomResponse,
)
def update_meeting_room(
    room_id: int,
    data: MeetingRoomUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    room = (
        db.query(MeetingRoom)
        .filter(MeetingRoom.id == room_id)
        .first()
    )

    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting room not found",
        )

    # --------------------------------------------------------
    # Check duplicate room name
    # --------------------------------------------------------

    if data.name is not None:
        existing_room = (
            db.query(MeetingRoom)
            .filter(
                MeetingRoom.name == data.name,
                MeetingRoom.id != room_id,
            )
            .first()
        )

        if existing_room:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Meeting room with this name already exists",
            )

        room.name = data.name

    # --------------------------------------------------------
    # Update fields
    # --------------------------------------------------------

    if data.location is not None:
        room.location = data.location

    if data.capacity is not None:
        room.capacity = data.capacity

    if data.description is not None:
        room.description = data.description

    if data.facilities is not None:
        room.facilities = data.facilities

    if data.is_available is not None:
        room.is_available = data.is_available

    db.commit()
    db.refresh(room)

    # --------------------------------------------------------
    # Audit log
    # --------------------------------------------------------

    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="UPDATE",
        entity_type="MEETING_ROOM",
        entity_id=room.id,
        description=(
            f"Meeting room updated: {room.name}"
        ),
    )

    return room


# ============================================================
# DELETE MEETING ROOM
# ADMIN ONLY
# ============================================================

@router.delete(
    "/{room_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_meeting_room(
    room_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    room = (
        db.query(MeetingRoom)
        .filter(MeetingRoom.id == room_id)
        .first()
    )

    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting room not found",
        )

    # Check whether the room has bookings
    if room.bookings:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete meeting room because bookings exist",
        )

    # Save values before deleting the object
    deleted_room_id = room.id
    deleted_room_name = room.name

    db.delete(room)
    db.commit()

    # --------------------------------------------------------
    # Audit log
    # --------------------------------------------------------

    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="DELETE",
        entity_type="MEETING_ROOM",
        entity_id=deleted_room_id,
        description=(
            f"Meeting room deleted: "
            f"{deleted_room_name}"
        ),
    )

    return None
