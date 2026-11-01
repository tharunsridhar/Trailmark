from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field

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
