from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import get_current_user, require_role
from app.models.resource import Resource
from app.models.user import User
from app.schemas.resource import (
    ResourceCreate,
    ResourceResponse,
    ResourceUpdate,
)
from app.services.audit_service import create_audit_log


router = APIRouter(
    prefix="/api/v1/resources",
    tags=["Resources"],
)


# ============================================================
# CREATE RESOURCE
# ADMIN ONLY
# ============================================================

@router.post(
    "",
    response_model=ResourceResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_resource(
    data: ResourceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    existing_resource = (
        db.query(Resource)
        .filter(
            Resource.name == data.name,
            Resource.resource_type == data.resource_type,
        )
        .first()
    )

    if existing_resource:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Resource with this name and type already exists",
        )

    resource = Resource(
        name=data.name,
        resource_type=data.resource_type,
        quantity=data.quantity,
        description=data.description,
        is_available=data.is_available,
    )

    db.add(resource)
    db.commit()
    db.refresh(resource)

    # --------------------------------------------------------
    # Audit log
    # --------------------------------------------------------

    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="CREATE",
        entity_type="RESOURCE",
        entity_id=resource.id,
        description=(
            f"Resource created: {resource.name}"
        ),
    )

    return resource


# ============================================================
# GET ALL RESOURCES
# ADMIN + EMPLOYEE
# ============================================================

@router.get(
    "",
    response_model=list[ResourceResponse],
)
def get_resources(
    search: str | None = Query(default=None),
    resource_type: str | None = Query(default=None),
    is_available: bool | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Resource)

    # Search by resource name
    if search:
        search_value = f"%{search}%"

        query = query.filter(
            Resource.name.ilike(search_value)
        )

    # Filter by resource type
    if resource_type:
        type_value = f"%{resource_type}%"

        query = query.filter(
            Resource.resource_type.ilike(type_value)
        )

    # Filter by availability
    if is_available is not None:
        query = query.filter(
            Resource.is_available == is_available
        )

    return (
        query
        .order_by(Resource.name.asc())
        .all()
    )


# ============================================================
# GET SINGLE RESOURCE
# ADMIN + EMPLOYEE
# ============================================================

@router.get(
    "/{resource_id}",
    response_model=ResourceResponse,
)
def get_resource(
    resource_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    resource = (
        db.query(Resource)
        .filter(Resource.id == resource_id)
        .first()
    )

    if not resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resource not found",
        )

    return resource


# ============================================================
# UPDATE RESOURCE
# ADMIN ONLY
# ============================================================

@router.put(
    "/{resource_id}",
    response_model=ResourceResponse,
)
def update_resource(
    resource_id: int,
    data: ResourceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    resource = (
        db.query(Resource)
        .filter(Resource.id == resource_id)
        .first()
    )

    if not resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resource not found",
        )

    # --------------------------------------------------------
    # Check duplicate resource
    # --------------------------------------------------------

    if data.name is not None or data.resource_type is not None:
        new_name = (
            data.name
            if data.name is not None
            else resource.name
        )

        new_type = (
            data.resource_type
            if data.resource_type is not None
            else resource.resource_type
        )

        existing_resource = (
            db.query(Resource)
            .filter(
                Resource.name == new_name,
                Resource.resource_type == new_type,
                Resource.id != resource_id,
            )
            .first()
        )

        if existing_resource:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Resource with this name and type already exists",
            )

    # --------------------------------------------------------
    # Update fields
    # --------------------------------------------------------

    if data.name is not None:
        resource.name = data.name

    if data.resource_type is not None:
        resource.resource_type = data.resource_type

    if data.quantity is not None:
        resource.quantity = data.quantity

    if data.description is not None:
        resource.description = data.description

    if data.is_available is not None:
        resource.is_available = data.is_available

    db.commit()
    db.refresh(resource)

    # --------------------------------------------------------
    # Audit log
    # --------------------------------------------------------

    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="UPDATE",
        entity_type="RESOURCE",
        entity_id=resource.id,
        description=(
            f"Resource updated: {resource.name}"
        ),
    )

    return resource


# ============================================================
# DELETE RESOURCE
# ADMIN ONLY
# ============================================================

@router.delete(
    "/{resource_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_resource(
    resource_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    resource = (
        db.query(Resource)
        .filter(Resource.id == resource_id)
        .first()
    )

    if not resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resource not found",
        )

    # Prevent deletion when the resource has room assignments
    if resource.room_resources:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete resource because it is assigned to a meeting room",
        )

    # Prevent deletion when the resource has booking records
    if resource.booking_resources:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete resource because booking records exist",
        )

    # Save values before deleting the object
    deleted_resource_id = resource.id
    deleted_resource_name = resource.name

    db.delete(resource)
    db.commit()

    # --------------------------------------------------------
    # Audit log
    # --------------------------------------------------------

    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="DELETE",
        entity_type="RESOURCE",
        entity_id=deleted_resource_id,
        description=(
            f"Resource deleted: "
            f"{deleted_resource_name}"
        ),
    )

    return None

