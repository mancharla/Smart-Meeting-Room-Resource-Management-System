from pydantic import BaseModel, ConfigDict


class RoomResourceAssign(BaseModel):
    room_id: int
    resource_id: int


class RoomResourceResponse(BaseModel):
    room_id: int
    resource_id: int

    model_config = ConfigDict(
        from_attributes=True
    )
