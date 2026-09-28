from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, extract
from datetime import datetime, timedelta
from typing import Optional
from app.models.models import (
    Product, Sale, SaleItem, Purchase, PurchaseItem,
    InventoryTransaction, Notification, User, Category, Supplier
)


def get_stock_status(product: Product) -> str:
    if product.current_stock <= 0:
        return "out_of_stock"
    elif product.current_stock <= product.minimum_stock_level:
        return "low_stock"
    elif product.current_stock > product.maximum_stock_level:
        return "overstocked"
    return "in_stock"


def check_and_create_alerts(db: Session, product: Product):
    # Remove existing active alerts for this product
    db.query(Notification).filter(
        Notification.related_id == product.id,
        Notification.related_type == "product",
        Notification.is_read == False
    ).delete()

    if product.current_stock <= 0:
        notification = Notification(
            user_id=1,
            title=f"Out of Stock: {product.name}",
            message=f"{product.name} is completely out of stock. Current stock: {product.current_stock}.",
            notification_type="out_of_stock",
            priority="critical",
            related_id=product.id,
            related_type="product",
        )
        db.add(notification)
    elif product.current_stock <= product.minimum_stock_level:
        notification = Notification(
            user_id=1,
            title=f"Low Stock: {product.name}",
            message=f"{product.name} is running low. Current stock: {product.current_stock}, Minimum: {product.minimum_stock_level}.",
            notification_type="low_stock",
            priority="warning",
            related_id=product.id,
            related_type="product",
        )
        db.add(notification)

    if product.current_stock > product.maximum_stock_level:
        excess = product.current_stock - product.maximum_stock_level
        excess_value = excess * product.purchase_price
        notification = Notification(
            user_id=1,
            title=f"Overstock: {product.name}",
            message=f"{product.name} is overstocked. Current: {product.current_stock}, Max: {product.maximum_stock_level}. Excess: {excess} units worth ₹{excess_value // 100}.",
            notification_type="overstock",
            priority="info",
            related_id=product.id,
            related_type="product",
        )
        db.add(notification)

    db.flush()


def record_stock_change(
    db: Session,
    product_id: int,
    transaction_type: str,
    quantity: int,
    previous_stock: int,
    reference_id: Optional[int] = None,
    reference_type: Optional[str] = None,
    user_id: int = 1,
    notes: Optional[str] = None,
):
    new_stock = previous_stock + quantity if transaction_type in ["PURCHASE", "ADJUSTMENT_IN", "RETURN"] \
        else previous_stock - quantity

    inventory_txn = InventoryTransaction(
        product_id=product_id,
        transaction_type=transaction_type,
        quantity=quantity,
        previous_stock=previous_stock,
        new_stock=new_stock,
        reference_id=reference_id,
        reference_type=reference_type,
        user_id=user_id,
        notes=notes,
    )
    db.add(inventory_txn)
    return new_stock


def generate_invoice_number(db: Session, prefix: str = "INV") -> str:
    today = datetime.now()
    date_str = today.strftime("%Y%m%d")
    # Find the highest existing invoice number for today
    last_sale = db.query(Sale).filter(
        Sale.invoice_number.like(f"{prefix}-{date_str}-%")
    ).order_by(Sale.invoice_number.desc()).first()
    if last_sale:
        # Extract the sequence number from the last invoice
        try:
            last_num = int(last_sale.invoice_number.split("-")[-1])
            return f"{prefix}-{date_str}-{last_num + 1:04d}"
        except (ValueError, IndexError):
            pass
    return f"{prefix}-{date_str}-0001"


def calculate_sales_metrics(db: Session, days: int = 30):
    start_date = datetime.now() - timedelta(days=days)
    
    sales_data = db.query(
        func.date(Sale.created_at).label('date'),
        func.sum(Sale.total).label('revenue'),
        func.count(Sale.id).label('count'),
        func.sum(Sale.profit).label('profit'),
    ).filter(
        Sale.created_at >= start_date
    ).group_by(
        func.date(Sale.created_at)
    ).order_by(
        func.date(Sale.created_at)
    ).all()

    return sales_data


def get_fast_moving_products(db: Session, days: int = 30):
    start_date = datetime.now() - timedelta(days=days)

    results = db.query(
        Product.id,
        Product.name,
        Product.current_stock,
        Product.selling_price,
        Product.purchase_price,
        func.coalesce(func.sum(SaleItem.quantity), 0).label('total_sold'),
        func.coalesce(func.sum(SaleItem.total_price), 0).label('revenue'),
    ).outerjoin(
        SaleItem, and_(
            SaleItem.product_id == Product.id,
            SaleItem.sale_id.in_(
                db.query(Sale.id).filter(Sale.created_at >= start_date)
            )
        )
    ).group_by(Product.id).order_by(func.sum(SaleItem.quantity).desc().nullslast()).all()

    fast_moving = []
    for r in results:
        if r.total_sold > 0:
            avg_daily = r.total_sold / days
            days_until_stockout = r.current_stock / avg_daily if avg_daily > 0 else float('inf')
            fast_moving.append({
                "id": r.id,
                "name": r.name,
                "current_stock": r.current_stock,
                "units_sold": int(r.total_sold),
                "revenue": int(r.revenue),
                "avg_daily_sales": round(avg_daily, 2),
                "avg_weekly_sales": round(avg_daily * 7, 2),
                "days_until_stockout": round(days_until_stockout, 1) if days_until_stockout != float('inf') else None,
                "selling_price": r.selling_price,
            })

    return fast_moving[:10]


def get_slow_moving_products(db: Session, days: int = 30):
    start_date = datetime.now() - timedelta(days=days)

    products = db.query(Product).filter(Product.is_active == True).all()
    slow_moving = []

    for product in products:
        last_sale = db.query(SaleItem).filter(
            SaleItem.product_id == product.id
        ).join(Sale).order_by(Sale.created_at.desc()).first()

        total_sold = db.query(func.coalesce(func.sum(SaleItem.quantity), 0)).filter(
            SaleItem.product_id == product.id
        ).join(Sale).filter(Sale.created_at >= start_date).scalar()

        last_sale_date = last_sale.sale.created_at if last_sale else None
        days_since_last_sale = (datetime.now() - last_sale_date).days if last_sale_date else 999

        if total_sold == 0 or days_since_last_sale > 15:
            slow_moving.append({
                "id": product.id,
                "name": product.name,
                "current_stock": product.current_stock,
                "units_sold": int(total_sold),
                "last_sale_date": last_sale_date.isoformat() if last_sale_date else None,
                "days_since_last_sale": days_since_last_sale,
                "inventory_value": product.current_stock * product.purchase_price,
            })

    slow_moving.sort(key=lambda x: x["days_since_last_sale"], reverse=True)
    return slow_moving[:10]
