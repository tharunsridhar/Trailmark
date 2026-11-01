import pytest

from app.config import Settings, check_settings
from app.db import normalise_url


def test_postgres_urls_get_the_driver_named():
    assert normalise_url("postgres://u:p@host/db") == "postgresql+psycopg://u:p@host/db"
    assert normalise_url("postgresql://u:p@host/db") == "postgresql+psycopg://u:p@host/db"
    assert normalise_url("postgresql+psycopg://u:p@host/db") == "postgresql+psycopg://u:p@host/db"
    assert normalise_url("sqlite:///local.db") == "sqlite:///local.db"


def test_deployment_with_the_default_secret_refuses_to_start():
    with pytest.raises(RuntimeError):
        check_settings(Settings(cookie_secure=True, jwt_secret="change-me"))


def test_deployment_with_a_short_secret_refuses_to_start():
    with pytest.raises(RuntimeError):
        check_settings(Settings(cookie_secure=True, jwt_secret="too-short"))


def test_deployment_with_a_long_secret_starts():
    check_settings(Settings(cookie_secure=True, jwt_secret="x" * 40))


def test_local_development_may_use_the_default_secret():
    check_settings(Settings(cookie_secure=False, jwt_secret="change-me"))
