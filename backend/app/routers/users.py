from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import get_current_user, require_role
from app.models.department import Department
from app.models.role import Role
from app.models.user import User
from app.schemas.user import AdminUserResponse, AdminUserUpdate
from app.services.audit_service import create_audit_log


router = APIRouter(
    prefix="/api/v1/users",
    tags=["Users"],
)


# ============================================================
# GET ALL USERS
# ============================================================

@router.get(
    "",
    response_model=list[AdminUserResponse],
)
def get_users(
    search: str | None = Query(default=None),
    role_id: int | None = Query(default=None, gt=0),
    department_id: int | None = Query(default=None, gt=0),
    is_active: bool | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    query = db.query(User)

    # Search by name or email
    if search:
        search_value = f"%{search}%"

        query = query.filter(
            (User.full_name.ilike(search_value))
            | (User.email.ilike(search_value))
        )

    # Filter by role
    if role_id is not None:
        query = query.filter(User.role_id == role_id)

    # Filter by department
    if department_id is not None:
        query = query.filter(
            User.department_id == department_id
        )

    # Filter by active status
    if is_active is not None:
        query = query.filter(
            User.is_active == is_active
        )

    users = query.order_by(
        User.created_at.desc()
    ).all()

    response = []

    for user in users:
        response.append(
            AdminUserResponse(
                id=user.id,
                full_name=user.full_name,
                email=user.email,
                role_id=user.role_id,
                role_name=user.role.name if user.role else "",
                department_id=user.department_id,
                department_name=(
                    user.department.name
                    if user.department
                    else None
                ),
                is_active=user.is_active,
                created_at=user.created_at,
                updated_at=user.updated_at,
            )
        )

    return response


# ============================================================
# GET SINGLE USER
# ============================================================

@router.get(
    "/{user_id}",
    response_model=AdminUserResponse,
)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    return AdminUserResponse(
        id=user.id,
        full_name=user.full_name,
        email=user.email,
        role_id=user.role_id,
        role_name=user.role.name if user.role else "",
        department_id=user.department_id,
        department_name=(
            user.department.name
            if user.department
            else None
        ),
        is_active=user.is_active,
        created_at=user.created_at,
        updated_at=user.updated_at,
    )


# ============================================================
# UPDATE USER
# ============================================================

@router.put(
    "/{user_id}",
    response_model=AdminUserResponse,
)
def update_user(
    user_id: int,
    data: AdminUserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # --------------------------------------------------------
    # Prevent admin from accidentally removing own admin role
    # --------------------------------------------------------

    if user.id == current_user.id:
        if data.role_id is not None:
            role = (
                db.query(Role)
                .filter(Role.id == data.role_id)
                .first()
            )

            if not role:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Role not found",
                )

            if role.name != "ADMIN":
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="You cannot remove your own ADMIN role",
                )

        if data.is_active is False:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You cannot deactivate your own account",
            )

    # --------------------------------------------------------
    # Update role
    # --------------------------------------------------------

    if data.role_id is not None:
        role = (
            db.query(Role)
            .filter(Role.id == data.role_id)
            .first()
        )

        if not role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Role not found",
            )

        user.role_id = role.id

    # --------------------------------------------------------
    # Update department
    # --------------------------------------------------------

    if data.department_id is not None:
        department = (
            db.query(Department)
            .filter(
                Department.id == data.department_id
            )
            .first()
        )

        if not department:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Department not found",
            )

        user.department_id = department.id

    # --------------------------------------------------------
    # Update active status
    # --------------------------------------------------------

    if data.is_active is not None:
        user.is_active = data.is_active

    db.commit()
    db.refresh(user)

    # --------------------------------------------------------
    # Audit log
    # --------------------------------------------------------

    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="UPDATE",
        entity_type="USER",
        entity_id=user.id,
        description=(
            f"User updated by admin: {user.email}"
        ),
    )

    return AdminUserResponse(
        id=user.id,
        full_name=user.full_name,
        email=user.email,
        role_id=user.role_id,
        role_name=user.role.name if user.role else "",
        department_id=user.department_id,
        department_name=(
            user.department.name
            if user.department
            else None
        ),
        is_active=user.is_active,
        created_at=user.created_at,
        updated_at=user.updated_at,
    )


# ============================================================
# DEACTIVATE USER
# ============================================================

@router.patch(
    "/{user_id}/deactivate",
    response_model=AdminUserResponse,
)
def deactivate_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot deactivate your own account",
        )

    user.is_active = False

    db.commit()
    db.refresh(user)

    # --------------------------------------------------------
    # Audit log
    # --------------------------------------------------------

    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="DEACTIVATE",
        entity_type="USER",
        entity_id=user.id,
        description=(
            f"User deactivated: {user.email}"
        ),
    )

    return AdminUserResponse(
        id=user.id,
        full_name=user.full_name,
        email=user.email,
        role_id=user.role_id,
        role_name=user.role.name if user.role else "",
        department_id=user.department_id,
        department_name=(
            user.department.name
            if user.department
            else None
        ),
        is_active=user.is_active,
        created_at=user.created_at,
        updated_at=user.updated_at,
    )


# ============================================================
# ACTIVATE USER
# ============================================================

@router.patch(
    "/{user_id}/activate",
    response_model=AdminUserResponse,
)
def activate_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    user.is_active = True

    db.commit()
    db.refresh(user)

    # --------------------------------------------------------
    # Audit log
    # --------------------------------------------------------

    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="ACTIVATE",
        entity_type="USER",
        entity_id=user.id,
        description=(
            f"User activated: {user.email}"
        ),
    )

    return AdminUserResponse(
        id=user.id,
        full_name=user.full_name,
        email=user.email,
        role_id=user.role_id,
        role_name=user.role.name if user.role else "",
        department_id=user.department_id,
        department_name=(
            user.department.name
            if user.department
            else None
        ),
        is_active=user.is_active,
        created_at=user.created_at,
        updated_at=user.updated_at,
    )
