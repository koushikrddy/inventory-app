import pytest


class TestAI:
    def test_demand_prediction_insufficient_data(self, client, admin_headers, sample_product):
        response = client.get(f"/api/ai/demand/{sample_product.id}", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert "product_id" in data
        assert data["data_quality"] == "insufficient"

    def test_get_predictions(self, client, admin_headers, sample_product):
        response = client.get("/api/ai/predictions", headers=admin_headers)
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    def test_get_recommendations(self, client, admin_headers, sample_product):
        response = client.get("/api/ai/recommendations", headers=admin_headers)
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    def test_demand_prediction_for_nonexistent_product(self, client, admin_headers):
        response = client.get("/api/ai/demand/99999", headers=admin_headers)
        assert response.status_code == 404
