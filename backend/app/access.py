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


# what the incoming member reads in place of a gap that has no source of its own
NEUTRAL_GAP_TEXT = "Something is not documented here"


def has_source(statement) -> bool:
    return bool(statement.sources)


def can_see_statement(role: str, statement) -> bool:
    if role == "lead":
        return True
    # the departing member works through questions and their evidence, not the draft
    if role != "incoming":
        return False
    if statement.status not in SHARED_STATUSES:
        return False
    if not has_source(statement):
        # nothing proves the text is safe, so only a gap survives, and only with neutral wording
        return statement.label == "missing"
    return can_user_see(role, [link.piece for link in statement.sources])


def shown_text(role: str, statement) -> str:
    """The statement text for this role. Without a source of its own the text could name a
    restricted place, so anyone but the lead gets the neutral wording instead."""
    if role == "lead" or has_source(statement):
        return statement.text
    return NEUTRAL_GAP_TEXT


def can_see_question(role: str, question) -> bool:
    """A question is built from its evidence; with none, its wording cannot be proven safe."""
    if role == "lead":
        return True
    return bool(question.evidence) and can_user_see(role, [link.piece for link in question.evidence])


def visible_statements(role: str, statements) -> list:
    return [s for s in statements if can_see_statement(role, s)]
