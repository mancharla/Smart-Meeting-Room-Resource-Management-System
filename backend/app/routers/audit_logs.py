from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import require_role
from app.models.audit_log import AuditLog
from app.models.user import User
from app.schemas.audit_log import AuditLogResponse


router = APIRouter(
    prefix="/api/v1/audit-logs",
    tags=["Audit Logs"],
)


# ============================================================
# LIST AUDIT LOGS
# ============================================================

@router.get(
    "",
    response_model=list[AuditLogResponse],
)
def get_audit_logs(
    page: int = Query(
        default=1,
        ge=1,
    ),
    page_size: int = Query(
        default=20,
        ge=1,
        le=100,
    ),
    action: str | None = Query(
        default=None,
    ),
    entity_type: str | None = Query(
        default=None,
    ),
    user_id: int | None = Query(
        default=None,
        gt=0,
    ),
    start_date: datetime | None = Query(
        default=None,
    ),
    end_date: datetime | None = Query(
        default=None,
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("ADMIN")
    ),
):
    if (
        start_date is not None
        and end_date is not None
        and end_date <= start_date
    ):
        raise HTTPException(
            status_code=400,
            detail="End date must be after start date",
        )

    query = db.query(AuditLog)

    # --------------------------------------------------------
    # Action filter
    # --------------------------------------------------------

    if action:
        query = query.filter(
            AuditLog.action == action
        )

    # --------------------------------------------------------
    # Entity type filter
    # --------------------------------------------------------

    if entity_type:
        query = query.filter(
            AuditLog.entity_type == entity_type
        )

    # --------------------------------------------------------
    # User filter
    # --------------------------------------------------------

    if user_id is not None:
        query = query.filter(
            AuditLog.user_id == user_id
        )

    # --------------------------------------------------------
    # Date filters
    # --------------------------------------------------------

    if start_date is not None:
        query = query.filter(
            AuditLog.created_at >= start_date
        )

    if end_date is not None:
        query = query.filter(
            AuditLog.created_at <= end_date
        )

    # --------------------------------------------------------
    # Pagination
    # --------------------------------------------------------

    offset = (page - 1) * page_size

    logs = (
        query
        .order_by(
            AuditLog.created_at.desc()
        )
        .offset(offset)
        .limit(page_size)
        .all()
    )

    return logs


# ============================================================
# GET SINGLE AUDIT LOG
# ============================================================

@router.get(
    "/{audit_log_id}",
    response_model=AuditLogResponse,
)
def get_audit_log(
    audit_log_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("ADMIN")
    ),
):
    audit_log = (
        db.query(AuditLog)
        .filter(
            AuditLog.id == audit_log_id
        )
        .first()
    )

    if not audit_log:
        raise HTTPException(
            status_code=404,
            detail="Audit log not found",
        )

    return audit_log