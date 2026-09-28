import pytest


class TestSales:
    def test_create_sale(self, client, admin_headers, sample_product):
        initial_stock = sample_product.current_stock
        response = client.post("/api/sales", json={
            "items": [
                {"product_id": sample_product.id, "quantity": 5, "unit_price": sample_product.selling_price}
            ],
            "discount": 0,
            "tax_rate": 0,
            "payment_method": "cash",
        }, headers=admin_headers)
        assert response.status_code == 201
        data = response.json()
        assert data["total"] == sample_product.selling_price * 5
        assert data["profit"] == (sample_product.selling_price - sample_product.purchase_price) * 5

    def test_sale_reduces_stock(self, client, admin_headers, sample_product, db):
        initial_stock = sample_product.current_stock
        client.post("/api/sales", json={
            "items": [{"product_id": sample_product.id, "quantity": 5, "unit_price": sample_product.selling_price}],
            "payment_method": "cash",
        }, headers=admin_headers)
        
        db.refresh(sample_product)
        assert sample_product.current_stock == initial_stock - 5

    def test_sale_creates_inventory_transaction(self, client, admin_headers, sample_product):
        client.post("/api/sales", json={
            "items": [{"product_id": sample_product.id, "quantity": 3, "unit_price": sample_product.selling_price}],
            "payment_method": "cash",
        }, headers=admin_headers)

        response = client.get("/api/inventory/transactions", headers=admin_headers)
        assert response.status_code == 200
        transactions = response.json()["items"]
        sale_txns = [t for t in transactions if t["transaction_type"] == "SALE"]
        assert len(sale_txns) >= 1

    def test_sale_cannot_exceed_stock(self, client, admin_headers, sample_product):
        response = client.post("/api/sales", json={
            "items": [{"product_id": sample_product.id, "quantity": sample_product.current_stock + 100, "unit_price": sample_product.selling_price}],
            "payment_method": "cash",
        }, headers=admin_headers)
        assert response.status_code == 400

    def test_empty_sale_fails(self, client, admin_headers):
        response = client.post("/api/sales", json={
            "items": [],
            "payment_method": "cash",
        }, headers=admin_headers)
        assert response.status_code == 400

    def test_list_sales(self, client, admin_headers, sample_product):
        client.post("/api/sales", json={
            "items": [{"product_id": sample_product.id, "quantity": 2, "unit_price": sample_product.selling_price}],
            "payment_method": "card",
        }, headers=admin_headers)

        response = client.get("/api/sales", headers=admin_headers)
        assert response.status_code == 200
        assert response.json()["total"] >= 1

    def test_profit_calculation(self, client, admin_headers, sample_product):
        qty = 5
        expected_profit = (sample_product.selling_price - sample_product.purchase_price) * qty
        response = client.post("/api/sales", json={
            "items": [{"product_id": sample_product.id, "quantity": qty, "unit_price": sample_product.selling_price}],
            "discount": 0,
            "payment_method": "cash",
        }, headers=admin_headers)
        assert response.json()["profit"] == expected_profit
