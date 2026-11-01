import os

# set before the app is imported so settings pick it up
os.environ["JWT_SECRET"] = "test-secret-that-is-long-enough-for-hs256"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db import Base, get_db, normalise_url
from app.deps import get_llm, get_session_factory
from app.main import app
from tests.helpers import create_team, sign_in, upload


@pytest.fixture
def db_session():
    # one clean database per test so tests never affect each other
    test_url = os.environ.get("TEST_DATABASE_URL")
    if test_url:
        # a real Postgres, for checking the app does not depend on SQLite quirks
        engine = create_engine(normalise_url(test_url))
        Base.metadata.drop_all(engine)
    else:
        engine = create_engine(
            "sqlite://",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)
    session = Session()
    yield session
    session.close()
    engine.dispose()


@pytest.fixture
def client(db_session):
    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture(autouse=True)
def saved_results_in_tmp(tmp_path, monkeypatch):
    """Keeps analysis results from tests out of the repo."""
    from app.config import get_settings

    monkeypatch.setattr(get_settings(), "saved_results_dir", str(tmp_path / "saved"))


@pytest.fixture
def team(client):
    return create_team(client)


@pytest.fixture
def use_llm(client, db_session):
    """Runs background analysis on the test database with a scripted AI."""
    factory = sessionmaker(bind=db_session.get_bind(), autoflush=False, expire_on_commit=False)
    app.dependency_overrides[get_session_factory] = lambda: factory

    def set_llm(llm):
        app.dependency_overrides[get_llm] = lambda: llm

    set_llm(None)
    return set_llm


@pytest.fixture
def loaded(client, team, db_session):
    """Chat and design doc open to all, tasks open, an HR chat only the lead may see."""
    sign_in(client, "Kishan")
    upload(client, team, "chat", "chat.json", name="Team chat")
    upload(client, team, "doc", "design.md", name="Design notes")
    upload(client, team, "tasks", "tasks.csv", name="Task list")
    upload(client, team, "chat", "chat.json", name="HR chat", roles=("lead",))
    return team
