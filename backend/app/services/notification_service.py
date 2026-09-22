from datetime import datetime

from sqlalchemy.orm import Session

from app.models.notification import Notification


def create_notification(
    db: Session,
    user_id: int,
    title: str,
    message: str,
    notification_type: str,
    scheduled_at: datetime | None = None,
):
    notification = Notification(
        user_id=user_id,
        title=title,
        message=message,
        notification_type=notification_type,
        is_read=False,
        scheduled_at=scheduled_at,
    )

    db.add(notification)
    db.commit()
    db.refresh(notification)

    return notification


def create_booking_confirmation_notification(
    db: Session,
    user_id: int,
    booking_title: str,
    start_time: datetime,
    end_time: datetime,
):
    return create_notification(
        db=db,
        user_id=user_id,
        title="Booking Confirmed",
        message=(
            f'Your meeting "{booking_title}" has been booked successfully '
            f"from {start_time} to {end_time}."
        ),
        notification_type="BOOKING_CONFIRMATION",
    )


def create_booking_cancellation_notification(
    db: Session,
    user_id: int,
    booking_title: str,
):
    return create_notification(
        db=db,
        user_id=user_id,
        title="Booking Cancelled",
        message=f'Your meeting "{booking_title}" has been cancelled.',
        notification_type="BOOKING_CANCELLATION",
    )