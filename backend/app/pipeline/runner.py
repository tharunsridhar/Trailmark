import logging
from collections import Counter

import httpx
from sqlalchemy import delete, select
from sqlalchemy.orm import selectinload

from app.config import get_settings
from app.models import (
    Answer, AnalysisRun, Handover, Question, QuestionPiece, Source, SourcePiece,
    Statement, StatementSource, StatementVersion, now,
)
from app.pipeline.analyze import Draft, analyze
from app.pipeline.fallback import basic_listing, load_results, save_results
from app.pipeline.llm import LLMError

log = logging.getLogger("trailmark.analysis")

SAVED_NOTICE = "AI unavailable: showing saved results from an earlier run."
BASIC_NOTICE = "AI unavailable and no saved results: showing a basic listing from structured fields only."
NO_SOURCES_NOTICE = "No readable sources, so there is nothing to analyse."


def load_pieces(db, handover_id: int):
    return db.scalars(
        select(SourcePiece)
        .join(Source, Source.id == SourcePiece.source_id)
        .where(Source.handover_id == handover_id)
        .options(selectinload(SourcePiece.source))
        .order_by(SourcePiece.source_id, SourcePiece.position)
    ).all()


def clear_previous(db, handover_id: int) -> None:
    """A new run replaces the earlier draft completely."""
    statement_ids = select(Statement.id).where(Statement.handover_id == handover_id)
    question_ids = select(Question.id).where(Question.handover_id == handover_id)
    db.execute(delete(Answer).where(Answer.question_id.in_(question_ids)))
    db.execute(delete(QuestionPiece).where(QuestionPiece.question_id.in_(question_ids)))
    db.execute(delete(Question).where(Question.handover_id == handover_id))
    db.execute(delete(StatementVersion).where(StatementVersion.statement_id.in_(statement_ids)))
    db.execute(delete(StatementSource).where(StatementSource.statement_id.in_(statement_ids)))
    db.execute(delete(Statement).where(Statement.handover_id == handover_id))


def store(db, handover_id: int, drafts: list[Draft]) -> Counter:
    counts: Counter = Counter()
    for draft in drafts:
        statement = Statement(handover_id=handover_id, kind=draft.kind, text=draft.text, label=draft.label)
        db.add(statement)
        db.flush()
        for evidence in draft.evidence:
            db.add(StatementSource(statement_id=statement.id, piece_id=evidence.piece_id, quote=evidence.quote))
        db.add(StatementVersion(
            statement_id=statement.id, version=1, action="created", text=draft.text, label=draft.label,
        ))
        counts[draft.label] += 1

        if draft.label == "missing" and draft.question:
            question = Question(
                handover_id=handover_id, gap_statement_id=statement.id, text=draft.question, risk=draft.risk,
            )
            db.add(question)
            db.flush()
            for evidence in draft.evidence:
                db.add(QuestionPiece(question_id=question.id, piece_id=evidence.piece_id, quote=evidence.quote))
    return counts


def run_analysis(session_factory, run_id: int, llm) -> None:
    """Runs in the background. Always leaves the run as done or failed, never stuck on running."""
    db = session_factory()
    try:
        run = db.get(AnalysisRun, run_id)
        handover = db.get(Handover, run.handover_id)
        pieces = load_pieces(db, handover.id)
        settings = get_settings()

        drafts, mode, notice, dropped = [], "basic", None, 0
        if not pieces:
            notice = NO_SOURCES_NOTICE
        else:
            result = None
            if llm is not None:
                try:
                    result = analyze(llm, pieces)
                except (LLMError, httpx.HTTPError) as error:
                    log.warning("AI analysis failed: %s", error)

            if result is not None:
                drafts, dropped, mode = result.drafts, result.dropped, "ai"
                save_results(settings.saved_results_dir, handover.project_name, drafts, pieces)
            else:
                saved = load_results(settings.saved_results_dir, handover.project_name, pieces)
                if saved:
                    drafts, mode, notice = saved, "saved", SAVED_NOTICE
                else:
                    drafts, mode, notice = basic_listing(pieces), "basic", BASIC_NOTICE

        clear_previous(db, handover.id)
        counts = store(db, handover.id, drafts)

        run.status, run.mode, run.notice = "done", mode, notice
        run.counts = {label: counts.get(label, 0) for label in ("verified", "unverified", "missing", "conflicting")}
        run.dropped, run.finished_at = dropped, now()
        db.commit()
    except Exception:
        log.exception("analysis run %s crashed", run_id)
        db.rollback()
        run = db.get(AnalysisRun, run_id)
        run.status, run.notice, run.finished_at = "failed", "The analysis failed. Nothing was changed.", now()
        db.commit()
    finally:
        db.close()
