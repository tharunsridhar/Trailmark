import json

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.access import can_see_piece
from app.db import get_db
from app.deps import current_user, require_roles
from app.importers import import_source
from app.models import ROLES, SOURCE_TYPES, Handover, Membership, Source, SourcePiece, User
from app.schemas import PieceOut, SourceOut

router = APIRouter(prefix="/handovers/{handover_id}/sources", tags=["sources"])
pieces_router = APIRouter(prefix="/pieces", tags=["sources"])

MAX_UPLOAD_BYTES = 5 * 1024 * 1024


def parse_roles(raw: str) -> list[str]:
    try:
        roles = json.loads(raw)
    except json.JSONDecodeError:
        roles = None
    if not isinstance(roles, list) or not roles or any(r not in ROLES for r in roles):
        raise HTTPException(status_code=422, detail=f"allowed_roles must be a JSON list of {list(ROLES)}")
    return list(dict.fromkeys(roles))


def to_out(source: Source, piece_count: int) -> SourceOut:
    return SourceOut(
        id=source.id,
        type=source.type,
        name=source.name,
        allowed_roles=source.allowed_roles,
        status=source.status,
        note=source.note,
        piece_count=piece_count,
    )


@router.post("", response_model=SourceOut, status_code=201)
async def add_source(
    handover_id: int,
    type: str = Form(...),
    name: str = Form(..., min_length=1, max_length=200),
    allowed_roles: str = Form(...),
    file: UploadFile = File(...),
    _: Membership = Depends(require_roles("lead")),
    db: Session = Depends(get_db),
):
    if type not in SOURCE_TYPES:
        raise HTTPException(status_code=422, detail=f"type must be one of {list(SOURCE_TYPES)}")
    roles = parse_roles(allowed_roles)

    handover = db.get(Handover, handover_id)
    if handover.status != "draft":
        raise HTTPException(status_code=409, detail="This handover is already approved")

    data = await file.read(MAX_UPLOAD_BYTES + 1)
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="File is larger than 5 MB")

    result = import_source(type, file.filename or name, data)
    source = Source(
        handover_id=handover_id, type=type, name=name,
        allowed_roles=roles, status=result.status, note=result.note,
    )
    db.add(source)
    db.flush()

    # every piece keeps the access level of the source it came from
    for position, piece in enumerate(result.pieces):
        db.add(SourcePiece(
            source_id=source.id, position=position, locator=piece.locator,
            content=piece.content, allowed_roles=roles, meta=piece.meta,
        ))
    db.commit()
    return to_out(source, len(result.pieces))


@router.get("", response_model=list[SourceOut])
def list_sources(
    handover_id: int,
    _: Membership = Depends(require_roles("lead")),
    db: Session = Depends(get_db),
):
    counts = dict(
        db.execute(
            select(SourcePiece.source_id, func.count(SourcePiece.id))
            .join(Source, Source.id == SourcePiece.source_id)
            .where(Source.handover_id == handover_id)
            .group_by(SourcePiece.source_id)
        ).all()
    )
    sources = db.scalars(select(Source).where(Source.handover_id == handover_id).order_by(Source.id)).all()
    return [to_out(s, counts.get(s.id, 0)) for s in sources]


@pieces_router.get("/{piece_id}", response_model=PieceOut)
def get_piece(piece_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)):
    piece = db.get(SourcePiece, piece_id)
    if piece is None:
        raise HTTPException(status_code=404, detail="No such source piece")

    membership = db.scalar(
        select(Membership).where(
            Membership.handover_id == piece.source.handover_id,
            Membership.user_id == user.id,
        )
    )
    # same answer for "not your handover" and "not allowed to see this source"
    if membership is None or not can_see_piece(membership.role, piece):
        raise HTTPException(status_code=403, detail="You may not view this source")

    return PieceOut(
        id=piece.id, source_id=piece.source_id, source_name=piece.source.name,
        locator=piece.locator, content=piece.content,
    )
