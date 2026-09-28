import pytest


class TestAuth:
    def test_register(self, client):
        response = client.post("/api/auth/register", json={
            "email": "new@test.com",
            "username": "newuser",
            "password": "password123",
            "full_name": "New User",
            "role": "staff",
        })
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "new@test.com"
        assert data["username"] == "newuser"
        assert data["role"] == "staff"

    def test_register_duplicate_email(self, client, admin_user):
        response = client.post("/api/auth/register", json={
            "email": "admin@test.com",
            "username": "other",
            "password": "password123",
            "full_name": "Other User",
        })
        assert response.status_code == 400

    def test_login_success(self, client, admin_user):
        response = client.post("/api/auth/login", json={
            "email": "admin@test.com",
            "password": "admin123",
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["user"]["email"] == "admin@test.com"

    def test_login_wrong_password(self, client, admin_user):
        response = client.post("/api/auth/login", json={
            "email": "admin@test.com",
            "password": "wrongpassword",
        })
        assert response.status_code == 401

    def test_get_me(self, client, admin_headers):
        response = client.get("/api/auth/me", headers=admin_headers)
        assert response.status_code == 200
        assert response.json()["email"] == "admin@test.com"

    def test_unauthorized_access(self, client):
        response = client.get("/api/auth/me")
        assert response.status_code == 403

    def test_change_password(self, client, admin_headers):
        response = client.put("/api/auth/change-password", json={
            "current_password": "admin123",
            "new_password": "newpassword123",
        }, headers=admin_headers)
        assert response.status_code == 200

    def test_change_password_wrong_current(self, client, admin_headers):
        response = client.put("/api/auth/change-password", json={
            "current_password": "wrongpassword",
            "new_password": "newpassword123",
        }, headers=admin_headers)
        assert response.status_code == 400
