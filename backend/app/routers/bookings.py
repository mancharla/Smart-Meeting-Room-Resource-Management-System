from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import get_current_user

from app.models.booking import Booking
from app.models.booking_resource import BookingResource
from app.models.resource import Resource
from app.models.user import User

from app.tasks.notification_tasks import schedule_meeting_reminder_task

from app.utils.booking_constants import (
    BOOKING_STATUS_CANCELLED,
    BOOKING_STATUS_CONFIRMED,
    VALID_BOOKING_STATUSES,
)

from app.schemas.booking import (
    BookingCreate,
    BookingResponse,
    BookingUpdate,
)

from app.services.notification_service import (
    create_booking_cancellation_notification,
    create_booking_confirmation_notification,
)

from app.services.booking_service import (
    check_booking_owner,
    check_resource_conflict,
    validate_room_booking,
)

from app.services.recurrence_service import (
    generate_occurrences,
)

from app.services.audit_service import create_audit_log


router = APIRouter(
    prefix="/api/v1/bookings",
    tags=["Bookings"],
)


# ============================================================
# HELPER FUNCTIONS
# ============================================================

def validate_duplicate_resources(resources):
    """
    Prevent the same resource from being added
    more than once in a single booking.
    """

    resource_ids = set()

    for resource_data in resources:

        if resource_data.resource_id in resource_ids:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Resource with ID "
                    f"{resource_data.resource_id} "
                    f"cannot be added more than once"
                ),
            )

        resource_ids.add(
            resource_data.resource_id
        )


def build_booking_response(
    booking: Booking,
) -> BookingResponse:
    """
    Convert SQLAlchemy Booking object into
    BookingResponse.

    Maps:
        booking.booking_resources
    to:
        response.resources
    """

    resources = [
        {
            "resource_id": item.resource_id,
            "quantity": item.quantity,
        }
        for item in booking.booking_resources
    ]

    return BookingResponse(
        id=booking.id,
        user_id=booking.user_id,
        room_id=booking.room_id,
        title=booking.title,
        description=booking.description,
        start_time=booking.start_time,
        end_time=booking.end_time,
        recurrence=booking.recurrence,
        recurrence_end_date=booking.recurrence_end_date,
        status=booking.status,
        resources=resources,
        created_at=booking.created_at,
        updated_at=booking.updated_at,
    )


# ============================================================
# CREATE BOOKING
# ============================================================

@router.post(
    "",
    response_model=BookingResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_booking(
    data: BookingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    # --------------------------------------------------------
    # Validate duplicate resources
    # --------------------------------------------------------

    validate_duplicate_resources(
        data.resources
    )

    # --------------------------------------------------------
    # Generate occurrences
    # --------------------------------------------------------

    occurrences = generate_occurrences(
        start_time=data.start_time,
        end_time=data.end_time,
        recurrence=data.recurrence,
        recurrence_end_date=data.recurrence_end_date,
    )

    # --------------------------------------------------------
    # Validate every occurrence
    # --------------------------------------------------------

    for occurrence_start, occurrence_end in occurrences:

        validate_room_booking(
            db=db,
            room_id=data.room_id,
            start_time=occurrence_start,
            end_time=occurrence_end,
        )

        for resource_data in data.resources:

            check_resource_conflict(
                db=db,
                resource_id=resource_data.resource_id,
                requested_quantity=resource_data.quantity,
                start_time=occurrence_start,
                end_time=occurrence_end,
            )

    # --------------------------------------------------------
    # Validate resource objects
    # --------------------------------------------------------

    resource_objects = []

    for resource_data in data.resources:

        resource = (
            db.query(Resource)
            .filter(
                Resource.id == resource_data.resource_id
            )
            .first()
        )

        if not resource:
            raise HTTPException(
                status_code=404,
                detail=(
                    f"Resource with ID "
                    f"{resource_data.resource_id} "
                    f"not found"
                ),
            )

        if not resource.is_available:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Resource '{resource.name}' "
                    f"is currently unavailable"
                ),
            )

        if resource_data.quantity > resource.quantity:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Requested quantity for "
                    f"'{resource.name}' exceeds "
                    f"available quantity"
                ),
            )

        resource_objects.append(
            (
                resource,
                resource_data.quantity,
            )
        )

    # --------------------------------------------------------
    # Create booking
    # --------------------------------------------------------

    try:

        booking = Booking(
            user_id=current_user.id,
            room_id=data.room_id,
            title=data.title,
            description=data.description,
            start_time=data.start_time,
            end_time=data.end_time,
            recurrence=data.recurrence,
            recurrence_end_date=data.recurrence_end_date,
            status=BOOKING_STATUS_CONFIRMED,
        )

        db.add(booking)

        db.flush()

        # ----------------------------------------------------
        # Add resources
        # ----------------------------------------------------

        for resource, quantity in resource_objects:

            booking_resource = BookingResource(
                booking_id=booking.id,
                resource_id=resource.id,
                quantity=quantity,
            )

            db.add(booking_resource)

        db.commit()

        db.refresh(booking)

        # ----------------------------------------------------
        # Audit log
        # ----------------------------------------------------

        create_audit_log(
            db=db,
            user_id=current_user.id,
            action="CREATE",
            entity_type="BOOKING",
            entity_id=booking.id,
            description=(
                f"Booking created: "
                f"{booking.title}"
            ),
        )

        # ----------------------------------------------------
        # Booking confirmation notification
        # ----------------------------------------------------

        create_booking_confirmation_notification(
            db=db,
            user_id=current_user.id,
            booking_title=booking.title,
            start_time=booking.start_time,
            end_time=booking.end_time,
        )

        # ----------------------------------------------------
        # Schedule meeting reminder
        # ----------------------------------------------------

        reminder_time = (
            booking.start_time
            - timedelta(minutes=15)
        )

        if reminder_time > booking.created_at:

            schedule_meeting_reminder_task.delay(
                booking.id,
                reminder_time.isoformat(),
            )

        return build_booking_response(
            booking
        )

    except Exception:
        db.rollback()
        raise


# ============================================================
# LIST BOOKINGS
# ============================================================

@router.get(
    "",
    response_model=list[BookingResponse],
)
def get_bookings(
    title: str | None = Query(
        default=None,
    ),
    room_id: int | None = Query(
        default=None,
        gt=0,
    ),
    booking_status: str | None = Query(
        default=None,
    ),
    start_date: datetime | None = Query(
        default=None,
    ),
    end_date: datetime | None = Query(
        default=None,
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    query = db.query(Booking)

    # --------------------------------------------------------
    # Employee sees own bookings
    # --------------------------------------------------------

    if (
        not current_user.role
        or current_user.role.name != "ADMIN"
    ):
        query = query.filter(
            Booking.user_id == current_user.id
        )

    # --------------------------------------------------------
    # Search title
    # --------------------------------------------------------

    if title:
        query = query.filter(
            Booking.title.ilike(
                f"%{title}%"
            )
        )

    # --------------------------------------------------------
    # Room filter
    # --------------------------------------------------------

    if room_id is not None:
        query = query.filter(
            Booking.room_id == room_id
        )

    # --------------------------------------------------------
    # Status filter
    # --------------------------------------------------------

    if booking_status:

        normalized_status = (
            booking_status.upper()
        )

        if normalized_status not in VALID_BOOKING_STATUSES:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Invalid booking status. "
                    "Supported values: "
                    "CONFIRMED, CANCELLED, COMPLETED"
                ),
            )

        query = query.filter(
            Booking.status == normalized_status
        )

    # --------------------------------------------------------
    # Start date filter
    # --------------------------------------------------------

    if start_date is not None:
        query = query.filter(
            Booking.start_time >= start_date
        )

    # --------------------------------------------------------
    # End date filter
    # --------------------------------------------------------

    if end_date is not None:
        query = query.filter(
            Booking.end_time <= end_date
        )

    bookings = (
        query
        .order_by(
            Booking.start_time.asc()
        )
        .all()
    )

    return [
        build_booking_response(booking)
        for booking in bookings
    ]


# ============================================================
# GET SINGLE BOOKING
# ============================================================

@router.get(
    "/{booking_id}",
    response_model=BookingResponse,
)
def get_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    booking = (
        db.query(Booking)
        .filter(
            Booking.id == booking_id
        )
        .first()
    )

    if not booking:
        raise HTTPException(
            status_code=404,
            detail="Booking not found",
        )

    # --------------------------------------------------------
    # Ownership check
    # --------------------------------------------------------

    if (
        booking.user_id != current_user.id
        and (
            not current_user.role
            or current_user.role.name != "ADMIN"
        )
    ):
        raise HTTPException(
            status_code=403,
            detail=(
                "You can only access "
                "your own bookings"
            ),
        )

    return build_booking_response(
        booking
    )


# ============================================================
# UPDATE BOOKING
# ============================================================

@router.put(
    "/{booking_id}",
    response_model=BookingResponse,
)
def update_booking(
    booking_id: int,
    data: BookingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    booking = (
        db.query(Booking)
        .filter(
            Booking.id == booking_id
        )
        .first()
    )

    if not booking:
        raise HTTPException(
            status_code=404,
            detail="Booking not found",
        )

    # --------------------------------------------------------
    # Ownership check
    # --------------------------------------------------------

    check_booking_owner(
        booking=booking,
        current_user=current_user,
    )

    # --------------------------------------------------------
    # Cancelled bookings cannot be modified
    # --------------------------------------------------------

    if booking.status == BOOKING_STATUS_CANCELLED:
        raise HTTPException(
            status_code=400,
            detail=(
                "Cancelled bookings "
                "cannot be modified"
            ),
        )

    # --------------------------------------------------------
    # Determine new values
    # --------------------------------------------------------

    new_room_id = (
        data.room_id
        if data.room_id is not None
        else booking.room_id
    )

    new_start_time = (
        data.start_time
        if data.start_time is not None
        else booking.start_time
    )

    new_end_time = (
        data.end_time
        if data.end_time is not None
        else booking.end_time
    )

    new_recurrence = (
        data.recurrence
        if data.recurrence is not None
        else booking.recurrence
    )

    new_recurrence_end_date = (
        data.recurrence_end_date
        if data.recurrence_end_date is not None
        else booking.recurrence_end_date
    )

    # --------------------------------------------------------
    # Validate duplicate resources
    # --------------------------------------------------------

    if data.resources is not None:

        validate_duplicate_resources(
            data.resources
        )

    # --------------------------------------------------------
    # Generate occurrences
    # --------------------------------------------------------

    occurrences = generate_occurrences(
        start_time=new_start_time,
        end_time=new_end_time,
        recurrence=new_recurrence,
        recurrence_end_date=new_recurrence_end_date,
    )

    # --------------------------------------------------------
    # Validate occurrences
    # --------------------------------------------------------

    for occurrence_start, occurrence_end in occurrences:

        validate_room_booking(
            db=db,
            room_id=new_room_id,
            start_time=occurrence_start,
            end_time=occurrence_end,
            exclude_booking_id=booking.id,
        )

        if data.resources is not None:

            for resource_data in data.resources:

                check_resource_conflict(
                    db=db,
                    resource_id=resource_data.resource_id,
                    requested_quantity=resource_data.quantity,
                    start_time=occurrence_start,
                    end_time=occurrence_end,
                    exclude_booking_id=booking.id,
                )

    # --------------------------------------------------------
    # Validate resources
    # --------------------------------------------------------

    resource_objects = []

    if data.resources is not None:

        for resource_data in data.resources:

            resource = (
                db.query(Resource)
                .filter(
                    Resource.id
                    == resource_data.resource_id
                )
                .first()
            )

            if not resource:
                raise HTTPException(
                    status_code=404,
                    detail=(
                        f"Resource with ID "
                        f"{resource_data.resource_id} "
                        f"not found"
                    ),
                )

            if not resource.is_available:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"Resource '{resource.name}' "
                        f"is currently unavailable"
                    ),
                )

            if resource_data.quantity > resource.quantity:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"Requested quantity for "
                        f"'{resource.name}' exceeds "
                        f"available quantity"
                    ),
                )

            resource_objects.append(
                (
                    resource,
                    resource_data.quantity,
                )
            )

    # --------------------------------------------------------
    # Update booking
    # --------------------------------------------------------

    try:

        booking.room_id = new_room_id

        booking.start_time = new_start_time

        booking.end_time = new_end_time

        booking.recurrence = new_recurrence

        booking.recurrence_end_date = (
            new_recurrence_end_date
        )

        if data.title is not None:
            booking.title = data.title

        if data.description is not None:
            booking.description = data.description

        # ----------------------------------------------------
        # Replace resources only when supplied
        # ----------------------------------------------------

        if data.resources is not None:

            db.query(
                BookingResource
            ).filter(
                BookingResource.booking_id
                == booking.id
            ).delete(
                synchronize_session=False
            )

            for resource, quantity in resource_objects:

                booking_resource = BookingResource(
                    booking_id=booking.id,
                    resource_id=resource.id,
                    quantity=quantity,
                )

                db.add(booking_resource)

        db.commit()

        db.refresh(booking)

        # ----------------------------------------------------
        # Audit log
        # ----------------------------------------------------

        create_audit_log(
            db=db,
            user_id=current_user.id,
            action="UPDATE",
            entity_type="BOOKING",
            entity_id=booking.id,
            description=(
                f"Booking updated: "
                f"{booking.title}"
            ),
        )

        return build_booking_response(
            booking
        )

    except Exception:
        db.rollback()
        raise


# ============================================================
# CANCEL BOOKING
# ============================================================

@router.patch(
    "/{booking_id}/cancel",
    response_model=BookingResponse,
)
def cancel_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    booking = (
        db.query(Booking)
        .filter(
            Booking.id == booking_id
        )
        .first()
    )

    if not booking:
        raise HTTPException(
            status_code=404,
            detail="Booking not found",
        )

    # --------------------------------------------------------
    # Ownership check
    # --------------------------------------------------------

    check_booking_owner(
        booking=booking,
        current_user=current_user,
    )

    # --------------------------------------------------------
    # Already cancelled
    # --------------------------------------------------------

    if booking.status == BOOKING_STATUS_CANCELLED:
        raise HTTPException(
            status_code=400,
            detail="Booking is already cancelled",
        )

    # --------------------------------------------------------
    # Cancel booking
    # --------------------------------------------------------

    booking.status = BOOKING_STATUS_CANCELLED

    db.commit()

    db.refresh(booking)

    # --------------------------------------------------------
    # Audit log
    # --------------------------------------------------------

    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="CANCEL",
        entity_type="BOOKING",
        entity_id=booking.id,
        description=(
            f"Booking cancelled: "
            f"{booking.title}"
        ),
    )

    # --------------------------------------------------------
    # Cancellation notification
    # --------------------------------------------------------

    create_booking_cancellation_notification(
        db=db,
        user_id=booking.user_id,
        booking_title=booking.title,
    )

    return build_booking_response(
        booking
    )

