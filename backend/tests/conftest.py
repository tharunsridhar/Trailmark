import os

# set before the app is imported so settings pick it up
os.environ["JWT_SECRET"] = "test-secret-that-is-long-enough-for-hs256"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db import Base, get_db
from app.main import app


@pytest.fixture
def db_session():
    # one in-memory database per test so tests never affect each other
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
