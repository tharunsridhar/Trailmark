"""Small helpers shared by the routers."""

from app.models import Question, Statement, StatementVersion
from app.redact import redact
from app.schemas import EvidenceOut, QuestionOut, SourceRef, StatementOut


def add_version(db, statement: Statement, action: str, editor_id: int | None, reason: str | None = None) -> None:
    """Saves the statement's current text and label as its next version."""
    statement.current_version += 1
    db.add(StatementVersion(
        statement_id=statement.id,
        version=statement.current_version,
        action=action,
        text=statement.text,
        label=statement.label,
        editor_id=editor_id,
        reason=reason,
    ))


def statement_out(statement: Statement, for_incoming: bool = False) -> StatementOut:
    """The lead sees everything. For the incoming member the text and quotes are redacted
    and the source the lead did not choose in a conflict is left out."""
    sources = []
    for link in statement.sources:
        if for_incoming and link.chosen is False:
            continue
        sources.append(SourceRef(
            piece_id=link.piece_id,
            locator=link.piece.locator,
            source_name=link.piece.source.name,
            quote=redact(link.quote) if for_incoming else link.quote,
            chosen=link.chosen,
        ))
    return StatementOut(
        id=statement.id,
        kind=statement.kind,
        text=redact(statement.text) if for_incoming else statement.text,
        label=statement.label,
        status=statement.status,
        current_version=statement.current_version,
        sources=sources,
    )


def question_out(question: Question) -> QuestionOut:
    return QuestionOut(
        id=question.id,
        text=question.text,
        risk=question.risk,
        status=question.status,
        evidence=[
            EvidenceOut(piece_id=link.piece_id, locator=link.piece.locator, quote=link.quote)
            for link in question.evidence
        ],
    )
