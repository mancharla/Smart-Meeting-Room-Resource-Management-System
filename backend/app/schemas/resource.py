from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ResourceCreate(BaseModel):
    name: str = Field(
        ...,
        min_length=2,
        max_length=100
    )

    resource_type: str = Field(
        ...,
        min_length=2,
        max_length=100
    )

    quantity: int = Field(
        ...,
        gt=0
    )

    description: str | None = Field(
        default=None,
        max_length=500
    )

    is_available: bool = True


class ResourceUpdate(BaseModel):
    name: str | None = Field(
        default=None,
        min_length=2,
        max_length=100
    )

    resource_type: str | None = Field(
        default=None,
        min_length=2,
        max_length=100
    )

    quantity: int | None = Field(
        default=None,
        gt=0
    )

    description: str | None = Field(
        default=None,
        max_length=500
    )

    is_available: bool | None = None


class ResourceResponse(BaseModel):
    id: int
    name: str
    resource_type: str
    quantity: int
    description: str | None
    is_available: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )

