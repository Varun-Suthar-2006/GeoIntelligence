import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

@pytest.fixture(scope="module")
def client():
    with TestClient(app) as test_client:
        yield test_client

def test_health_endpoint(client):
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "HEALTHY"

def test_datasets_list(client):
    res = client.get("/api/v1/datasets")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert len(data) >= 1

def test_models_list(client):
    res = client.get("/api/v1/models")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert len(data) >= 2
    names = [m["model_name"] for m in data]
    assert any("Siamese" in n for n in names)

def test_images_list(client):
    res = client.get("/api/v1/images")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)

def test_dashboard_overview(client):
    res = client.get("/api/v1/dashboard/overview")
    assert res.status_code == 200
    data = res.json()
    assert "total_analyses" in data
    assert "total_images" in data
    assert "total_models" in data
