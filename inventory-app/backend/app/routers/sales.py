from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
from app.database.database import get_db
from app.models.models import Product, Sale, SaleItem, InventoryTransaction
from app.schemas.schemas import SaleCreate
from app.utils.auth import get_current_user, require_admin_or_staff
from app.services.inventory_service import record_stock_change, check_and_create_alerts, generate_invoice_number

router = APIRouter(prefix="/api/sales", tags=["Sales"])


@router.get("")
def list_sales(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    query = db.query(Sale)
    
    if search:
        query = query.filter(Sale.invoice_number.ilike(f"%{search}%"))
    
    if start_date:
        query = query.filter(Sale.created_at >= start_date)
    if end_date:
        query = query.filter(Sale.created_at <= end_date + " 23:59:59")
    
    total = query.count()
    sales = query.order_by(Sale.created_at.desc()).offset(
        (page - 1) * page_size
    ).limit(page_size).all()
    
    result = []
    for sale in sales:
        from app.models.models import User
        user = db.query(User).filter(User.id == sale.user_id).first()
        items = db.query(SaleItem).filter(SaleItem.sale_id == sale.id).all()
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
                "profit": item.profit,
            })
        
        result.append({
            "id": sale.id,
            "invoice_number": sale.invoice_number,
            "user_id": sale.user_id,
            "user_name": user.full_name if user else None,
            "subtotal": sale.subtotal,
            "discount": sale.discount,
            "tax": sale.tax,
            "total": sale.total,
            "payment_method": sale.payment_method,
            "profit": sale.profit,
            "notes": sale.notes,
            "items": items_data,
            "created_at": sale.created_at.isoformat() if sale.created_at else None,
        })
    
    return {
        "items": result,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size,
    }


@router.get("/{sale_id}")
def get_sale(sale_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    sale = db.query(Sale).filter(Sale.id == sale_id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    
    from app.models.models import User
    user = db.query(User).filter(User.id == sale.user_id).first()
    items = db.query(SaleItem).filter(SaleItem.sale_id == sale.id).all()
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
            "profit": item.profit,
        })
    
    return {
        "id": sale.id,
        "invoice_number": sale.invoice_number,
        "user_id": sale.user_id,
        "user_name": user.full_name if user else None,
        "subtotal": sale.subtotal,
        "discount": sale.discount,
        "tax": sale.tax,
        "total": sale.total,
        "payment_method": sale.payment_method,
        "profit": sale.profit,
        "notes": sale.notes,
        "items": items_data,
        "created_at": sale.created_at.isoformat() if sale.created_at else None,
    }


@router.post("", status_code=201)
def create_sale(
    data: SaleCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin_or_staff),
):
    if not data.items:
        raise HTTPException(status_code=400, detail="Sale must have at least one item")

    subtotal = 0
    total_profit = 0
    sale_items = []

    for item in data.items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product {item.product_id} not found")
        if product.current_stock < item.quantity:
            raise HTTPException(status_code=400, detail=f"Insufficient stock for {product.name}. Available: {product.current_stock}")
        
        item_total = item.unit_price * item.quantity
        profit = (item.unit_price - product.purchase_price) * item.quantity
        subtotal += item_total
        total_profit += profit
        
        sale_items.append({
            "product_id": item.product_id,
            "quantity": item.quantity,
            "unit_price": item.unit_price,
            "total_price": item_total,
            "profit": profit,
        })

    tax = int(subtotal * (data.tax_rate / 10000)) if data.tax_rate else 0
    discount = data.discount
    grand_total = subtotal - discount + tax
    final_profit = total_profit - discount

    try:
        invoice_number = generate_invoice_number(db, "INV")
        
        sale = Sale(
            invoice_number=invoice_number,
            user_id=current_user.id,
            subtotal=subtotal,
            discount=discount,
            tax=tax,
            total=grand_total,
            payment_method=data.payment_method,
            profit=final_profit,
            notes=data.notes,
        )
        db.add(sale)
        db.flush()

        for item_data in sale_items:
            sale_item = SaleItem(sale_id=sale.id, **item_data)
            db.add(sale_item)

        # Update inventory
        for item_data in sale_items:
            product = db.query(Product).filter(Product.id == item_data["product_id"]).first()
            previous_stock = product.current_stock
            product.current_stock -= item_data["quantity"]
            
            record_stock_change(
                db=db,
                product_id=item_data["product_id"],
                transaction_type="SALE",
                quantity=item_data["quantity"],
                previous_stock=previous_stock,
                reference_id=sale.id,
                reference_type="sale",
                user_id=current_user.id,
                notes=f"Sale {invoice_number}",
            )
            
            check_and_create_alerts(db, product)

        db.commit()
        db.refresh(sale)

        return {
            "id": sale.id,
            "invoice_number": sale.invoice_number,
            "subtotal": sale.subtotal,
            "discount": sale.discount,
            "tax": sale.tax,
            "total": sale.total,
            "payment_method": sale.payment_method,
            "profit": sale.profit,
            "message": "Sale completed successfully",
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Sale failed: {str(e)}")


@router.get("/search/product")
def search_product_for_sale(
    q: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    search_term = f"%{q}%"
    products = db.query(Product).filter(
        Product.is_active == True,
        (
            Product.name.ilike(search_term) |
            Product.sku.ilike(search_term) |
            Product.barcode.ilike(search_term)
        )
    ).limit(20).all()
    
    return [
        {
            "id": p.id,
            "name": p.name,
            "sku": p.sku,
            "barcode": p.barcode,
            "selling_price": p.selling_price,
            "current_stock": p.current_stock,
            "unit": p.unit,
            "image_url": p.image_url,
        }
        for p in products
    ]
