from types import SimpleNamespace

from app.access import (
    NEUTRAL_GAP_TEXT, can_see_piece, can_see_question, can_see_statement, can_user_see, shown_text,
    visible_statements,
)

EVERYONE = ["lead", "departing", "incoming"]


def piece(*allowed):
    return SimpleNamespace(allowed_roles=list(allowed))


def statement(status, *pieces, label="verified"):
    return SimpleNamespace(status=status, label=label, text="real text", sources=[SimpleNamespace(piece=p) for p in pieces])


def test_lead_sees_every_piece():
    assert can_see_piece("lead", piece("lead"))
    assert can_see_piece("lead", piece())


def test_piece_follows_allowed_roles():
    chat = piece("lead", "departing")
    assert can_see_piece("departing", chat)
    assert not can_see_piece("incoming", chat)


def test_user_must_see_all_pieces():
    open_doc = piece(*EVERYONE)
    hr_chat = piece("lead")
    assert can_user_see("incoming", [open_doc])
    assert not can_user_see("incoming", [open_doc, hr_chat])


def test_no_pieces_means_nothing_to_hide():
    assert can_user_see("incoming", [])


def test_incoming_sees_approved_statement_with_open_sources():
    s = statement("approved", piece(*EVERYONE), piece(*EVERYONE))
    assert can_see_statement("incoming", s)


def test_derived_statement_inherits_restriction():
    # built from one open doc and one restricted chat, so it is hidden too
    s = statement("approved", piece(*EVERYONE), piece("lead"))
    assert not can_see_statement("incoming", s)
    assert can_see_statement("lead", s)


def test_incoming_never_sees_drafts_or_rejected():
    for status in ("draft", "rejected"):
        s = statement(status, piece(*EVERYONE))
        assert not can_see_statement("incoming", s)


def test_accepted_gap_is_shared():
    s = statement("accepted_gap", piece(*EVERYONE), label="missing")
    assert can_see_statement("incoming", s)
    assert shown_text("incoming", s) == "real text"


def test_sourceless_gap_is_neutral_for_everyone_but_the_lead():
    s = statement("approved", label="missing")
    assert can_see_statement("incoming", s)
    assert shown_text("incoming", s) == NEUTRAL_GAP_TEXT
    assert shown_text("lead", s) == "real text"


def test_sourceless_claim_is_hidden_from_the_incoming_member():
    s = statement("approved", label="unverified")
    assert not can_see_statement("incoming", s)
    assert can_see_statement("lead", s)


def test_question_without_evidence_is_lead_only():
    bare = SimpleNamespace(evidence=[])
    backed = SimpleNamespace(evidence=[SimpleNamespace(piece=piece(*EVERYONE))])
    assert can_see_question("lead", bare)
    assert not can_see_question("departing", bare)
    assert can_see_question("departing", backed)


def test_departing_does_not_see_the_draft():
    s = statement("approved", piece(*EVERYONE))
    assert not can_see_statement("departing", s)


def test_visible_statements_filters_the_list():
    shown = statement("approved", piece(*EVERYONE))
    hidden_by_source = statement("approved", piece("lead"))
    hidden_by_status = statement("draft", piece(*EVERYONE))
    result = visible_statements("incoming", [shown, hidden_by_source, hidden_by_status])
    assert result == [shown]
