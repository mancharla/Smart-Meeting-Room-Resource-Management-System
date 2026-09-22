from sqlalchemy import ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class BookingResource(Base):
    __tablename__ = "booking_resources"

    booking_id: Mapped[int] = mapped_column(
        ForeignKey("bookings.id", ondelete="CASCADE"),
        primary_key=True
    )

    resource_id: Mapped[int] = mapped_column(
        ForeignKey("resources.id", ondelete="CASCADE"),
        primary_key=True
    )

    quantity: Mapped[int] = mapped_column(
        Integer,
        default=1,
        nullable=False
    )

    booking: Mapped["Booking"] = relationship(
        "Booking",
        back_populates="booking_resources"
    )

    resource: Mapped["Resource"] = relationship(
        "Resource",
        back_populates="booking_resources"
    )