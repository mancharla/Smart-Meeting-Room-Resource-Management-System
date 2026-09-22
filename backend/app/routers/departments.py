from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import get_current_user, require_role
from app.models.department import Department
from app.models.user import User
from app.schemas.department import (
    DepartmentCreate,
    DepartmentResponse,
    DepartmentUpdate,
)
from app.services.audit_service import create_audit_log


router = APIRouter(
    prefix="/api/v1/departments",
    tags=["Departments"],
)


# ============================================================
# CREATE DEPARTMENT
# ============================================================

@router.post(
    "",
    response_model=DepartmentResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_department(
    data: DepartmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    existing = (
        db.query(Department)
        .filter(Department.name == data.name)
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Department with this name already exists",
        )

    department = Department(
        name=data.name,
        description=data.description,
    )

    db.add(department)
    db.commit()
    db.refresh(department)

    # --------------------------------------------------------
    # Audit log
    # --------------------------------------------------------

    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="CREATE",
        entity_type="DEPARTMENT",
        entity_id=department.id,
        description=(
            f"Department created: {department.name}"
        ),
    )

    return department


# ============================================================
# GET ALL DEPARTMENTS
# ============================================================

@router.get(
    "",
    response_model=list[DepartmentResponse],
)
def get_departments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(Department)
        .order_by(Department.name.asc())
        .all()
    )


# ============================================================
# GET SINGLE DEPARTMENT
# ============================================================

@router.get(
    "/{department_id}",
    response_model=DepartmentResponse,
)
def get_department(
    department_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    department = (
        db.query(Department)
        .filter(Department.id == department_id)
        .first()
    )

    if not department:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Department not found",
        )

    return department


# ============================================================
# UPDATE DEPARTMENT
# ============================================================

@router.put(
    "/{department_id}",
    response_model=DepartmentResponse,
)
def update_department(
    department_id: int,
    data: DepartmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    department = (
        db.query(Department)
        .filter(Department.id == department_id)
        .first()
    )

    if not department:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Department not found",
        )

    if data.name is not None:
        existing = (
            db.query(Department)
            .filter(
                Department.name == data.name,
                Department.id != department_id,
            )
            .first()
        )

        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Department with this name already exists",
            )

        department.name = data.name

    if data.description is not None:
        department.description = data.description

    db.commit()
    db.refresh(department)

    # --------------------------------------------------------
    # Audit log
    # --------------------------------------------------------

    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="UPDATE",
        entity_type="DEPARTMENT",
        entity_id=department.id,
        description=(
            f"Department updated: {department.name}"
        ),
    )

    return department


# ============================================================
# DELETE DEPARTMENT
# ============================================================

@router.delete(
    "/{department_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_department(
    department_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    department = (
        db.query(Department)
        .filter(Department.id == department_id)
        .first()
    )

    if not department:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Department not found",
        )

    users_count = (
        db.query(User)
        .filter(User.department_id == department_id)
        .count()
    )

    if users_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete department because users are assigned to it",
        )

    # --------------------------------------------------------
    # Save values before deletion
    # --------------------------------------------------------

    deleted_department_id = department.id
    deleted_department_name = department.name

    db.delete(department)
    db.commit()

    # --------------------------------------------------------
    # Audit log
    # --------------------------------------------------------

    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="DELETE",
        entity_type="DEPARTMENT",
        entity_id=deleted_department_id,
        description=(
            f"Department deleted: "
            f"{deleted_department_name}"
        ),
    )

    return None

