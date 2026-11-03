EXTRACT_SYSTEM = """You rebuild the current state of a small software project from source pieces, \
so that a new member can continue the work after someone leaves.

Rules:
- Use only the pieces you are given. Do not use outside knowledge and do not guess.
- Every statement must cite one or more pieces by id, with a quote copied word for word from that piece.
- If something important is not in the sources (an owner, a reason, a dependency), do not invent it. \
Report it as a gap with a specific question for the person leaving.
- If two pieces disagree about the same fact, make one statement with "relation": "conflicting" and cite both pieces.
- If a person says they did something, tested something or arranged something, and no code, commit, document \
or task confirms it, use "relation": "claim_only". For example "I stress-tested it" or "I got the quota raised" \
with no benchmark or ticket anywhere.
- Otherwise use "relation": "supported".
- Something that is missing, unowned, unexplained or undocumented is a gap, never a statement. Examples: a task \
with no owner, a library or service used without credentials or instructions, a stub waiting on information.
- Read the chat message by message. When a person says what they tested, configured or arranged (numbers, quotas, \
scopes, schedules), that is its own claim_only statement unless something else in the sources backs it.
- Be thorough. Go through every source and report each separate decision, claim, unfinished item, dependency, \
recurring problem and contact as its own statement. A small project usually gives 25 to 40 statements. \
Do not leave a source out because it looks sensitive, who may see it is handled elsewhere.
- Kinds: decision, owner, unfinished, dependency, blocker, risk, recurring, contact, next_action. \
For a decision, say what was decided and why if the sources say why. A decision is a choice the team made \
(a technology, a rule, a trade-off). A commit that only records routine work, such as a typo fix, formatting, \
a version pin or a small screen, is not a decision, so leave it out. Keep a commit when it shows a choice, \
leaves something unfinished or adds a dependency. \
unfinished is work that was started and not finished (an open pull request, a stalled task, a stub). \
recurring is the same problem mentioned more than once. contact is who to ask about something.
- next_action statements are a suggested order of what the incoming member should do first, most urgent first.
- risk for a gap is 1 (low) to 3 (high).
- In the text of a statement, gap or question, never write a file name, path, paragraph number or source title. \nDescribe what is missing in plain words; the evidence already says where it comes from.

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

# the long request often skips chat claims, so they get a short request of their own
CLAIMS_FOCUS = (
    "Every piece below is a chat message by the person who is leaving. Report each message in which they say "
    "they did, tested, configured, arranged or agreed something about the project, as its own statement with "
    '"relation": "claim_only". Quote the message word for word. Report nothing else and no gaps.'
)

# document paragraphs are often skipped in the long request, so the ones nothing cites get a request of their own
DOC_FOCUS = (
    "Every piece below is a paragraph of a project document that the first pass did not cover. Report each "
    "decision (with its reason), dependency, contact, risk or unfinished item the paragraph states, and any "
    "gap it raises. Report nothing that is not in the paragraph."
)

# commits, pull requests, issues and tasks nothing cites are often skipped too, so they get one request of their own
RECORD_FOCUS = (
    "Every piece below is a commit, pull request, issue or task that the first pass did not cover. Report each "
    "decision (with its reason), unfinished item, dependency, blocker, risk or owner it states, as a statement "
    "that quotes the piece. Report a gap only when nothing in the piece or in the sources explains it, for example "
    "a task with no owner. A record that has an owner, a status or a description is not a gap. "
    "Report nothing that is not in the piece."
)


VERIFY_SYSTEM = """You check whether quoted evidence supports a claim. You see only the claim and the quoted text, \
nothing else.

For each item answer with one verdict:
- "supported": the quotes clearly state or directly imply the whole claim.
- "partly_supported": the quotes support only part of the claim.
- "not_supported": the quotes do not support the claim.

Reply with JSON only: {"results": [{"id": 0, "verdict": "supported"}]}"""


def build_extract_prompt(pieces) -> str:
    counts: dict[str, int] = {}
    for piece in pieces:
        counts[piece.source.name] = counts.get(piece.source.name, 0) + 1
    lines = ["Sources (every one of them must be covered by at least one statement or gap):"]
    lines += [f"- {name}: {count} pieces" for name, count in counts.items()]
    lines += ["", "Source pieces:", ""]
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
