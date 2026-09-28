import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database.database import Base, get_db
from app.main import app
from app.utils.auth import get_password_hash, create_access_token
from app.models.models import User, Category, Supplier, Product

# Use SQLite for testing
SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def admin_user(db):
    user = User(
        email="admin@test.com",
        username="admin",
        hashed_password=get_password_hash("admin123"),
        full_name="Test Admin",
        role="admin",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def staff_user(db):
    user = User(
        email="staff@test.com",
        username="staff",
        hashed_password=get_password_hash("staff123"),
        full_name="Test Staff",
        role="staff",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def admin_token(admin_user):
    return create_access_token(data={"sub": str(admin_user.id)})


@pytest.fixture
def staff_token(staff_user):
    return create_access_token(data={"sub": str(staff_user.id)})


@pytest.fixture
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture
def staff_headers(staff_token):
    return {"Authorization": f"Bearer {staff_token}"}


@pytest.fixture
def sample_category(db):
    cat = Category(name="Grocery", description="Test category")
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat


@pytest.fixture
def sample_supplier(db):
    sup = Supplier(name="Test Supplier", contact_person="Test Person", phone="1234567890")
    db.add(sup)
    db.commit()
    db.refresh(sup)
    return sup


@pytest.fixture
def sample_product(db, sample_category, sample_supplier):
    product = Product(
        sku="TEST001",
        name="Test Product",
        category_id=sample_category.id,
        supplier_id=sample_supplier.id,
        purchase_price=10000,
        selling_price=15000,
        current_stock=50,
        minimum_stock_level=10,
        maximum_stock_level=200,
        reorder_quantity=30,
        unit="piece",
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return product
