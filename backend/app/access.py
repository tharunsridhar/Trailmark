"""Who can see what.

The rule that matters most: a statement the system generated is only shown to
someone who is allowed to see every source piece behind it. The text of the
statement being new, and not a copy of the restricted source, changes nothing.
"""

# statuses the incoming member may ever see; drafts and rejected claims stay hidden
SHARED_STATUSES = ("approved", "accepted_gap")


def can_see_piece(role: str, piece) -> bool:
    # the lead reviews everything, so the lead is never locked out of a source
    if role == "lead":
        return True
    return role in piece.allowed_roles


def can_user_see(role: str, pieces) -> bool:
    """True only if the role may see all of the given source pieces."""
    return all(can_see_piece(role, piece) for piece in pieces)


def can_see_statement(role: str, statement) -> bool:
    if role == "lead":
        return True
    # the departing member works through questions and their evidence, not the draft
    if role != "incoming":
        return False
    if statement.status not in SHARED_STATUSES:
        return False
    return can_user_see(role, [link.piece for link in statement.sources])


def visible_statements(role: str, statements) -> list:
    return [s for s in statements if can_see_statement(role, s)]
