from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import require_role
from app.models.booking import Booking
from app.models.user import User
from app.schemas.report import (
    BookingReportResponse,
    BookingReportSummaryResponse,
)
from fastapi.responses import StreamingResponse
from app.utils.pdf_export import create_booking_pdf

from app.utils.excel_export import create_booking_excel
from app.utils.booking_constants import (
    BOOKING_STATUS_CANCELLED,
    BOOKING_STATUS_COMPLETED,
    BOOKING_STATUS_CONFIRMED,
)


router = APIRouter(
    prefix="/api/v1/reports",
    tags=["Reports"],
)


# ============================================================
# BOOKING REPORT
# ============================================================

@router.get(
    "/bookings",
    response_model=list[BookingReportResponse],
)
def get_booking_report(
    start_date: datetime | None = Query(default=None),
    end_date: datetime | None = Query(default=None),
    room_id: int | None = Query(default=None, gt=0),
    booking_status: str | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("ADMIN")
    ),
):
    if (
        start_date is not None
        and end_date is not None
        and end_date <= start_date
    ):
        raise HTTPException(
            status_code=400,
            detail="End date must be after start date",
        )

    query = db.query(Booking)

    if start_date is not None:
        query = query.filter(
            Booking.start_time >= start_date
        )

    if end_date is not None:
        query = query.filter(
            Booking.end_time <= end_date
        )

    if room_id is not None:
        query = query.filter(
            Booking.room_id == room_id
        )

    if booking_status is not None:
        normalized_status = booking_status.upper()

        valid_statuses = {
            BOOKING_STATUS_CONFIRMED,
            BOOKING_STATUS_CANCELLED,
            BOOKING_STATUS_COMPLETED,
        }

        if normalized_status not in valid_statuses:
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

    bookings = (
        query
        .order_by(Booking.start_time.asc())
        .all()
    )

    return [
        BookingReportResponse(
            booking_id=booking.id,
            user_id=booking.user_id,
            room_id=booking.room_id,
            title=booking.title,
            start_time=booking.start_time,
            end_time=booking.end_time,
            status=booking.status,
        )
        for booking in bookings
    ]


# ============================================================
# BOOKING REPORT SUMMARY
# ============================================================

@router.get(
    "/bookings/summary",
    response_model=BookingReportSummaryResponse,
)
def get_booking_report_summary(
    start_date: datetime | None = Query(default=None),
    end_date: datetime | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("ADMIN")
    ),
):
    if (
        start_date is not None
        and end_date is not None
        and end_date <= start_date
    ):
        raise HTTPException(
            status_code=400,
            detail="End date must be after start date",
        )

    query = db.query(Booking)

    if start_date is not None:
        query = query.filter(
            Booking.start_time >= start_date
        )

    if end_date is not None:
        query = query.filter(
            Booking.end_time <= end_date
        )

    bookings = query.all()

    total_bookings = len(bookings)

    confirmed_bookings = sum(
        1
        for booking in bookings
        if booking.status == BOOKING_STATUS_CONFIRMED
    )

    cancelled_bookings = sum(
        1
        for booking in bookings
        if booking.status == BOOKING_STATUS_CANCELLED
    )

    completed_bookings = sum(
        1
        for booking in bookings
        if booking.status == BOOKING_STATUS_COMPLETED
    )

    total_booked_seconds = 0

    for booking in bookings:
        if booking.status != BOOKING_STATUS_CANCELLED:
            duration = (
                booking.end_time
                - booking.start_time
            )

            total_booked_seconds += (
                duration.total_seconds()
            )

    total_booked_hours = (
        total_booked_seconds / 3600
    )

    return BookingReportSummaryResponse(
        total_bookings=total_bookings,
        confirmed_bookings=confirmed_bookings,
        cancelled_bookings=cancelled_bookings,
        completed_bookings=completed_bookings,
        total_booked_hours=round(
            total_booked_hours,
            2,
        ),
    )
# ============================================================
# EXCEL BOOKING REPORT
# ============================================================

@router.get(
    "/bookings/export/excel"
)
def export_booking_report_excel(
    start_date: datetime | None = Query(default=None),
    end_date: datetime | None = Query(default=None),
    room_id: int | None = Query(default=None, gt=0),
    booking_status: str | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("ADMIN")
    ),
):
    if (
        start_date is not None
        and end_date is not None
        and end_date <= start_date
    ):
        raise HTTPException(
            status_code=400,
            detail="End date must be after start date",
        )

    query = db.query(Booking)

    if start_date is not None:
        query = query.filter(
            Booking.start_time >= start_date
        )

    if end_date is not None:
        query = query.filter(
            Booking.end_time <= end_date
        )

    if room_id is not None:
        query = query.filter(
            Booking.room_id == room_id
        )

    if booking_status is not None:
        normalized_status = booking_status.upper()

        valid_statuses = {
            BOOKING_STATUS_CONFIRMED,
            BOOKING_STATUS_CANCELLED,
            BOOKING_STATUS_COMPLETED,
        }

        if normalized_status not in valid_statuses:
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

    bookings = (
        query
        .order_by(Booking.start_time.asc())
        .all()
    )

    excel_file = create_booking_excel(bookings)

    return StreamingResponse(
        excel_file,
        media_type=(
            "application/vnd.openxmlformats-officedocument."
            "spreadsheetml.sheet"
        ),
        headers={
            "Content-Disposition": (
                "attachment; "
                'filename="booking_report.xlsx"'
            )
        },
    )
# ============================================================
# PDF BOOKING REPORT
# ============================================================

@router.get(
    "/bookings/export/pdf"
)
def export_booking_report_pdf(
    start_date: datetime | None = Query(default=None),
    end_date: datetime | None = Query(default=None),
    room_id: int | None = Query(default=None, gt=0),
    booking_status: str | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("ADMIN")
    ),
):
    if (
        start_date is not None
        and end_date is not None
        and end_date <= start_date
    ):
        raise HTTPException(
            status_code=400,
            detail="End date must be after start date",
        )

    query = db.query(Booking)

    if start_date is not None:
        query = query.filter(
            Booking.start_time >= start_date
        )

    if end_date is not None:
        query = query.filter(
            Booking.end_time <= end_date
        )

    if room_id is not None:
        query = query.filter(
            Booking.room_id == room_id
        )

    if booking_status is not None:
        normalized_status = booking_status.upper()

        valid_statuses = {
            BOOKING_STATUS_CONFIRMED,
            BOOKING_STATUS_CANCELLED,
            BOOKING_STATUS_COMPLETED,
        }

        if normalized_status not in valid_statuses:
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

    bookings = (
        query
        .order_by(Booking.start_time.asc())
        .all()
    )

    pdf_file = create_booking_pdf(bookings)

    return StreamingResponse(
        pdf_file,
        media_type="application/pdf",
        headers={
            "Content-Disposition": (
                "attachment; "
                'filename="booking_report.pdf"'
            )
        },
    )