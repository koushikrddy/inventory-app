from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import Optional
from datetime import datetime, timedelta
from app.database.database import get_db
from app.models.models import (
    Product, Sale, SaleItem, Purchase, PurchaseItem,
    Category, Supplier, InventoryTransaction
)
from app.utils.auth import get_current_user
from app.services.inventory_service import get_stock_status, get_fast_moving_products, get_slow_moving_products

router = APIRouter(prefix="/api/reports", tags=["Reports"])


@router.get("/sales")
def sales_report(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    period: Optional[str] = "daily",
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    start = datetime.strptime(start_date, "%Y-%m-%d") if start_date else datetime.now() - timedelta(days=30)
    end = datetime.strptime(end_date, "%Y-%m-%d") if end_date else datetime.now()
    
    sales = db.query(Sale).filter(
        Sale.created_at >= start,
        Sale.created_at <= end + timedelta(days=1)
    ).all()
    
    total_revenue = sum(s.total for s in sales)
    total_profit = sum(s.profit for s in sales)
    total_discount = sum(s.discount for s in sales)
    total_tax = sum(s.tax for s in sales)
    total_count = len(sales)
    
    # Daily breakdown
    daily_data = {}
    for sale in sales:
        day = sale.created_at.strftime("%Y-%m-%d")
        if day not in daily_data:
            daily_data[day] = {"date": day, "revenue": 0, "profit": 0, "count": 0}
        daily_data[day]["revenue"] += sale.total
        daily_data[day]["profit"] += sale.profit
        daily_data[day]["count"] += 1
    
    return {
        "summary": {
            "total_revenue": total_revenue,
            "total_profit": total_profit,
            "total_discount": total_discount,
            "total_tax": total_tax,
            "total_count": total_count,
            "start_date": start.strftime("%Y-%m-%d"),
            "end_date": end.strftime("%Y-%m-%d"),
        },
        "daily_data": sorted(daily_data.values(), key=lambda x: x["date"]),
    }


@router.get("/inventory")
def inventory_report(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    products = db.query(Product).filter(Product.is_active == True).all()
    
    total_value = sum(p.current_stock * p.purchase_price for p in products)
    total_retail_value = sum(p.current_stock * p.selling_price for p in products)
    total_items = sum(p.current_stock for p in products)
    
    status_breakdown = {"in_stock": 0, "low_stock": 0, "out_of_stock": 0, "overstocked": 0}
    category_values = {}
    
    for p in products:
        status = get_stock_status(p)
        status_breakdown[status] = status_breakdown.get(status, 0) + 1
        
        cat_name = p.category.name if p.category else "Uncategorized"
        if cat_name not in category_values:
            category_values[cat_name] = {"name": cat_name, "value": 0, "count": 0}
        category_values[cat_name]["value"] += p.current_stock * p.purchase_price
        category_values[cat_name]["count"] += p.current_stock
    
    return {
        "summary": {
            "total_value": total_value,
            "total_retail_value": total_retail_value,
            "total_items": total_items,
            "total_products": len(products),
            "potential_profit": total_retail_value - total_value,
        },
        "status_breakdown": status_breakdown,
        "category_values": list(category_values.values()),
    }


@router.get("/products/fast-moving")
def fast_moving_report(
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return get_fast_moving_products(db, days)


@router.get("/products/slow-moving")
def slow_moving_report(
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return get_slow_moving_products(db, days)


@router.get("/purchases")
def purchase_report(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    start = datetime.strptime(start_date, "%Y-%m-%d") if start_date else datetime.now() - timedelta(days=30)
    end = datetime.strptime(end_date, "%Y-%m-%d") if end_date else datetime.now()
    
    purchases = db.query(Purchase).filter(
        Purchase.purchase_date >= start,
        Purchase.purchase_date <= end + timedelta(days=1)
    ).all()
    
    total_amount = sum(p.total_amount for p in purchases)
    
    return {
        "summary": {
            "total_purchases": len(purchases),
            "total_amount": total_amount,
            "start_date": start.strftime("%Y-%m-%d"),
            "end_date": end.strftime("%Y-%m-%d"),
        },
        "purchases": [
            {
                "id": p.id,
                "invoice_number": p.invoice_number,
                "total_amount": p.total_amount,
                "purchase_date": p.purchase_date.isoformat() if p.purchase_date else None,
            }
            for p in purchases
        ],
    }


@router.get("/suppliers")
def supplier_report(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    suppliers = db.query(Supplier).all()
    result = []
    for s in suppliers:
        product_count = db.query(func.count(Product.id)).filter(Product.supplier_id == s.id).scalar()
        total_purchases = db.query(func.coalesce(func.sum(Purchase.total_amount), 0)).filter(Purchase.supplier_id == s.id).scalar()
        result.append({
            "id": s.id,
            "name": s.name,
            "product_count": product_count,
            "total_purchases": int(total_purchases),
        })
    return result
