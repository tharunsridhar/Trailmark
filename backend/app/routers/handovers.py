from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import current_user, get_membership, require_roles
from app.models import Handover, Membership, User
from app.schemas import HandoverCreate, HandoverOut, MemberAdd, MemberOut

router = APIRouter(prefix="/handovers", tags=["handovers"])


def to_out(handover: Handover, role: str) -> HandoverOut:
    return HandoverOut(
        id=handover.id,
        title=handover.title,
        project_name=handover.project_name,
        status=handover.status,
        created_at=handover.created_at,
        approved_at=handover.approved_at,
        my_role=role,
    )


@router.post("", response_model=HandoverOut, status_code=201)
def create_handover(
    body: HandoverCreate,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    handover = Handover(title=body.title, project_name=body.project_name, created_by=user.id)
    db.add(handover)
    db.flush()
    # whoever creates a handover is its lead
    db.add(Membership(handover_id=handover.id, user_id=user.id, role="lead"))
    db.commit()
    return to_out(handover, "lead")


@router.get("", response_model=list[HandoverOut])
def list_handovers(user: User = Depends(current_user), db: Session = Depends(get_db)):
    rows = db.execute(
        select(Handover, Membership.role)
        .join(Membership, Membership.handover_id == Handover.id)
        .where(Membership.user_id == user.id)
        .order_by(Handover.created_at.desc())
    ).all()
    return [to_out(handover, role) for handover, role in rows]


@router.get("/{handover_id}", response_model=HandoverOut)
def get_handover(
    handover_id: int,
    membership: Membership = Depends(get_membership),
    db: Session = Depends(get_db),
):
    return to_out(db.get(Handover, handover_id), membership.role)


@router.get("/{handover_id}/members", response_model=list[MemberOut])
def list_members(
    handover_id: int,
    _: Membership = Depends(require_roles("lead")),
    db: Session = Depends(get_db),
):
    rows = db.execute(
        select(Membership, User)
        .join(User, User.id == Membership.user_id)
        .where(Membership.handover_id == handover_id)
        .order_by(Membership.id)
    ).all()
    return [
        MemberOut(user_id=u.id, name=u.name, email=u.email, role=m.role) for m, u in rows
    ]


@router.post("/{handover_id}/members", response_model=MemberOut, status_code=201)
def add_member(
    handover_id: int,
    body: MemberAdd,
    _: Membership = Depends(require_roles("lead")),
    db: Session = Depends(get_db),
):
    user = db.scalar(select(User).where(User.email == body.email.lower()))
    if user is None:
        raise HTTPException(status_code=404, detail="No user with that email, ask them to register first")

    already = db.scalar(
        select(Membership).where(
            Membership.handover_id == handover_id,
            Membership.user_id == user.id,
        )
    )
    if already:
        raise HTTPException(status_code=409, detail="User is already in this handover")

    db.add(Membership(handover_id=handover_id, user_id=user.id, role=body.role))
    db.commit()
    return MemberOut(user_id=user.id, name=user.name, email=user.email, role=body.role)
