from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


# ============================================================
# BOOKING RESOURCE CREATE
# ============================================================

class BookingResourceCreate(BaseModel):
    resource_id: int = Field(
        ...,
        gt=0,
    )

    quantity: int = Field(
        ...,
        gt=0,
    )


# ============================================================
# BOOKING CREATE
# ============================================================

class BookingCreate(BaseModel):
    room_id: int = Field(
        ...,
        gt=0,
    )

    title: str = Field(
        ...,
        min_length=2,
        max_length=200,
    )

    description: str | None = Field(
        default=None,
        max_length=1000,
    )

    start_time: datetime

    end_time: datetime

    recurrence: str | None = Field(
        default=None,
        max_length=50,
    )

    recurrence_end_date: datetime | None = None

    resources: list[BookingResourceCreate] = Field(
        default_factory=list,
    )


# ============================================================
# BOOKING UPDATE
# ============================================================

class BookingUpdate(BaseModel):
    room_id: int | None = Field(
        default=None,
        gt=0,
    )

    title: str | None = Field(
        default=None,
        min_length=2,
        max_length=200,
    )

    description: str | None = Field(
        default=None,
        max_length=1000,
    )

    start_time: datetime | None = None

    end_time: datetime | None = None

    recurrence: str | None = Field(
        default=None,
        max_length=50,
    )

    recurrence_end_date: datetime | None = None

    resources: list[BookingResourceCreate] | None = None


# ============================================================
# BOOKING RESOURCE RESPONSE
# ============================================================

class BookingResourceResponse(BaseModel):
    resource_id: int
    quantity: int

    model_config = ConfigDict(
        from_attributes=True,
    )


# ============================================================
# BOOKING RESPONSE
# ============================================================

class BookingResponse(BaseModel):
    id: int

    user_id: int

    room_id: int

    title: str

    description: str | None

    start_time: datetime

    end_time: datetime

    recurrence: str | None

    recurrence_end_date: datetime | None

    status: str

    resources: list[BookingResourceResponse] = Field(
        default_factory=list,
    )

    created_at: datetime

    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )


# ============================================================
# BOOKING STATUS UPDATE
# ============================================================

class BookingStatusUpdate(BaseModel):
    status: str = Field(
        ...,
        min_length=2,
        max_length=50,
    )
