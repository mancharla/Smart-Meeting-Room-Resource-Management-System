from datetime import datetime

from app.core.database import SessionLocal
from app.models.booking import Booking
from app.models.notification import Notification
from app.tasks.celery_app import celery_app
from app.utils.booking_constants import BOOKING_STATUS_CANCELLED


# ============================================================
# TEST NOTIFICATION TASK
# ============================================================

@celery_app.task(name="notifications.test_notification")
def test_notification_task(
    user_id: int,
    message: str,
):
    print(
        f"Notification task executed | "
        f"user_id={user_id} | "
        f"message={message}"
    )

    return {
        "status": "success",
        "user_id": user_id,
        "message": message,
    }


# ============================================================
# CREATE MEETING REMINDER
# ============================================================

@celery_app.task(
    name="notifications.create_meeting_reminder"
)
def create_meeting_reminder_task(
    booking_id: int,
):
    db = SessionLocal()

    try:
        # ----------------------------------------------------
        # Find booking
        # ----------------------------------------------------

        booking = (
            db.query(Booking)
            .filter(
                Booking.id == booking_id
            )
            .first()
        )

        if not booking:
            return {
                "status": "failed",
                "message": "Booking not found",
            }

        # ----------------------------------------------------
        # Do not create reminder for cancelled booking
        # ----------------------------------------------------

        if booking.status == BOOKING_STATUS_CANCELLED:
            return {
                "status": "skipped",
                "message": "Booking is cancelled",
            }

        # ----------------------------------------------------
        # Create notification
        # ----------------------------------------------------

        notification = Notification(
            user_id=booking.user_id,
            title="Meeting Reminder",
            message=(
                f'Your meeting "{booking.title}" '
                f"starts at {booking.start_time}."
            ),
            notification_type="MEETING_REMINDER",
            is_read=False,
            scheduled_at=datetime.now(),
        )

        db.add(notification)

        db.commit()

        db.refresh(notification)

        return {
            "status": "success",
            "booking_id": booking.id,
            "notification_id": notification.id,
        }

    finally:
        db.close()


# ============================================================
# SCHEDULE MEETING REMINDER
# ============================================================

@celery_app.task(
    name="notifications.schedule_meeting_reminder"
)
def schedule_meeting_reminder_task(
    booking_id: int,
    reminder_time: str,
):
    reminder_datetime = datetime.fromisoformat(
        reminder_time
    )

    create_meeting_reminder_task.apply_async(
        args=[booking_id],
        eta=reminder_datetime,
    )

    return {
        "status": "scheduled",
        "booking_id": booking_id,
        "reminder_time": reminder_time,
    }