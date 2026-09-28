from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
from app.database.database import get_db
from app.models.models import Product, Purchase, PurchaseItem, Supplier
from app.schemas.schemas import PurchaseCreate
from app.utils.auth import get_current_user, require_admin_or_staff
from app.services.inventory_service import record_stock_change, check_and_create_alerts, generate_invoice_number

router = APIRouter(prefix="/api/purchases", tags=["Purchases"])


@router.get("")
def list_purchases(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    supplier_id: Optional[int] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    query = db.query(Purchase)
    
    if supplier_id:
        query = query.filter(Purchase.supplier_id == supplier_id)
    if start_date:
        query = query.filter(Purchase.purchase_date >= start_date)
    if end_date:
        query = query.filter(Purchase.purchase_date <= end_date + " 23:59:59")
    
    total = query.count()
    purchases = query.order_by(Purchase.created_at.desc()).offset(
        (page - 1) * page_size
    ).limit(page_size).all()
    
    result = []
    for purchase in purchases:
        from app.models.models import User
        supplier = db.query(Supplier).filter(Supplier.id == purchase.supplier_id).first()
        user = db.query(User).filter(User.id == purchase.user_id).first()
        items = db.query(PurchaseItem).filter(PurchaseItem.purchase_id == purchase.id).all()
        items_data = []
        for item in items:
            product = db.query(Product).filter(Product.id == item.product_id).first()
            items_data.append({
                "id": item.id,
                "product_id": item.product_id,
                "product_name": product.name if product else None,
                "quantity": item.quantity,
                "unit_price": item.unit_price,
                "total_price": item.total_price,
            })
        
        result.append({
            "id": purchase.id,
            "invoice_number": purchase.invoice_number,
            "supplier_id": purchase.supplier_id,
            "supplier_name": supplier.name if supplier else None,
            "user_id": purchase.user_id,
            "user_name": user.full_name if user else None,
            "total_amount": purchase.total_amount,
            "purchase_date": purchase.purchase_date.isoformat() if purchase.purchase_date else None,
            "notes": purchase.notes,
            "items": items_data,
            "created_at": purchase.created_at.isoformat() if purchase.created_at else None,
        })
    
    return {
        "items": result,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size,
    }


@router.get("/{purchase_id}")
def get_purchase(purchase_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    purchase = db.query(Purchase).filter(Purchase.id == purchase_id).first()
    if not purchase:
        raise HTTPException(status_code=404, detail="Purchase not found")
    
    from app.models.models import User
    supplier = db.query(Supplier).filter(Supplier.id == purchase.supplier_id).first()
    user = db.query(User).filter(User.id == purchase.user_id).first()
    items = db.query(PurchaseItem).filter(PurchaseItem.purchase_id == purchase.id).all()
    items_data = []
    for item in items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        items_data.append({
            "id": item.id,
            "product_id": item.product_id,
            "product_name": product.name if product else None,
            "quantity": item.quantity,
            "unit_price": item.unit_price,
            "total_price": item.total_price,
        })
    
    return {
        "id": purchase.id,
        "invoice_number": purchase.invoice_number,
        "supplier_id": purchase.supplier_id,
        "supplier_name": supplier.name if supplier else None,
        "user_id": purchase.user_id,
        "user_name": user.full_name if user else None,
        "total_amount": purchase.total_amount,
        "purchase_date": purchase.purchase_date.isoformat() if purchase.purchase_date else None,
        "notes": purchase.notes,
        "items": items_data,
        "created_at": purchase.created_at.isoformat() if purchase.created_at else None,
    }


@router.post("", status_code=201)
def create_purchase(
    data: PurchaseCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin_or_staff),
):
    if not data.items:
        raise HTTPException(status_code=400, detail="Purchase must have at least one item")

    supplier = db.query(Supplier).filter(Supplier.id == data.supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")

    total_amount = 0
    purchase_items = []

    for item in data.items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product {item.product_id} not found")
        
        item_total = item.unit_price * item.quantity
        total_amount += item_total
        
        purchase_items.append({
            "product_id": item.product_id,
            "quantity": item.quantity,
            "unit_price": item.unit_price,
            "total_price": item_total,
        })

    try:
        invoice_number = generate_invoice_number(db, "PUR")
        
        purchase = Purchase(
            invoice_number=invoice_number,
            supplier_id=data.supplier_id,
            user_id=current_user.id,
            total_amount=total_amount,
            purchase_date=data.purchase_date or datetime.now(),
            notes=data.notes,
        )
        db.add(purchase)
        db.flush()

        for item_data in purchase_items:
            purchase_item = PurchaseItem(purchase_id=purchase.id, **item_data)
            db.add(purchase_item)

        # Update inventory
        for item_data in purchase_items:
            product = db.query(Product).filter(Product.id == item_data["product_id"]).first()
            previous_stock = product.current_stock
            product.current_stock += item_data["quantity"]
            
            record_stock_change(
                db=db,
                product_id=item_data["product_id"],
                transaction_type="PURCHASE",
                quantity=item_data["quantity"],
                previous_stock=previous_stock,
                reference_id=purchase.id,
                reference_type="purchase",
                user_id=current_user.id,
                notes=f"Purchase {invoice_number}",
            )
            
            check_and_create_alerts(db, product)

        db.commit()
        db.refresh(purchase)

        return {
            "id": purchase.id,
            "invoice_number": purchase.invoice_number,
            "total_amount": purchase.total_amount,
            "message": "Purchase completed successfully",
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Purchase failed: {str(e)}")
