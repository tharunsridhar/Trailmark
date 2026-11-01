from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import current_user, member_of, require_roles
from app.models import Handover, Membership, Statement, StatementVersion, User, now
from app.routers.handovers import to_out
from app.schemas import HandoverOut, ReasonIn, ResolveIn, StatementEdit, StatementOut, VersionOut
from app.services import add_version, statement_out

router = APIRouter(tags=["review"])


def lead_statement(db: Session, statement_id: int, user: User, must_be_draft: bool = True) -> Statement:
    statement = db.get(Statement, statement_id)
    membership = member_of(db, user.id, statement.handover_id) if statement else None
    if membership is None or membership.role != "lead":
        raise HTTPException(status_code=403, detail="Only the lead can review statements")
    if must_be_draft and db.get(Handover, statement.handover_id).status != "draft":
        raise HTTPException(status_code=409, detail="This handover is already approved")
    return statement


@router.get("/handovers/{handover_id}/statements", response_model=list[StatementOut])
def list_statements(
    handover_id: int,
    kind: str | None = None,
    label: str | None = None,
    status: str | None = None,
    _: Membership = Depends(require_roles("lead")),
    db: Session = Depends(get_db),
):
    query = select(Statement).where(Statement.handover_id == handover_id).order_by(Statement.id)
    if kind:
        query = query.where(Statement.kind == kind)
    if label:
        query = query.where(Statement.label == label)
    if status:
        query = query.where(Statement.status == status)
    return [statement_out(s) for s in db.scalars(query).all()]


@router.get("/statements/{statement_id}", response_model=StatementOut)
def get_statement(statement_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)):
    return statement_out(lead_statement(db, statement_id, user, must_be_draft=False))


@router.patch("/statements/{statement_id}", response_model=StatementOut)
def edit_statement(
    statement_id: int,
    body: StatementEdit,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    statement = lead_statement(db, statement_id, user)
    if statement.status == "rejected":
        raise HTTPException(status_code=409, detail="A rejected statement cannot be edited")
    statement.text = body.text.strip()
    add_version(db, statement, "edited", user.id, body.reason)
    db.commit()
    return statement_out(statement)


@router.post("/statements/{statement_id}/reject", response_model=StatementOut)
def reject_statement(
    statement_id: int,
    body: ReasonIn,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    statement = lead_statement(db, statement_id, user)
    if statement.status == "rejected":
        raise HTTPException(status_code=409, detail="Already rejected")
    statement.status = "rejected"
    add_version(db, statement, "rejected", user.id, body.reason)
    db.commit()
    return statement_out(statement)


@router.post("/statements/{statement_id}/resolve", response_model=StatementOut)
def resolve_conflict(
    statement_id: int,
    body: ResolveIn,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    statement = lead_statement(db, statement_id, user)
    if statement.label != "conflicting" or statement.status != "draft":
        raise HTTPException(status_code=409, detail="Only an open conflict can be resolved")

    links = statement.sources
    if body.chosen_piece_id not in {link.piece_id for link in links}:
        raise HTTPException(status_code=422, detail="chosen_piece_id is not one of this statement's sources")

    # the other source is kept, marked as not chosen, with the reason in the history
    for link in links:
        link.chosen = link.piece_id == body.chosen_piece_id
    if body.text:
        statement.text = body.text.strip()
    statement.label = "verified"
    add_version(db, statement, "resolved", user.id, body.reason)
    db.commit()
    return statement_out(statement)


@router.post("/statements/{statement_id}/accept-gap", response_model=StatementOut)
def accept_gap(
    statement_id: int,
    body: ReasonIn,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    statement = lead_statement(db, statement_id, user)
    if statement.label != "missing" or statement.status != "draft":
        raise HTTPException(status_code=409, detail="Only an open gap can be accepted")
    statement.status = "accepted_gap"
    add_version(db, statement, "accepted_gap", user.id, body.reason)
    db.commit()
    return statement_out(statement)


@router.get("/statements/{statement_id}/versions", response_model=list[VersionOut])
def statement_versions(statement_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)):
    statement = lead_statement(db, statement_id, user, must_be_draft=False)
    versions = db.scalars(
        select(StatementVersion)
        .where(StatementVersion.statement_id == statement.id)
        .order_by(StatementVersion.version.desc())
    ).all()
    return [
        VersionOut(
            version=v.version, action=v.action, text=v.text, label=v.label,
            editor=v.editor.name if v.editor else None, reason=v.reason, created_at=v.created_at,
        )
        for v in versions
    ]


@router.post("/handovers/{handover_id}/approve", response_model=HandoverOut)
def approve(
    handover_id: int,
    membership: Membership = Depends(require_roles("lead")),
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    handover = db.get(Handover, handover_id)
    if handover.status == "approved":
        raise HTTPException(status_code=409, detail="Already approved")

    statements = db.scalars(select(Statement).where(Statement.handover_id == handover_id)).all()
    if not statements:
        raise HTTPException(status_code=409, detail="Run an analysis before approving")

    open_conflicts = [s for s in statements if s.label == "conflicting" and s.status == "draft"]
    if open_conflicts:
        raise HTTPException(
            status_code=409,
            detail=f"{len(open_conflicts)} conflict(s) are still unresolved, resolve or reject them first",
        )

    # only what the lead reviewed and kept is shared, rejected and answered gaps stay out
    for statement in statements:
        if statement.status == "draft":
            statement.status = "approved"
            add_version(db, statement, "approved", user.id)

    handover.status = "approved"
    handover.approved_at = now()
    db.commit()
    return to_out(handover, membership.role)
