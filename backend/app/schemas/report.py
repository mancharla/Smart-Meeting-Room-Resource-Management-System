from datetime import datetime

from pydantic import BaseModel


class BookingReportResponse(BaseModel):
    booking_id: int
    user_id: int
    room_id: int
    title: str
    start_time: datetime
    end_time: datetime
    status: str


class BookingReportSummaryResponse(BaseModel):
    total_bookings: int
    confirmed_bookings: int
    cancelled_bookings: int
    completed_bookings: int
    total_booked_hours: float