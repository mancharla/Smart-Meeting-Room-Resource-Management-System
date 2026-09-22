from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class MeetingRoomCreate(BaseModel):
    name: str = Field(
        ...,
        min_length=2,
        max_length=100
    )

    location: str = Field(
        ...,
        min_length=2,
        max_length=200
    )

    capacity: int = Field(
        ...,
        gt=0,
        le=1000
    )

    description: str | None = Field(
        default=None,
        max_length=500
    )

    facilities: str | None = Field(
        default=None,
        max_length=1000
    )

    is_available: bool = True


class MeetingRoomUpdate(BaseModel):
    name: str | None = Field(
        default=None,
        min_length=2,
        max_length=100
    )

    location: str | None = Field(
        default=None,
        min_length=2,
        max_length=200
    )

    capacity: int | None = Field(
        default=None,
        gt=0,
        le=1000
    )

    description: str | None = Field(
        default=None,
        max_length=500
    )

    facilities: str | None = Field(
        default=None,
        max_length=1000
    )

    is_available: bool | None = None


class MeetingRoomResponse(BaseModel):
    id: int
    name: str
    location: str
    capacity: int
    description: str | None
    facilities: str | None
    is_available: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )
