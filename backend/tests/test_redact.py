from app.redact import redact


def test_emails_are_masked():
    assert redact("Ask ravi.k@campus.edu about hosting") == "Ask [redacted email] about hosting"


def test_phone_numbers_are_masked():
    assert redact("Call +91 98765 43210 after 6") == "Call [redacted phone] after 6"
    assert redact("Office 044-2345-6789") == "Office [redacted phone]"


def test_dates_ids_and_times_are_left_alone():
    text = "Commit a3f9c21 on 2026-09-03T14:20:00 closed issue #7 (task T12)"
    assert redact(text) == text


def test_known_secret_formats_are_masked():
    assert redact("key sk-abcdefghijklmnop1234") == "key [redacted secret]"
    assert redact("ghp_abcdefghijklmnopqrstuvwx") == "[redacted secret]"
    assert redact("AKIAABCDEFGHIJKLMNOP") == "[redacted secret]"


def test_assigned_secrets_keep_their_label():
    assert redact("the password is hunter2") == "the password is [redacted]"
    assert redact("API_KEY=abc123") == "API_KEY=[redacted]"
    assert redact("token: xyz") == "token: [redacted]"


def test_empty_values_pass_through():
    assert redact(None) is None
    assert redact("") == ""
