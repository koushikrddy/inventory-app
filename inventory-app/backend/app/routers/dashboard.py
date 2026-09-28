from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from datetime import datetime, timedelta
from app.database.database import get_db
from app.models.models import (
    Product, Sale, SaleItem, Purchase, Category,
    InventoryTransaction, Notification
)
from app.utils.auth import get_current_user
from app.services.inventory_service import get_stock_status, get_fast_moving_products, get_slow_moving_products

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("")
def get_dashboard(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    today = datetime.now().date()
    
    # Basic counts
    total_products = db.query(func.count(Product.id)).filter(Product.is_active == True).scalar() or 0
    
    products = db.query(Product).filter(Product.is_active == True).all()
    total_inventory_value = sum(p.current_stock * p.purchase_price for p in products)
    
    low_stock = sum(1 for p in products if get_stock_status(p) == "low_stock")
    out_of_stock = sum(1 for p in products if get_stock_status(p) == "out_of_stock")
    overstock = sum(1 for p in products if get_stock_status(p) == "overstocked")
    
    # Today's sales
    todays_sales_query = db.query(Sale).filter(func.date(Sale.created_at) == today)
    todays_sales = db.query(func.coalesce(func.sum(Sale.total), 0)).filter(func.date(Sale.created_at) == today).scalar() or 0
    todays_profit = db.query(func.coalesce(func.sum(Sale.profit), 0)).filter(func.date(Sale.created_at) == today).scalar() or 0
    todays_sale_count = todays_sales_query.count()
    
    # Sales trend (last 30 days)
    start_30 = datetime.now() - timedelta(days=30)
    sales_trend = db.query(
        func.date(Sale.created_at).label('date'),
        func.sum(Sale.total).label('revenue'),
        func.count(Sale.id).label('count'),
        func.sum(Sale.profit).label('profit'),
    ).filter(Sale.created_at >= start_30).group_by(func.date(Sale.created_at)).order_by(func.date(Sale.created_at)).all()
    
    sales_trend_data = []
    for row in sales_trend:
        sales_trend_data.append({
            "date": str(row.date),
            "revenue": int(row.revenue or 0),
            "count": int(row.count or 0),
            "profit": int(row.profit or 0),
        })
    
    # Top selling products (last 30 days)
    top_products = db.query(
        Product.id,
        Product.name,
        func.coalesce(func.sum(SaleItem.quantity), 0).label('total_sold'),
        func.coalesce(func.sum(SaleItem.total_price), 0).label('revenue'),
    ).outerjoin(
        SaleItem, and_(
            SaleItem.product_id == Product.id,
            SaleItem.sale_id.in_(
                db.query(Sale.id).filter(Sale.created_at >= start_30)
            )
        )
    ).group_by(Product.id).order_by(func.sum(SaleItem.quantity).desc().nullslast()).limit(5).all()
    
    top_products_data = []
    for tp in top_products:
        top_products_data.append({
            "id": tp.id,
            "name": tp.name,
            "total_sold": int(tp.total_sold),
            "revenue": int(tp.revenue),
        })
    
    # Category-wise sales
    category_sales = db.query(
        Category.name,
        func.coalesce(func.sum(SaleItem.total_price), 0).label('revenue'),
    ).join(
        Product, Product.category_id == Category.id
    ).outerjoin(
        SaleItem, and_(
            SaleItem.product_id == Product.id,
            SaleItem.sale_id.in_(
                db.query(Sale.id).filter(Sale.created_at >= start_30)
            )
        )
    ).group_by(Category.id).all()
    
    category_sales_data = [{"name": cs.name, "revenue": int(cs.revenue)} for cs in category_sales]
    
    # Low stock products
    low_stock_products = [
        {"id": p.id, "name": p.name, "current_stock": p.current_stock, "minimum_stock_level": p.minimum_stock_level, "status": get_stock_status(p)}
        for p in products if get_stock_status(p) in ["low_stock", "out_of_stock"]
    ][:10]
    
    # Fast and slow moving
    fast_moving = get_fast_moving_products(db, 30)
    slow_moving = get_slow_moving_products(db, 30)
    
    # Smart insights
    insights = _generate_insights(db, products, fast_moving, slow_moving)
    
    return {
        "total_products": total_products,
        "total_inventory_value": total_inventory_value,
        "todays_sales": int(todays_sales),
        "todays_profit": int(todays_profit),
        "todays_sale_count": todays_sale_count,
        "low_stock_count": low_stock,
        "out_of_stock_count": out_of_stock,
        "overstock_count": overstock,
        "sales_trend": sales_trend_data,
        "revenue_trend": sales_trend_data,
        "top_products": top_products_data,
        "category_sales": category_sales_data,
        "low_stock_products": low_stock_products,
        "fast_moving_products": fast_moving,
        "slow_moving_products": slow_moving,
        "smart_insights": insights,
    }


def _generate_insights(db, products, fast_moving, slow_moving):
    insights = []
    
    # Low stock insights
    low_products = [p for p in products if get_stock_status(p) == "low_stock"]
    if low_products:
        names = ", ".join(p.name for p in low_products[:3])
        insights.append({
            "type": "warning",
            "title": "Low Stock Alert",
            "message": f"{len(low_products)} products are running low on stock: {names}",
        })
    
    # Out of stock
    oos_products = [p for p in products if get_stock_status(p) == "out_of_stock"]
    if oos_products:
        names = ", ".join(p.name for p in oos_products[:3])
        insights.append({
            "type": "critical",
            "title": "Out of Stock",
            "message": f"{len(oos_products)} products are out of stock: {names}",
        })
    
    # Fast moving
    if fast_moving:
        fastest = fast_moving[0]
        insights.append({
            "type": "success",
            "title": "Fast Moving Product",
            "message": f"{fastest['name']} is your top seller with {fastest['units_sold']} units sold in 30 days.",
        })
    
    # Slow moving
    slow_no_sales = [s for s in slow_moving if s["days_since_last_sale"] > 30]
    if slow_no_sales:
        insights.append({
            "type": "info",
            "title": "Slow Moving Products",
            "message": f"{len(slow_no_sales)} products haven't sold in the last 30 days.",
        })
    
    # Stockout predictions
    for p in products:
        if get_stock_status(p) == "low_stock":
            sales_history = db.query(func.coalesce(func.sum(SaleItem.quantity), 0)).filter(
                SaleItem.product_id == p.id
            ).join(Sale).filter(Sale.created_at >= datetime.now() - timedelta(days=30)).scalar()
            
            if sales_history and sales_history > 0:
                avg_daily = sales_history / 30
                days_left = p.current_stock / avg_daily if avg_daily > 0 else 999
                if days_left < 7:
                    insights.append({
                        "type": "warning",
                        "title": "Restock Needed",
                        "message": f"{p.name} may run out in approximately {int(days_left)} days. Consider restocking.",
                    })
    
    return insights[:10]
