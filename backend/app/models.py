from datetime import datetime, timezone

from sqlalchemy import JSON, Boolean, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base

ROLES = ("lead", "departing", "incoming")
SOURCE_TYPES = ("repo", "doc", "chat", "tasks")
STATEMENT_KINDS = (
    "decision", "owner", "unfinished", "dependency", "blocker",
    "risk", "recurring", "contact", "next_action", "answer",
)
LABELS = ("verified", "unverified", "missing", "conflicting")


def now():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(120))
    password_hash: Mapped[str] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class Handover(Base):
    __tablename__ = "handovers"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(200))
    project_name: Mapped[str] = mapped_column(String(200))
    # draft until the lead approves, nothing is shared before that
    status: Mapped[str] = mapped_column(String(20), default="draft")
    created_by: Mapped[int] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    memberships: Mapped[list["Membership"]] = relationship(back_populates="handover")


class Membership(Base):
    __tablename__ = "memberships"
    __table_args__ = (UniqueConstraint("handover_id", "user_id"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    handover_id: Mapped[int] = mapped_column(ForeignKey("handovers.id"), index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    role: Mapped[str] = mapped_column(String(20))

    handover: Mapped[Handover] = relationship(back_populates="memberships")
    user: Mapped[User] = relationship()


class Source(Base):
    __tablename__ = "sources"

    id: Mapped[int] = mapped_column(primary_key=True)
    handover_id: Mapped[int] = mapped_column(ForeignKey("handovers.id"), index=True)
    type: Mapped[str] = mapped_column(String(20))
    name: Mapped[str] = mapped_column(String(200))
    # roles the lead allows to see this source, e.g. ["lead", "departing"]
    allowed_roles: Mapped[list] = mapped_column(JSON)
    # ok, empty or unreadable, set by the importer
    status: Mapped[str] = mapped_column(String(20), default="ok")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)

    pieces: Mapped[list["SourcePiece"]] = relationship(back_populates="source")


class SourcePiece(Base):
    __tablename__ = "source_pieces"

    id: Mapped[int] = mapped_column(primary_key=True)
    source_id: Mapped[int] = mapped_column(ForeignKey("sources.id"), index=True)
    position: Mapped[int] = mapped_column(Integer, default=0)
    # where it came from, e.g. "commit a3f9c21" or "chat message 14"
    locator: Mapped[str] = mapped_column(String(200))
    content: Mapped[str] = mapped_column(Text)
    # copied from the source so every piece keeps its source's access level
    allowed_roles: Mapped[list] = mapped_column(JSON)

    source: Mapped[Source] = relationship(back_populates="pieces")


class Statement(Base):
    __tablename__ = "statements"

    id: Mapped[int] = mapped_column(primary_key=True)
    handover_id: Mapped[int] = mapped_column(ForeignKey("handovers.id"), index=True)
    kind: Mapped[str] = mapped_column(String(20))
    text: Mapped[str] = mapped_column(Text)
    label: Mapped[str] = mapped_column(String(20))
    # draft, approved, rejected, or accepted_gap
    status: Mapped[str] = mapped_column(String(20), default="draft")
    # exact quote the claim relies on, checked against the source piece
    quote: Mapped[str | None] = mapped_column(Text, nullable=True)
    current_version: Mapped[int] = mapped_column(Integer, default=1)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)

    sources: Mapped[list["StatementSource"]] = relationship(back_populates="statement")
    versions: Mapped[list["StatementVersion"]] = relationship(back_populates="statement")


class StatementSource(Base):
    """Links a statement to the source pieces behind it."""

    __tablename__ = "statement_sources"
    __table_args__ = (UniqueConstraint("statement_id", "piece_id"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    statement_id: Mapped[int] = mapped_column(ForeignKey("statements.id"), index=True)
    piece_id: Mapped[int] = mapped_column(ForeignKey("source_pieces.id"), index=True)
    # for conflicts: True for the source the lead chose, False for the other, None if undecided
    chosen: Mapped[bool | None] = mapped_column(Boolean, nullable=True)

    statement: Mapped[Statement] = relationship(back_populates="sources")
    piece: Mapped[SourcePiece] = relationship()


class StatementVersion(Base):
    __tablename__ = "statement_versions"

    id: Mapped[int] = mapped_column(primary_key=True)
    statement_id: Mapped[int] = mapped_column(ForeignKey("statements.id"), index=True)
    version: Mapped[int] = mapped_column(Integer)
    action: Mapped[str] = mapped_column(String(20))
    text: Mapped[str] = mapped_column(Text)
    label: Mapped[str] = mapped_column(String(20))
    editor_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)

    statement: Mapped[Statement] = relationship(back_populates="versions")
    editor: Mapped[User | None] = relationship()


class Question(Base):
    __tablename__ = "questions"

    id: Mapped[int] = mapped_column(primary_key=True)
    handover_id: Mapped[int] = mapped_column(ForeignKey("handovers.id"), index=True)
    # the gap statement that raised this question
    gap_statement_id: Mapped[int | None] = mapped_column(ForeignKey("statements.id"), nullable=True)
    text: Mapped[str] = mapped_column(Text)
    # the evidence shown next to the question
    evidence: Mapped[str] = mapped_column(Text)
    risk: Mapped[int] = mapped_column(Integer, default=1)
    # open, answered, skipped or unknown
    status: Mapped[str] = mapped_column(String(20), default="open")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class Answer(Base):
    __tablename__ = "answers"

    id: Mapped[int] = mapped_column(primary_key=True)
    question_id: Mapped[int] = mapped_column(ForeignKey("questions.id"), index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    text: Mapped[str] = mapped_column(Text)
    # the unverified statement created from this answer
    statement_id: Mapped[int | None] = mapped_column(ForeignKey("statements.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class Receipt(Base):
    __tablename__ = "receipts"
    __table_args__ = (UniqueConstraint("handover_id", "user_id"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    handover_id: Mapped[int] = mapped_column(ForeignKey("handovers.id"), index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
