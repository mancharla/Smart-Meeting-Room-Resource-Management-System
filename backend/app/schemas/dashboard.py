from pydantic import BaseModel


class DashboardSummaryResponse(BaseModel):
    total_rooms: int
    available_rooms: int
    unavailable_rooms: int

    total_resources: int
    available_resources: int
    unavailable_resources: int

    total_bookings: int
    today_bookings: int
    upcoming_bookings: int
    cancelled_bookings: int

from datetime import datetime


class UpcomingMeetingResponse(BaseModel):
    id: int
    user_id: int
    room_id: int
    title: str
    description: str | None
    start_time: datetime
    end_time: datetime
    status: str

class RoomUtilizationResponse(BaseModel):
    room_id: int
    room_name: str
    total_bookings: int
    booked_hours: float
    utilization_percentage: float

class ResourceUsageResponse(BaseModel):
    resource_id: int
    resource_name: str
    resource_type: str
    total_quantity: int
    total_bookings: int
    quantity_hours: float


class MonthlyBookingResponse(BaseModel):
    month: int
    month_name: str
    total_bookings: int
    confirmed_bookings: int
    cancelled_bookings: int
    completed_bookings: int