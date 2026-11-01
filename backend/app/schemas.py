from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, model_validator

Role = Literal["lead", "departing", "incoming"]


class RegisterIn(BaseModel):
    email: EmailStr
    name: str = Field(min_length=1, max_length=120)
    password: str = Field(min_length=8, max_length=128)


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    name: str


class HandoverCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    project_name: str = Field(min_length=1, max_length=200)


class HandoverOut(BaseModel):
    id: int
    title: str
    project_name: str
    status: str
    created_at: datetime
    approved_at: datetime | None
    # the caller's own role in this handover
    my_role: Role


class MemberAdd(BaseModel):
    email: EmailStr
    role: Role


class MemberOut(BaseModel):
    user_id: int
    name: str
    email: str
    role: Role


class SourceOut(BaseModel):
    id: int
    type: str
    name: str
    allowed_roles: list[Role]
    status: str
    note: str | None
    piece_count: int


class PieceOut(BaseModel):
    id: int
    source_id: int
    source_name: str
    locator: str
    content: str


class AnalysisOut(BaseModel):
    status: str
    mode: str | None = None
    notice: str | None = None
    counts: dict | None = None
    dropped: int = 0
    started_at: datetime | None = None
    finished_at: datetime | None = None


class EvidenceOut(BaseModel):
    piece_id: int
    locator: str
    quote: str | None


class QuestionOut(BaseModel):
    id: int
    text: str
    risk: int
    status: str
    evidence: list[EvidenceOut]


class AnswerIn(BaseModel):
    action: Literal["answer", "skip", "unknown"]
    text: str | None = Field(default=None, max_length=5000)

    @model_validator(mode="after")
    def answer_needs_text(self):
        if self.action == "answer" and not (self.text or "").strip():
            raise ValueError("text is required when answering")
        return self


class SourceRef(BaseModel):
    piece_id: int
    locator: str
    source_name: str
    quote: str | None
    chosen: bool | None


class StatementOut(BaseModel):
    id: int
    kind: str
    text: str
    label: str
    status: str
    current_version: int
    sources: list[SourceRef]


class StatementEdit(BaseModel):
    text: str = Field(min_length=1, max_length=5000)
    reason: str | None = Field(default=None, max_length=2000)


class ReasonIn(BaseModel):
    reason: str = Field(min_length=1, max_length=2000)


class ResolveIn(BaseModel):
    chosen_piece_id: int
    reason: str = Field(min_length=1, max_length=2000)
    # optional new wording that matches the chosen source
    text: str | None = Field(default=None, min_length=1, max_length=5000)


class VersionOut(BaseModel):
    version: int
    action: str
    text: str
    label: str
    editor: str | None
    reason: str | None
    created_at: datetime


class NextAction(BaseModel):
    order: int
    text: str
    statement_id: int
    label: str
    sources: list[SourceRef]


class ReceiptOut(BaseModel):
    handover_id: int
    user_id: int
    user_name: str
    created_at: datetime


class HandoverInfo(BaseModel):
    id: int
    title: str
    project_name: str
    approved_at: datetime | None


class HandoverView(BaseModel):
    handover: HandoverInfo
    decisions: list[StatementOut]
    owns: list[StatementOut]
    unfinished: list[StatementOut]
    risks: list[StatementOut]
    dependencies: list[StatementOut]
    contacts: list[StatementOut]
    from_departing_member: list[StatementOut]
    open_questions: list[StatementOut]
    next_actions: list[NextAction]
    receipt: ReceiptOut | None
