"""Scores a saved or fresh analysis file against data/synthetic/answer_key.json.

usage: python tests/score_run.py path/to/result.json   (from the backend folder)
A case counts as cited if a statement cites one of its locations, and as labelled correctly if any
such statement has the expected label. Not a test: pytest does not collect this file."""
import json, re, sys
from pathlib import Path
R = Path(__file__).resolve().parents[2] / "data" / "synthetic"
key = json.loads((R / "answer_key.json").read_text(encoding="utf-8"))
man = {s["file"]: s["name"] for s in json.loads((R / "manifest.json").read_text(encoding="utf-8"))["sources"]}
d = json.load(open(sys.argv[1], encoding="utf-8"))["drafts"]
def parts(c):
    return [p.strip() for p in re.split(r" vs |, ", c["location"])]
def hit(e, c, part):
    loc, src = e["locator"].lower(), e["source"]
    m = re.match(r"(\S+\.md) paragraph (\d+)", part)
    if m:  # key counts paragraphs after the title block, importer counts it too
        return loc == f"{m.group(1)} paragraph {int(m.group(2)) + 1}".lower()
    if part.startswith("chat message"):
        want = man[c["source_file"]] if c["source_file"].startswith("chat/") else "Team Chat Archive"
        return loc == part.lower() and src == want
    return loc == part.lower().replace("pr #", "pr #")
res = {}
for c in key["cases"]:
    sts = [x for x in d if any(hit(e, c, p) for e in x["evidence"] for p in parts(c))]
    res[c["id"]] = (c, sts)
cited = sum(1 for c, s in res.values() if s)
ok = [i for i, (c, s) in res.items() if any(x["label"] == c["expected_label"] for x in s)]
wrong = [i for i in res if i not in ok]
confl = [i for i in ("C10", "C11", "C12") if i in ok]
leav = [i for i in ("C06", "C07", "C08", "C09") if i in ok]
nconf = sum(1 for x in d if x["label"] == "conflicting")
dup = nconf - len({i for i in ("C10", "C11", "C12") if res[i][1]})
q = sum(1 for x in d if x.get("question"))
pat = re.compile(r"hr[ _]private|lead[ _]private|private[ _](notes|chat)|Lead 1-on-1|\(confidential\)|confidential|restricted", re.I)
named = [x for x in d if pat.search(x["text"] + " " + (x.get("question") or ""))]
nolab = {}
for x in d: nolab[x["label"]] = nolab.get(x["label"], 0) + 1
print(f"statements {len(d)} {nolab}  questions {q}")
print(f"cited {cited}/32  expected label {len(ok)}/32  conflicts {len(confl)}/3 (conflicting statements {nconf}, duplicates {dup})  leaver-only {len(leav)}/4")
print("wrong:", wrong, " uncited:", [i for i, (c, s) in res.items() if not s])
print("C18:", [x["label"] for x in res["C18"][1]], "C07:", [x["label"] for x in res["C07"][1]])
print("restricted names in text:", len(named))
for x in named: print("  ", x["label"], x["text"][:160], "|", x.get("question"))
print("sourceless:", sum(1 for x in d if not x["evidence"]))
