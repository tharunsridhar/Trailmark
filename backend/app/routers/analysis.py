from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.access import can_user_see
from app.db import get_db
from app.deps import get_llm, get_session_factory, require_roles
from app.models import AnalysisRun, Handover, Membership, Question, Source, SourcePiece
from app.pipeline.runner import run_analysis
from app.schemas import AnalysisOut, EvidenceOut, QuestionOut

router = APIRouter(prefix="/handovers/{handover_id}", tags=["analysis"])


def latest_run(db: Session, handover_id: int) -> AnalysisRun | None:
    return db.scalar(
        select(AnalysisRun)
        .where(AnalysisRun.handover_id == handover_id)
        .order_by(AnalysisRun.id.desc())
        .limit(1)
    )


@router.post("/analyze", response_model=AnalysisOut, status_code=202)
def analyze(
    handover_id: int,
    background: BackgroundTasks,
    _: Membership = Depends(require_roles("lead")),
    db: Session = Depends(get_db),
    session_factory=Depends(get_session_factory),
    llm=Depends(get_llm),
):
    if db.get(Handover, handover_id).status != "draft":
        raise HTTPException(status_code=409, detail="This handover is already approved")

    current = latest_run(db, handover_id)
    if current is not None and current.status == "running":
        raise HTTPException(status_code=409, detail="An analysis is already running")

    has_pieces = db.scalar(
        select(func.count(SourcePiece.id))
        .join(Source, Source.id == SourcePiece.source_id)
        .where(Source.handover_id == handover_id)
    )
    if not has_pieces:
        raise HTTPException(status_code=409, detail="Add at least one readable source first")

    run = AnalysisRun(handover_id=handover_id)
    db.add(run)
    db.commit()
    background.add_task(run_analysis, session_factory, run.id, llm)
    return AnalysisOut(status="running", started_at=run.started_at)


@router.get("/analysis", response_model=AnalysisOut)
def get_analysis(
    handover_id: int,
    _: Membership = Depends(require_roles("lead")),
    db: Session = Depends(get_db),
):
    run = latest_run(db, handover_id)
    if run is None:
        return AnalysisOut(status="not_started")
    return AnalysisOut(
        status=run.status, mode=run.mode, notice=run.notice, counts=run.counts,
        dropped=run.dropped, started_at=run.started_at, finished_at=run.finished_at,
    )


@router.get("/questions", response_model=list[QuestionOut])
def list_questions(
    handover_id: int,
    membership: Membership = Depends(require_roles("lead", "departing")),
    db: Session = Depends(get_db),
):
    questions = db.scalars(
        select(Question)
        .where(Question.handover_id == handover_id)
        .order_by(Question.risk.desc(), Question.id)
    ).all()

    shown = []
    for question in questions:
        pieces = [link.piece for link in question.evidence]
        # a question is built from its evidence, so it is hidden when any of that is off limits
        if not can_user_see(membership.role, pieces):
            continue
        shown.append(QuestionOut(
            id=question.id, text=question.text, risk=question.risk, status=question.status,
            evidence=[EvidenceOut(piece_id=l.piece_id, locator=l.piece.locator, quote=l.quote) for l in question.evidence],
        ))
    return shown
