from datetime import datetime, timedelta

from fastapi import HTTPException


SUPPORTED_RECURRENCES = {
    "DAILY",
    "WEEKLY",
    "MONTHLY",
}


def validate_recurrence(
    recurrence: str | None,
    recurrence_end_date: datetime | None,
    start_time: datetime,
):
    if recurrence is None:
        if recurrence_end_date is not None:
            raise HTTPException(
                status_code=400,
                detail=(
                    "recurrence_end_date cannot be provided "
                    "when recurrence is not specified"
                ),
            )

        return

    recurrence = recurrence.upper()

    if recurrence not in SUPPORTED_RECURRENCES:
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid recurrence. Supported values: "
                "DAILY, WEEKLY, MONTHLY"
            ),
        )

    if recurrence_end_date is None:
        raise HTTPException(
            status_code=400,
            detail=(
                "recurrence_end_date is required "
                "for recurring bookings"
            ),
        )

    if recurrence_end_date <= start_time:
        raise HTTPException(
            status_code=400,
            detail=(
                "recurrence_end_date must be after "
                "the booking start time"
            ),
        )


def generate_occurrences(
    start_time: datetime,
    end_time: datetime,
    recurrence: str | None,
    recurrence_end_date: datetime | None,
):
    """
    Generate every occurrence of a recurring booking.

    Returns tuples:
        (occurrence_start, occurrence_end)
    """

    if recurrence is None:
        return [
            (
                start_time,
                end_time,
            )
        ]

    recurrence = recurrence.upper()

    validate_recurrence(
        recurrence=recurrence,
        recurrence_end_date=recurrence_end_date,
        start_time=start_time,
    )

    duration = end_time - start_time

    occurrences = []

    current_start = start_time

    while current_start <= recurrence_end_date:

        current_end = current_start + duration

        occurrences.append(
            (
                current_start,
                current_end,
            )
        )

        if recurrence == "DAILY":
            current_start += timedelta(days=1)

        elif recurrence == "WEEKLY":
            current_start += timedelta(days=7)

        elif recurrence == "MONTHLY":
            # Simple monthly recurrence.
            # Move forward approximately one month
            # while preserving the day when possible.
            year = current_start.year
            month = current_start.month

            if month == 12:
                year += 1
                month = 1
            else:
                month += 1

            try:
                current_start = current_start.replace(
                    year=year,
                    month=month,
                )
            except ValueError:
                # Handles dates such as January 31.
                # Use the last valid day of the next month.
                if month == 12:
                    next_month = current_start.replace(
                        year=year + 1,
                        month=1,
                        day=1,
                    )
                else:
                    next_month = current_start.replace(
                        year=year,
                        month=month + 1,
                        day=1,
                    )

                current_start = next_month - timedelta(days=1)

    return occurrences