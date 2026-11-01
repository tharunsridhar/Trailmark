"""Masks secrets and personal details in text shown to the incoming member.

Pattern based, so it will miss some things. It is a safety net on top of the access
rules, not a replacement for them.
"""

import re

SECRET_TOKENS = re.compile(
    r"\b(?:sk-[A-Za-z0-9_-]{16,}|gh[pousr]_[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}|xox[baprs]-[A-Za-z0-9-]{10,})"
)
# "password is hunter2", "api key: abc123", "token=xyz"
SECRET_ASSIGNMENT = re.compile(
    r"(?i)\b(password|passwd|pwd|secret|token|api[_ -]?key)(\s*(?:is|=|:)\s*)(\S+)"
)
EMAIL = re.compile(r"[\w.+-]+@[\w-]+(?:\.[\w-]+)+")
PHONE = re.compile(r"(?<![\w.])\+?\d[\d\s().-]{8,16}\d(?![\w])")


def mask_phone(match: re.Match) -> str:
    digits = re.sub(r"\D", "", match.group())
    # dates and short ids have fewer digits than a phone number
    return "[redacted phone]" if 10 <= len(digits) <= 15 else match.group()


def redact(text: str | None) -> str | None:
    if not text:
        return text
    text = SECRET_TOKENS.sub("[redacted secret]", text)
    text = SECRET_ASSIGNMENT.sub(lambda m: f"{m.group(1)}{m.group(2)}[redacted]", text)
    text = EMAIL.sub("[redacted email]", text)
    return PHONE.sub(mask_phone, text)
