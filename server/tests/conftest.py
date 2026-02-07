import os
import sys
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))


@pytest.fixture()
def app(monkeypatch):
    monkeypatch.setenv("MONGODB_NAME", "testdb")
    monkeypatch.setenv("MONGODB_CLIENT_CLASS", 'mongomock')
    monkeypatch.setenv("SESSION_CACHE", "simple")

    from app import create_app

    app = create_app()
    
    return app


@pytest.fixture()
def client(app):
    return app.test_client()
