from fastapi import HTTPException

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import (
    create_access_token,
    create_refresh_token,
    create_password_reset_token,
    hash_password,
    verify_password,
)

from app.models.department import Department
from app.models.role import Role
from app.models.user import User

from app.services.audit_service import create_audit_log


# ============================================================
# REGISTER USER
# ============================================================

def register_user(
    db: Session,
    full_name: str,
    email: str,
    password: str,
    department_id: int | None = None,
) -> User:

    # --------------------------------------------------------
    # Check whether email already exists
    # --------------------------------------------------------

    existing_user = db.scalar(
        select(User).where(User.email == email)
    )

    if existing_user:
        raise ValueError(
            "A user with this email already exists."
        )

    # --------------------------------------------------------
    # Get EMPLOYEE role
    # --------------------------------------------------------

    employee_role = db.scalar(
        select(Role).where(Role.name == "EMPLOYEE")
    )

    if not employee_role:
        raise ValueError(
            "EMPLOYEE role has not been configured."
        )

    # --------------------------------------------------------
    # Validate department
    # --------------------------------------------------------

    if department_id is not None:

        department = db.get(
            Department,
            department_id,
        )

        if not department:
            raise ValueError(
                "Department not found."
            )

    # --------------------------------------------------------
    # Create user
    # --------------------------------------------------------

    user = User(
        full_name=full_name,
        email=email,
        password_hash=hash_password(password),
        role_id=employee_role.id,
        department_id=department_id,
        is_active=True,
    )

    db.add(user)

    db.commit()

    db.refresh(user)

    # --------------------------------------------------------
    # Create audit log
    # --------------------------------------------------------

    create_audit_log(
        db=db,
        user_id=user.id,
        action="REGISTER",
        entity_type="USER",
        entity_id=user.id,
        description=(
            f"User registered successfully: {user.email}"
        ),
    )

    return user


# ============================================================
# AUTHENTICATE USER
# ============================================================

def authenticate_user(
    db: Session,
    email: str,
    password: str,
) -> User | None:

    # --------------------------------------------------------
    # Find user
    # --------------------------------------------------------

    user = db.scalar(
        select(User).where(User.email == email)
    )

    if not user:
        return None

    # --------------------------------------------------------
    # Check active status
    # --------------------------------------------------------

    if not user.is_active:
        return None

    # --------------------------------------------------------
    # Verify password
    # --------------------------------------------------------

    if not verify_password(
        password,
        user.password_hash,
    ):
        return None

    # --------------------------------------------------------
    # Create LOGIN audit log
    # --------------------------------------------------------

    create_audit_log(
        db=db,
        user_id=user.id,
        action="LOGIN",
        entity_type="USER",
        entity_id=user.id,
        description=(
            f"User logged in successfully: {user.email}"
        ),
    )

    return user


# ============================================================
# CREATE ACCESS + REFRESH TOKENS
# ============================================================

def create_tokens(
    user: User,
) -> dict:

    role_name = user.role.name

    return {
        "access_token": create_access_token(
            user.id,
            role_name,
        ),
        "refresh_token": create_refresh_token(
            user.id,
            role_name,
        ),
        "token_type": "bearer",
    }


# ============================================================
# GENERATE PASSWORD RESET TOKEN
# ============================================================

def generate_password_reset_token(
    db: Session,
    email: str,
) -> str:

    # --------------------------------------------------------
    # Find user
    # --------------------------------------------------------

    user = (
        db.query(User)
        .filter(User.email == email)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User with this email does not exist",
        )

    # --------------------------------------------------------
    # Create audit log
    # --------------------------------------------------------

    create_audit_log(
        db=db,
        user_id=user.id,
        action="FORGOT_PASSWORD",
        entity_type="USER",
        entity_id=user.id,
        description="Password reset requested",
    )

    # --------------------------------------------------------
    # Generate reset token
    # --------------------------------------------------------

    return create_password_reset_token(
        user.id
    )
