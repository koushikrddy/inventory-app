from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from app.database.database import get_db
from app.models.models import Supplier, Product, Purchase
from app.schemas.schemas import SupplierCreate, SupplierUpdate
from app.utils.auth import get_current_user, require_admin_or_staff

router = APIRouter(prefix="/api/suppliers", tags=["Suppliers"])


@router.get("")
def list_suppliers(
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    query = db.query(Supplier)
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            Supplier.name.ilike(search_term) | Supplier.company_name.ilike(search_term)
        )
    
    suppliers = query.order_by(Supplier.name).all()
    result = []
    for s in suppliers:
        product_count = db.query(func.count(Product.id)).filter(Product.supplier_id == s.id).scalar()
        purchase_count = db.query(func.count(Purchase.id)).filter(Purchase.supplier_id == s.id).scalar()
        result.append({
            "id": s.id,
            "name": s.name,
            "contact_person": s.contact_person,
            "phone": s.phone,
            "email": s.email,
            "address": s.address,
            "company_name": s.company_name,
            "gst_vat_number": s.gst_vat_number,
            "notes": s.notes,
            "product_count": product_count,
            "purchase_count": purchase_count,
            "created_at": s.created_at.isoformat() if s.created_at else None,
            "updated_at": s.updated_at.isoformat() if s.updated_at else None,
        })
    return result


@router.get("/{supplier_id}")
def get_supplier(supplier_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    
    product_count = db.query(func.count(Product.id)).filter(Product.supplier_id == supplier_id).scalar()
    purchase_count = db.query(func.count(Purchase.id)).filter(Purchase.supplier_id == supplier_id).scalar()
    
    return {
        "id": supplier.id,
        "name": supplier.name,
        "contact_person": supplier.contact_person,
        "phone": supplier.phone,
        "email": supplier.email,
        "address": supplier.address,
        "company_name": supplier.company_name,
        "gst_vat_number": supplier.gst_vat_number,
        "notes": supplier.notes,
        "product_count": product_count,
        "purchase_count": purchase_count,
        "created_at": supplier.created_at.isoformat() if supplier.created_at else None,
    }


@router.get("/{supplier_id}/purchases")
def get_supplier_purchases(
    supplier_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    
    purchases = db.query(Purchase).filter(Purchase.supplier_id == supplier_id).order_by(Purchase.created_at.desc()).limit(50).all()
    return [
        {
            "id": p.id,
            "invoice_number": p.invoice_number,
            "total_amount": p.total_amount,
            "purchase_date": p.purchase_date.isoformat() if p.purchase_date else None,
            "created_at": p.created_at.isoformat() if p.created_at else None,
        }
        for p in purchases
    ]


@router.post("", status_code=201)
def create_supplier(
    data: SupplierCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin_or_staff),
):
    supplier = Supplier(**data.model_dump())
    db.add(supplier)
    db.commit()
    db.refresh(supplier)
    return {
        "id": supplier.id,
        "name": supplier.name,
        "contact_person": supplier.contact_person,
        "phone": supplier.phone,
        "email": supplier.email,
        "address": supplier.address,
        "company_name": supplier.company_name,
        "product_count": 0,
    }


@router.put("/{supplier_id}")
def update_supplier(
    supplier_id: int,
    data: SupplierUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin_or_staff),
):
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(supplier, key, value)
    
    db.commit()
    db.refresh(supplier)
    return {"id": supplier.id, "name": supplier.name}


@router.delete("/{supplier_id}")
def delete_supplier(
    supplier_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin_or_staff),
):
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    
    db.delete(supplier)
    db.commit()
    return {"message": "Supplier deleted successfully"}
