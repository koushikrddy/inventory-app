from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from app.database.database import get_db
from app.models.models import Category, Product
from app.schemas.schemas import CategoryCreate, CategoryUpdate
from app.utils.auth import get_current_user, require_admin_or_staff

router = APIRouter(prefix="/api/categories", tags=["Categories"])


@router.get("")
def list_categories(
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    query = db.query(Category)
    if search:
        query = query.filter(Category.name.ilike(f"%{search}%"))
    
    categories = query.order_by(Category.name).all()
    result = []
    for cat in categories:
        product_count = db.query(func.count(Product.id)).filter(Product.category_id == cat.id).scalar()
        result.append({
            "id": cat.id,
            "name": cat.name,
            "description": cat.description,
            "product_count": product_count,
            "created_at": cat.created_at.isoformat() if cat.created_at else None,
            "updated_at": cat.updated_at.isoformat() if cat.updated_at else None,
        })
    return result


@router.get("/{category_id}")
def get_category(category_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    cat = db.query(Category).filter(Category.id == category_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    product_count = db.query(func.count(Product.id)).filter(Product.category_id == cat.id).scalar()
    return {
        "id": cat.id,
        "name": cat.name,
        "description": cat.description,
        "product_count": product_count,
        "created_at": cat.created_at.isoformat() if cat.created_at else None,
    }


@router.post("", status_code=201)
def create_category(
    data: CategoryCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin_or_staff),
):
    if db.query(Category).filter(Category.name == data.name).first():
        raise HTTPException(status_code=400, detail="Category name already exists")
    
    category = Category(name=data.name, description=data.description)
    db.add(category)
    db.commit()
    db.refresh(category)
    return {
        "id": category.id,
        "name": category.name,
        "description": category.description,
        "product_count": 0,
        "created_at": category.created_at.isoformat() if category.created_at else None,
    }


@router.put("/{category_id}")
def update_category(
    category_id: int,
    data: CategoryUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin_or_staff),
):
    cat = db.query(Category).filter(Category.id == category_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    
    if data.name and data.name != cat.name:
        if db.query(Category).filter(Category.name == data.name).first():
            raise HTTPException(status_code=400, detail="Category name already exists")
        cat.name = data.name
    
    if data.description is not None:
        cat.description = data.description
    
    db.commit()
    db.refresh(cat)
    return {"id": cat.id, "name": cat.name, "description": cat.description}


@router.delete("/{category_id}")
def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin_or_staff),
):
    cat = db.query(Category).filter(Category.id == category_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    
    product_count = db.query(func.count(Product.id)).filter(Product.category_id == category_id).scalar()
    if product_count > 0:
        raise HTTPException(status_code=400, detail=f"Cannot delete category with {product_count} products")
    
    db.delete(cat)
    db.commit()
    return {"message": "Category deleted successfully"}
