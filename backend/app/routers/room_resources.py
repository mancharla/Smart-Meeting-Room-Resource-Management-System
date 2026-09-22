from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import get_current_user, require_role
from app.models.meeting_room import MeetingRoom
from app.models.resource import Resource
from app.models.room_resource import RoomResource
from app.models.user import User
from app.schemas.room_resource import (
    RoomResourceAssign,
    RoomResourceResponse,
)
from app.services.audit_service import create_audit_log


router = APIRouter(
    prefix="/api/v1/room-resources",
    tags=["Room Resources"],
)


# ============================================================
# ASSIGN RESOURCE TO MEETING ROOM
# ADMIN ONLY
# ============================================================

@router.post(
    "",
    response_model=RoomResourceResponse,
    status_code=status.HTTP_201_CREATED,
)
def assign_resource_to_room(
    data: RoomResourceAssign,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    # Check meeting room
    room = (
        db.query(MeetingRoom)
        .filter(MeetingRoom.id == data.room_id)
        .first()
    )

    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting room not found",
        )

    # Check resource
    resource = (
        db.query(Resource)
        .filter(Resource.id == data.resource_id)
        .first()
    )

    if not resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resource not found",
        )

    # Check if already assigned
    existing_assignment = (
        db.query(RoomResource)
        .filter(
            RoomResource.room_id == data.room_id,
            RoomResource.resource_id == data.resource_id,
        )
        .first()
    )

    if existing_assignment:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Resource is already assigned to this meeting room",
        )

    assignment = RoomResource(
        room_id=data.room_id,
        resource_id=data.resource_id,
    )

    db.add(assignment)
    db.commit()
    db.refresh(assignment)

    # --------------------------------------------------------
    # Audit log
    # --------------------------------------------------------

    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="ASSIGN",
        entity_type="ROOM_RESOURCE",
        entity_id=None,
        description=(
            f"Resource '{resource.name}' assigned to "
            f"meeting room '{room.name}'"
        ),
    )

    return assignment


# ============================================================
# GET RESOURCES ASSIGNED TO A ROOM
# ADMIN + EMPLOYEE
# ============================================================

@router.get(
    "/room/{room_id}",
    response_model=list[RoomResourceResponse],
)
def get_room_resources(
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

    return (
        db.query(RoomResource)
        .filter(RoomResource.room_id == room_id)
        .all()
    )


# ============================================================
# GET ROOMS ASSIGNED TO A RESOURCE
# ADMIN + EMPLOYEE
# ============================================================

@router.get(
    "/resource/{resource_id}",
    response_model=list[RoomResourceResponse],
)
def get_resource_rooms(
    resource_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    resource = (
        db.query(Resource)
        .filter(Resource.id == resource_id)
        .first()
    )

    if not resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resource not found",
        )

    return (
        db.query(RoomResource)
        .filter(RoomResource.resource_id == resource_id)
        .all()
    )


# ============================================================
# REMOVE RESOURCE FROM MEETING ROOM
# ADMIN ONLY
# ============================================================

@router.delete(
    "/room/{room_id}/resource/{resource_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def remove_resource_from_room(
    room_id: int,
    resource_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    assignment = (
        db.query(RoomResource)
        .filter(
            RoomResource.room_id == room_id,
            RoomResource.resource_id == resource_id,
        )
        .first()
    )

    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resource assignment not found",
        )

    # Get names before deleting the assignment
    room = (
        db.query(MeetingRoom)
        .filter(MeetingRoom.id == room_id)
        .first()
    )

    resource = (
        db.query(Resource)
        .filter(Resource.id == resource_id)
        .first()
    )

    room_name = room.name if room else f"ID {room_id}"
    resource_name = (
        resource.name
        if resource
        else f"ID {resource_id}"
    )

    db.delete(assignment)
    db.commit()

    # --------------------------------------------------------
    # Audit log
    # --------------------------------------------------------

    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="REMOVE",
        entity_type="ROOM_RESOURCE",
        entity_id=None,
        description=(
            f"Resource '{resource_name}' removed from "
            f"meeting room '{room_name}'"
        ),
    )

    return None
