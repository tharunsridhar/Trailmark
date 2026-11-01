from fastapi import Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.db import get_db
from sqlalchemy import select

from app.models import Membership, User
from app.security import COOKIE_NAME, decode_token


def current_user(request: Request, db: Session = Depends(get_db)) -> User:
    token = request.cookies.get(COOKIE_NAME)
    if not token:
        raise HTTPException(status_code=401, detail="Not signed in")

    user_id = decode_token(token)
    user = db.get(User, user_id) if user_id else None
    if user is None:
        raise HTTPException(status_code=401, detail="Invalid or expired session")
    return user


def get_membership(
    handover_id: int,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
) -> Membership:
    membership = db.scalar(
        select(Membership).where(
            Membership.handover_id == handover_id,
            Membership.user_id == user.id,
        )
    )
    # a missing handover and someone else's handover look the same on purpose
    if membership is None:
        raise HTTPException(status_code=403, detail="Not a member of this handover")
    return membership


def require_roles(*roles: str):
    """Dependency factory: the caller must hold one of these roles in the handover."""

    def check(membership: Membership = Depends(get_membership)) -> Membership:
        if membership.role not in roles:
            raise HTTPException(status_code=403, detail="Your role cannot do this")
        return membership

    return check
