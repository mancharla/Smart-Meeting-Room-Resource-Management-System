from datetime import datetime
from typing import List

from sqlalchemy import DateTime, ForeignKey, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin


class Booking(TimestampMixin, Base):
    __tablename__ = "bookings"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
        index=True
    )

    room_id: Mapped[int] = mapped_column(
        ForeignKey("meeting_rooms.id"),
        nullable=False,
        index=True
    )

    title: Mapped[str] = mapped_column(
        String(200),
        nullable=False
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    start_time: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False
    )

    end_time: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False
    )

    recurrence: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True
    )

    recurrence_end_date: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True
    )

    status: Mapped[str] = mapped_column(
        String(30),
        default="CONFIRMED",
        nullable=False
    )

    user: Mapped["User"] = relationship(
        "User",
        back_populates="bookings"
    )

    room: Mapped["MeetingRoom"] = relationship(
        "MeetingRoom",
        back_populates="bookings"
    )

    booking_resources: Mapped[List["BookingResource"]] = relationship(
        "BookingResource",
        back_populates="booking",
        cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index(
            "ix_booking_room_time",
            "room_id",
            "start_time",
            "end_time"
        ),
    )