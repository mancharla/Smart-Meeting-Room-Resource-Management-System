from typing import List

from sqlalchemy import Boolean, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin


class MeetingRoom(TimestampMixin, Base):
    __tablename__ = "meeting_rooms"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    name: Mapped[str] = mapped_column(
        String(150),
        unique=True,
        nullable=False,
        index=True
    )

    location: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True
    )

    capacity: Mapped[int] = mapped_column(
        Integer,
        nullable=False
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    facilities: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    is_available: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False
    )

    bookings: Mapped[List["Booking"]] = relationship(
        "Booking",
        back_populates="room"
    )

    room_resources: Mapped[List["RoomResource"]] = relationship(
        "RoomResource",
        back_populates="room",
        cascade="all, delete-orphan"
    )