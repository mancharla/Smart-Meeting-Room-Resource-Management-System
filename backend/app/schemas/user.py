from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class UserResponse(BaseModel):
    id: int
    full_name: str
    email: str
    role_id: int
    department_id: int | None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )


class AdminUserUpdate(BaseModel):
    role_id: int | None = Field(
        default=None,
        gt=0
    )

    department_id: int | None = Field(
        default=None,
        gt=0
    )

    is_active: bool | None = None


class AdminUserResponse(BaseModel):
    id: int
    full_name: str
    email: str
    role_id: int
    role_name: str
    department_id: int | None
    department_name: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )
