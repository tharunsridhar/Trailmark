from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.access import can_user_see
from app.db import get_db
from app.deps import current_user, member_of
from app.models import Answer, Handover, Question, Statement, StatementSource, StatementVersion, User
from app.schemas import AnswerIn, QuestionOut
from app.services import add_version, question_out

router = APIRouter(prefix="/questions", tags=["questions"])


@router.post("/{question_id}/answer", response_model=QuestionOut)
def answer_question(
    question_id: int,
    body: AnswerIn,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    question = db.get(Question, question_id)
    membership = member_of(db, user.id, question.handover_id) if question else None
    # same answer whether the question exists or not, and for anyone but the departing member
    if membership is None or membership.role != "departing":
        raise HTTPException(status_code=403, detail="Only the departing member can answer questions")

    pieces = [link.piece for link in question.evidence]
    if not can_user_see("departing", pieces):
        raise HTTPException(status_code=403, detail="Only the departing member can answer questions")

    if db.get(Handover, question.handover_id).status != "draft":
        raise HTTPException(status_code=409, detail="This handover is already approved")

    gap = db.get(Statement, question.gap_statement_id) if question.gap_statement_id else None

    if body.action == "answer":
        text = body.text.strip()
        existing_answer = db.scalar(select(Answer).where(Answer.question_id == question.id))

        if existing_answer is not None:
            # Replace old response with new response
            existing_answer.text = text
            if existing_answer.statement_id:
                statement = db.get(Statement, existing_answer.statement_id)
                if statement:
                    statement.text = text
                    add_version(db, statement, "edited", user.id, "Updated response by departing member")
        else:
            # First time answering: create statement and answer record
            statement = Statement(
                handover_id=question.handover_id, kind="answer", text=text, label="unverified",
            )
            db.add(statement)
            db.flush()
            # it inherits the restrictions of the evidence that raised the question
            for link in question.evidence:
                db.add(StatementSource(statement_id=statement.id, piece_id=link.piece_id, quote=link.quote))
            db.add(StatementVersion(
                statement_id=statement.id, version=1, action="created", text=text,
                label="unverified", editor_id=user.id,
            ))
            db.add(Answer(question_id=question.id, user_id=user.id, text=text, statement_id=statement.id))

        # the gap is now covered by the answer, so it stops showing as open
        if gap is not None and gap.status == "draft":
            gap.status = "answered"
            add_version(db, gap, "answered", user.id, "Answered by the departing member")
        question.status = "answered"
    else:
        # skipped or unknown: the gap stays open and visible
        question.status = "skipped" if body.action == "skip" else "unknown"

    db.commit()
    ans_text = body.text.strip() if body.action == 'answer' and body.text else None
    return question_out(question, ans_text)