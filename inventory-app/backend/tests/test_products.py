import pytest


class TestProducts:
    def test_list_products(self, client, admin_headers, sample_product):
        response = client.get("/api/products", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 1
        assert len(data["items"]) >= 1

    def test_create_product(self, client, admin_headers, sample_category, sample_supplier):
        response = client.post("/api/products", json={
            "sku": "NEW001",
            "name": "New Product",
            "category_id": sample_category.id,
            "supplier_id": sample_supplier.id,
            "purchase_price": 10000,
            "selling_price": 15000,
            "current_stock": 30,
            "unit": "piece",
        }, headers=admin_headers)
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "New Product"
        assert data["sku"] == "NEW001"

    def test_create_product_duplicate_sku(self, client, admin_headers, sample_product):
        response = client.post("/api/products", json={
            "sku": "TEST001",
            "name": "Another Product",
            "purchase_price": 10000,
            "selling_price": 15000,
        }, headers=admin_headers)
        assert response.status_code == 400

    def test_get_product(self, client, admin_headers, sample_product):
        response = client.get(f"/api/products/{sample_product.id}", headers=admin_headers)
        assert response.status_code == 200
        assert response.json()["name"] == "Test Product"

    def test_update_product(self, client, admin_headers, sample_product):
        response = client.put(f"/api/products/{sample_product.id}", json={
            "name": "Updated Product",
            "selling_price": 20000,
        }, headers=admin_headers)
        assert response.status_code == 200
        assert response.json()["name"] == "Updated Product"

    def test_delete_product(self, client, admin_headers, sample_product):
        response = client.delete(f"/api/products/{sample_product.id}", headers=admin_headers)
        assert response.status_code == 200

    def test_staff_can_manage_products(self, client, staff_headers, sample_category):
        response = client.post("/api/products", json={
            "sku": "STAFF001",
            "name": "Staff Product",
            "category_id": sample_category.id,
            "purchase_price": 5000,
            "selling_price": 8000,
        }, headers=staff_headers)
        assert response.status_code == 201

    def test_search_products(self, client, admin_headers, sample_product):
        response = client.get("/api/products?search=Test", headers=admin_headers)
        assert response.status_code == 200
        assert response.json()["total"] >= 1

    def test_filter_by_category(self, client, admin_headers, sample_product, sample_category):
        response = client.get(f"/api/products?category_id={sample_category.id}", headers=admin_headers)
        assert response.status_code == 200
        assert response.json()["total"] >= 1

    def test_filter_by_stock_status(self, client, admin_headers, sample_product):
        response = client.get("/api/products?stock_status=in_stock", headers=admin_headers)
        assert response.status_code == 200
        assert response.json()["total"] >= 1
