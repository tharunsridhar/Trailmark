"""Runs the real AI pipeline once on data/synthetic through the API and writes OUTDIR/result.json.
Nothing in the repository is touched: the saved file is written to OUTDIR.

usage: python tests/run_real_pipeline.py OUTDIR [path/to/.env]   (from the backend folder)
Only the LLM_* lines of the env file are read, the key is never printed. Not a test: pytest does not collect it."""
import json, os, sys, time
from pathlib import Path

BACKEND = Path(__file__).resolve().parents[1]
out = Path(sys.argv[1]).resolve(); out.mkdir(parents=True, exist_ok=True)
for line in Path(sys.argv[2] if len(sys.argv) > 2 else BACKEND.parent / ".env").read_text(encoding="utf-8-sig").splitlines():
    if "=" in line and not line.startswith("#"):
        k, v = line.split("=", 1)
        if k.startswith("LLM_"):
            os.environ[k] = v.strip()
os.environ["JWT_SECRET"] = "scratch-secret-that-is-long-enough-for-hs256"
os.environ["SAVED_RESULTS_DIR"] = str(out / "saved")
sys.path.insert(0, str(BACKEND)); os.chdir(BACKEND)

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.db import Base, get_db
from app.deps import get_session_factory
from app.main import app
from tests.helpers import create_team, sign_in

engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
Base.metadata.create_all(engine)
Session = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)
def get_session():
    s = Session()
    try: yield s
    finally: s.close()
app.dependency_overrides[get_db] = get_session
app.dependency_overrides[get_session_factory] = lambda: Session

root = BACKEND.parent / "data" / "synthetic"
manifest = json.loads((root / "manifest.json").read_text(encoding="utf-8"))
with TestClient(app) as c:
    hid = create_team(c)
    sign_in(c, "Kishan")
    for s in manifest["sources"]:
        r = c.post(f"/handovers/{hid}/sources",
                   data={"type": s["type"], "name": s["name"], "allowed_roles": json.dumps(s["allowed_roles"])},
                   files={"file": (Path(s["file"]).name, (root / s["file"]).read_bytes())})
        print(s["name"], r.status_code)
    r = c.post(f"/handovers/{hid}/analyze"); print("analyze", r.status_code)
    for _ in range(120):
        a = c.get(f"/handovers/{hid}/analysis").json()
        if a["status"] != "running": break
        time.sleep(5)
    print({k: a.get(k) for k in ("status", "mode", "notice", "counts", "dropped")})
files = list((out / "saved").glob("*.json"))
print("saved:", [f.name for f in files])
if files:
    (out / "result.json").write_text(files[0].read_text(encoding="utf-8"), encoding="utf-8")
