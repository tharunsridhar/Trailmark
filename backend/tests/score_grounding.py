"""Share of model claims whose quote really appears in the source piece they cite.

usage: python tests/score_grounding.py OUTDIR   (OUTDIR is the folder given to run_real_pipeline.py)
Reads OUTDIR/grounding.json, which records every quote the model proposed before the pipeline filters out
the bad ones. A quote is grounded if it appears in the cited piece, ignoring only spacing and line breaks.
A claim is grounded if all of its quotes are. Not a test: pytest does not collect this file."""
import json, sys
from pathlib import Path

claims = [c for c in json.loads((Path(sys.argv[1]) / "grounding.json").read_text(encoding="utf-8")) if c]
quotes = [q for c in claims for q in c]
grounded_quotes = sum(q["found"] for q in quotes)
grounded_claims = sum(all(q["found"] for q in c) for c in claims)
print(f"claims {len(claims)}  grounded {grounded_claims}  ungrounded {len(claims) - grounded_claims}  "
      f"{100 * grounded_claims / len(claims):.1f}%")
print(f"quotes {len(quotes)}  found in cited source {grounded_quotes}  {100 * grounded_quotes / len(quotes):.1f}%")
for c in claims:
    for q in c:
        if not q["found"]:
            print("  ungrounded:", q["source"], "|", q["quote"][:120])
