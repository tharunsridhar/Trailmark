from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.access import visible_statements
from app.db import get_db
from app.deps import current_user, require_roles
from app.models import Handover, Membership, Receipt, Statement, User
from app.schemas import HandoverInfo, HandoverView, NextAction, ReceiptOut
from app.services import statement_out

router = APIRouter(prefix="/handovers/{handover_id}", tags=["handover"])

SECTIONS = {
    "decision": "decisions",
    "owner": "owns",
    "unfinished": "unfinished",
    "risk": "risks",
    "recurring": "risks",
    "blocker": "risks",
    "dependency": "dependencies",
    "contact": "contacts",
    "answer": "from_departing_member",
}


def receipt_out(receipt: Receipt, db: Session) -> ReceiptOut:
    return ReceiptOut(
        handover_id=receipt.handover_id,
        user_id=receipt.user_id,
        user_name=db.get(User, receipt.user_id).name,
        created_at=receipt.created_at,
    )


def own_receipt(db: Session, handover_id: int, user_id: int) -> Receipt | None:
    return db.scalar(select(Receipt).where(Receipt.handover_id == handover_id, Receipt.user_id == user_id))


@router.get("/handover-view", response_model=HandoverView)
def handover_view(
    handover_id: int,
    membership: Membership = Depends(require_roles("incoming", "lead")),
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    handover = db.get(Handover, handover_id)
    if handover.status != "approved":
        raise HTTPException(status_code=409, detail="The handover has not been approved yet")

    statements = db.scalars(
        select(Statement).where(Statement.handover_id == handover_id).order_by(Statement.id)
    ).all()
    # always filtered as the incoming member, so the lead's preview shows exactly what they get
    shown = visible_statements("incoming", statements)

    sections = {name: [] for name in set(SECTIONS.values())}
    open_questions, next_actions = [], []
    for statement in shown:
        out = statement_out(statement, for_incoming=True)
        if statement.label == "missing":
            open_questions.append(out)
        elif statement.kind == "next_action":
            next_actions.append(NextAction(
                order=len(next_actions) + 1, text=out.text, statement_id=out.id,
                label=out.label, sources=out.sources,
            ))
        elif statement.kind in SECTIONS:
            sections[SECTIONS[statement.kind]].append(out)

    receipt = own_receipt(db, handover_id, user.id) if membership.role == "incoming" else None
    return HandoverView(
        handover=HandoverInfo(
            id=handover.id, title=handover.title, project_name=handover.project_name,
            approved_at=handover.approved_at,
        ),
        open_questions=open_questions,
        next_actions=next_actions,
        receipt=receipt_out(receipt, db) if receipt else None,
        **sections,
    )


@router.post("/receipt", response_model=ReceiptOut, status_code=201)
def confirm_receipt(
    handover_id: int,
    _: Membership = Depends(require_roles("incoming")),
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    if db.get(Handover, handover_id).status != "approved":
        raise HTTPException(status_code=409, detail="The handover has not been approved yet")
    if own_receipt(db, handover_id, user.id):
        raise HTTPException(status_code=409, detail="Receipt already confirmed")

    receipt = Receipt(handover_id=handover_id, user_id=user.id)
    db.add(receipt)
    db.commit()
    return receipt_out(receipt, db)


@router.get("/receipt", response_model=ReceiptOut)
def get_receipt(
    handover_id: int,
    membership: Membership = Depends(require_roles("lead", "incoming")),
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    if membership.role == "incoming":
        receipt = own_receipt(db, handover_id, user.id)
    else:
        receipt = db.scalar(select(Receipt).where(Receipt.handover_id == handover_id).order_by(Receipt.id))
    if receipt is None:
        raise HTTPException(status_code=404, detail="Receipt not confirmed yet")
    return receipt_out(receipt, db)
