from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from typing import Optional
from app.database.database import get_db
from app.models.models import Product, Category, Supplier
from app.schemas.schemas import (
    ProductCreate, ProductUpdate, ProductResponse, PaginatedResponse
)
from app.utils.auth import get_current_user, require_admin_or_staff
from app.services.inventory_service import get_stock_status

router = APIRouter(prefix="/api/products", tags=["Products"])


def product_to_response(product: Product) -> dict:
    return {
        "id": product.id,
        "sku": product.sku,
        "barcode": product.barcode,
        "name": product.name,
        "description": product.description,
        "category_id": product.category_id,
        "category_name": product.category.name if product.category else None,
        "brand": product.brand,
        "supplier_id": product.supplier_id,
        "supplier_name": product.supplier.name if product.supplier else None,
        "purchase_price": product.purchase_price,
        "selling_price": product.selling_price,
        "current_stock": product.current_stock,
        "minimum_stock_level": product.minimum_stock_level,
        "maximum_stock_level": product.maximum_stock_level,
        "reorder_quantity": product.reorder_quantity,
        "unit": product.unit,
        "expiry_date": product.expiry_date.isoformat() if product.expiry_date else None,
        "image_url": product.image_url,
        "is_active": product.is_active,
        "stock_status": get_stock_status(product),
        "created_at": product.created_at.isoformat() if product.created_at else None,
        "updated_at": product.updated_at.isoformat() if product.updated_at else None,
    }


@router.get("")
def list_products(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    category_id: Optional[int] = None,
    supplier_id: Optional[int] = None,
    stock_status: Optional[str] = None,
    sort_by: Optional[str] = "name",
    sort_order: Optional[str] = "asc",
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    query = db.query(Product)

    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                Product.name.ilike(search_term),
                Product.sku.ilike(search_term),
                Product.barcode.ilike(search_term),
                Product.brand.ilike(search_term),
            )
        )

    if category_id:
        query = query.filter(Product.category_id == category_id)

    if supplier_id:
        query = query.filter(Product.supplier_id == supplier_id)

    # Get all products first for stock status filtering
    all_products = query.all()

    if stock_status:
        filtered = []
        for p in all_products:
            if get_stock_status(p) == stock_status:
                filtered.append(p)
        all_products = filtered

    # Sort
    sort_attr = getattr(Product, sort_by, Product.name)
    if sort_order == "desc":
        all_products.sort(key=lambda p: getattr(p, sort_by, "") or "", reverse=True)
    else:
        all_products.sort(key=lambda p: getattr(p, sort_by, "") or "")

    total = len(all_products)
    start = (page - 1) * page_size
    end = start + page_size
    paginated = all_products[start:end]

    return {
        "items": [product_to_response(p) for p in paginated],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size,
    }


@router.get("/{product_id}")
def get_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product_to_response(product)


@router.post("", status_code=201)
def create_product(
    data: ProductCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin_or_staff),
):
    # Check duplicate SKU
    if db.query(Product).filter(Product.sku == data.sku).first():
        raise HTTPException(status_code=400, detail="SKU already exists")

    # Check duplicate barcode
    if data.barcode and db.query(Product).filter(Product.barcode == data.barcode).first():
        raise HTTPException(status_code=400, detail="Barcode already exists")

    product = Product(**data.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    return product_to_response(product)


@router.put("/{product_id}")
def update_product(
    product_id: int,
    data: ProductUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin_or_staff),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    update_data = data.model_dump(exclude_unset=True)

    if "sku" in update_data and update_data["sku"] != product.sku:
        if db.query(Product).filter(Product.sku == update_data["sku"]).first():
            raise HTTPException(status_code=400, detail="SKU already exists")

    if "barcode" in update_data and update_data["barcode"] and update_data["barcode"] != product.barcode:
        if db.query(Product).filter(Product.barcode == update_data["barcode"]).first():
            raise HTTPException(status_code=400, detail="Barcode already exists")

    for key, value in update_data.items():
        setattr(product, key, value)

    db.commit()
    db.refresh(product)
    return product_to_response(product)


@router.delete("/{product_id}")
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin_or_staff),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    db.delete(product)
    db.commit()
    return {"message": "Product deleted successfully"}
