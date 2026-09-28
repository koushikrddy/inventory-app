from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.database.database import get_db
from app.models.models import Product, InventoryTransaction, User
from app.schemas.schemas import StockInRequest, StockOutRequest, StockAdjustmentRequest
from app.utils.auth import get_current_user, require_admin_or_staff
from app.services.inventory_service import record_stock_change, check_and_create_alerts

router = APIRouter(prefix="/api/inventory", tags=["Inventory"])


@router.get("/transactions")
def list_transactions(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    product_id: Optional[int] = None,
    transaction_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    query = db.query(InventoryTransaction)
    
    if product_id:
        query = query.filter(InventoryTransaction.product_id == product_id)
    if transaction_type:
        query = query.filter(InventoryTransaction.transaction_type == transaction_type)
    
    total = query.count()
    transactions = query.order_by(InventoryTransaction.created_at.desc()).offset(
        (page - 1) * page_size
    ).limit(page_size).all()
    
    result = []
    for t in transactions:
        product = db.query(Product).filter(Product.id == t.product_id).first()
        user = db.query(User).filter(User.id == t.user_id).first()
        result.append({
            "id": t.id,
            "product_id": t.product_id,
            "product_name": product.name if product else None,
            "transaction_type": t.transaction_type,
            "quantity": t.quantity,
            "previous_stock": t.previous_stock,
            "new_stock": t.new_stock,
            "reference_id": t.reference_id,
            "reference_type": t.reference_type,
            "user_id": t.user_id,
            "user_name": user.full_name if user else None,
            "notes": t.notes,
            "created_at": t.created_at.isoformat() if t.created_at else None,
        })
    
    return {
        "items": result,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size,
    }


@router.post("/stock-in")
def stock_in(
    data: StockInRequest,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin_or_staff),
):
    product = db.query(Product).filter(Product.id == data.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    previous_stock = product.current_stock
    product.current_stock += data.quantity
    
    new_stock = record_stock_change(
        db=db,
        product_id=data.product_id,
        transaction_type="PURCHASE",
        quantity=data.quantity,
        previous_stock=previous_stock,
        reference_id=data.reference_id,
        reference_type=data.reference_type,
        user_id=current_user.id,
        notes=data.notes or "Stock In",
    )
    
    product.current_stock = new_stock
    check_and_create_alerts(db, product)
    db.commit()
    
    return {"message": "Stock added successfully", "new_stock": new_stock}


@router.post("/stock-out")
def stock_out(
    data: StockOutRequest,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin_or_staff),
):
    product = db.query(Product).filter(Product.id == data.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if product.current_stock < data.quantity:
        raise HTTPException(status_code=400, detail="Insufficient stock")
    
    previous_stock = product.current_stock
    product.current_stock -= data.quantity
    
    new_stock = record_stock_change(
        db=db,
        product_id=data.product_id,
        transaction_type="SALE",
        quantity=data.quantity,
        previous_stock=previous_stock,
        reference_id=data.reference_id,
        reference_type=data.reference_type,
        user_id=current_user.id,
        notes=data.notes or "Stock Out",
    )
    
    product.current_stock = new_stock
    check_and_create_alerts(db, product)
    db.commit()
    
    return {"message": "Stock removed successfully", "new_stock": new_stock}


@router.post("/adjustment")
def stock_adjustment(
    data: StockAdjustmentRequest,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin_or_staff),
):
    product = db.query(Product).filter(Product.id == data.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    previous_stock = product.current_stock
    
    if data.adjustment_type == "adjustment_in":
        product.current_stock += data.quantity
        txn_type = "ADJUSTMENT_IN"
    elif data.adjustment_type == "adjustment_out":
        if product.current_stock < data.quantity:
            raise HTTPException(status_code=400, detail="Insufficient stock for adjustment")
        product.current_stock -= data.quantity
        txn_type = "ADJUSTMENT_OUT"
    else:
        raise HTTPException(status_code=400, detail="Invalid adjustment type")
    
    new_stock = record_stock_change(
        db=db,
        product_id=data.product_id,
        transaction_type=txn_type,
        quantity=data.quantity,
        previous_stock=previous_stock,
        user_id=current_user.id,
        notes=data.notes or f"Stock {data.adjustment_type.replace('_', ' ').title()}",
    )
    
    product.current_stock = new_stock
    check_and_create_alerts(db, product)
    db.commit()
    
    return {"message": "Stock adjusted successfully", "new_stock": new_stock}
