import pytest
from datetime import datetime


class TestPurchases:
    def test_create_purchase(self, client, admin_headers, sample_product, sample_supplier):
        initial_stock = sample_product.current_stock
        response = client.post("/api/purchases", json={
            "supplier_id": sample_supplier.id,
            "items": [
                {"product_id": sample_product.id, "quantity": 20, "unit_price": sample_product.purchase_price}
            ],
            "purchase_date": datetime.now().isoformat(),
            "notes": "Test purchase",
        }, headers=admin_headers)
        assert response.status_code == 201

    def test_purchase_increases_stock(self, client, admin_headers, sample_product, sample_supplier, db):
        initial_stock = sample_product.current_stock
        client.post("/api/purchases", json={
            "supplier_id": sample_supplier.id,
            "items": [{"product_id": sample_product.id, "quantity": 30, "unit_price": sample_product.purchase_price}],
            "purchase_date": datetime.now().isoformat(),
        }, headers=admin_headers)

        db.refresh(sample_product)
        assert sample_product.current_stock == initial_stock + 30

    def test_purchase_creates_inventory_transaction(self, client, admin_headers, sample_product, sample_supplier):
        client.post("/api/purchases", json={
            "supplier_id": sample_supplier.id,
            "items": [{"product_id": sample_product.id, "quantity": 15, "unit_price": sample_product.purchase_price}],
            "purchase_date": datetime.now().isoformat(),
        }, headers=admin_headers)

        response = client.get("/api/inventory/transactions", headers=admin_headers)
        assert response.status_code == 200
        transactions = response.json()["items"]
        purchase_txns = [t for t in transactions if t["transaction_type"] == "PURCHASE"]
        assert len(purchase_txns) >= 1

    def test_list_purchases(self, client, admin_headers, sample_product, sample_supplier):
        client.post("/api/purchases", json={
            "supplier_id": sample_supplier.id,
            "items": [{"product_id": sample_product.id, "quantity": 10, "unit_price": sample_product.purchase_price}],
            "purchase_date": datetime.now().isoformat(),
        }, headers=admin_headers)

        response = client.get("/api/purchases", headers=admin_headers)
        assert response.status_code == 200
        assert response.json()["total"] >= 1

    def test_empty_purchase_fails(self, client, admin_headers, sample_supplier):
        response = client.post("/api/purchases", json={
            "supplier_id": sample_supplier.id,
            "items": [],
            "purchase_date": datetime.now().isoformat(),
        }, headers=admin_headers)
        assert response.status_code == 400
