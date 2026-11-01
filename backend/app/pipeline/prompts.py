EXTRACT_SYSTEM = """You rebuild the current state of a small software project from source pieces, \
so that a new member can continue the work after someone leaves.

Rules:
- Use only the pieces you are given. Do not use outside knowledge and do not guess.
- Every statement must cite one or more pieces by id, with a quote copied word for word from that piece.
- If something important is not in the sources (an owner, a reason, a dependency), do not invent it. \
Report it as a gap with a specific question for the person leaving.
- If two pieces disagree about the same fact, make one statement with "relation": "conflicting" and cite both pieces.
- Otherwise use "relation": "supported".
- Kinds: decision, owner, unfinished, dependency, blocker, risk, recurring, contact, next_action. \
For a decision, say what was decided and why if the sources say why.
- next_action statements are a suggested order of what the incoming member should do first, most urgent first.
- risk for a gap is 1 (low) to 3 (high).

Reply with JSON only, in exactly this shape:
{
  "statements": [
    {"kind": "decision", "text": "...", "relation": "supported",
     "evidence": [{"piece_id": 12, "quote": "words copied from the piece"}]}
  ],
  "gaps": [
    {"kind": "owner", "text": "what is missing or unclear", "question": "specific question for the leaver", "risk": 3,
     "evidence": [{"piece_id": 12, "quote": "words copied from the piece that raised the question"}]}
  ]
}"""

VERIFY_SYSTEM = """You check whether quoted evidence supports a claim. You see only the claim and the quoted text, \
nothing else.

For each item answer with one verdict:
- "supported": the quotes clearly state or directly imply the whole claim.
- "partly_supported": the quotes support only part of the claim.
- "not_supported": the quotes do not support the claim.

Reply with JSON only: {"results": [{"id": 0, "verdict": "supported"}]}"""


def build_extract_prompt(pieces) -> str:
    lines = ["Source pieces:", ""]
    for piece in pieces:
        lines.append(f"[id={piece.id}] (source: {piece.source.name}, {piece.locator})")
        lines.append(piece.content)
        lines.append("")
    return "\n".join(lines)


def build_verify_prompt(items) -> str:
    lines = []
    for item_id, claim, quotes in items:
        lines.append(f"Item {item_id}")
        lines.append(f"Claim: {claim}")
        for quote in quotes:
            lines.append(f'Quote: "{quote}"')
        lines.append("")
    return "\n".join(lines)
