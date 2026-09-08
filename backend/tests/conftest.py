import warnings

import pytest
from fastapi.testclient import TestClient

from app.main import app

warnings.filterwarnings("ignore", category=DeprecationWarning)


@pytest.fixture(scope="session")
def client():
    return TestClient(app)
