import pytest


class TestInventory:
    def test_stock_in(self, client, admin_headers, sample_product):
        initial_stock = sample_product.current_stock
        response = client.post("/api/inventory/stock-in", json={
            "product_id": sample_product.id,
            "quantity": 20,
            "notes": "Test stock in",
        }, headers=admin_headers)
        assert response.status_code == 200
        assert response.json()["new_stock"] == initial_stock + 20

    def test_stock_out(self, client, admin_headers, sample_product):
        initial_stock = sample_product.current_stock
        response = client.post("/api/inventory/stock-out", json={
            "product_id": sample_product.id,
            "quantity": 10,
            "notes": "Test stock out",
        }, headers=admin_headers)
        assert response.status_code == 200
        assert response.json()["new_stock"] == initial_stock - 10

    def test_stock_out_insufficient(self, client, admin_headers, sample_product):
        response = client.post("/api/inventory/stock-out", json={
            "product_id": sample_product.id,
            "quantity": 9999,
        }, headers=admin_headers)
        assert response.status_code == 400

    def test_stock_adjustment_in(self, client, admin_headers, sample_product):
        initial_stock = sample_product.current_stock
        response = client.post("/api/inventory/adjustment", json={
            "product_id": sample_product.id,
            "quantity": 5,
            "adjustment_type": "adjustment_in",
            "notes": "Adjustment",
        }, headers=admin_headers)
        assert response.status_code == 200
        assert response.json()["new_stock"] == initial_stock + 5

    def test_stock_adjustment_out(self, client, admin_headers, sample_product):
        initial_stock = sample_product.current_stock
        response = client.post("/api/inventory/adjustment", json={
            "product_id": sample_product.id,
            "quantity": 3,
            "adjustment_type": "adjustment_out",
        }, headers=admin_headers)
        assert response.status_code == 200
        assert response.json()["new_stock"] == initial_stock - 3

    def test_stock_adjustment_out_insufficient(self, client, admin_headers, sample_product):
        response = client.post("/api/inventory/adjustment", json={
            "product_id": sample_product.id,
            "quantity": 9999,
            "adjustment_type": "adjustment_out",
        }, headers=admin_headers)
        assert response.status_code == 400

    def test_inventory_transactions_created(self, client, admin_headers, sample_product):
        client.post("/api/inventory/stock-in", json={
            "product_id": sample_product.id,
            "quantity": 10,
        }, headers=admin_headers)

        response = client.get("/api/inventory/transactions", headers=admin_headers)
        assert response.status_code == 200
        assert response.json()["total"] >= 1

    def test_stock_cannot_be_negative(self, client, admin_headers, sample_product):
        response = client.post("/api/inventory/stock-out", json={
            "product_id": sample_product.id,
            "quantity": sample_product.current_stock + 100,
        }, headers=admin_headers)
        assert response.status_code == 400
