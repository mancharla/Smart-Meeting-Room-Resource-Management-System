from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.meeting_room import MeetingRoom
from app.models.resource import Resource
from app.models.resource import Resource
from app.models.meeting_room import MeetingRoom


class RoomResource(Base):
    __tablename__ = "room_resources"

    room_id: Mapped[int] = mapped_column(
        ForeignKey("meeting_rooms.id", ondelete="CASCADE"),
        primary_key=True,
    )

    resource_id: Mapped[int] = mapped_column(
        ForeignKey("resources.id", ondelete="CASCADE"),
        primary_key=True,
    )

    room: Mapped["MeetingRoom"] = relationship(
        "MeetingRoom",
        back_populates="room_resources",
    )

    resource: Mapped["Resource"] = relationship(
        "Resource",
        back_populates="room_resources",
    )