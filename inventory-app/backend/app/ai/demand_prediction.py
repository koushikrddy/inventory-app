import numpy as np
from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from app.models.models import Product, Sale, SaleItem


def predict_demand(db: Session, product_id: int) -> dict:
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        return {"error": "Product not found"}

    # Get sales history for the last 90 days
    start_date = datetime.now() - timedelta(days=90)
    
    sales_data = db.query(
        func.date(Sale.created_at).label('sale_date'),
        func.sum(SaleItem.quantity).label('quantity')
    ).join(
        SaleItem, SaleItem.sale_id == Sale.id
    ).filter(
        SaleItem.product_id == product_id,
        Sale.created_at >= start_date
    ).group_by(
        func.date(Sale.created_at)
    ).order_by(
        func.date(Sale.created_at)
    ).all()

    if not sales_data:
        return _fallback_prediction(product)

    quantities = [int(row.quantity) for row in sales_data]
    dates = [row.sale_date for row in sales_data]
    
    avg_daily_sales = sum(quantities) / len(quantities) if quantities else 0
    
    # Simple moving average prediction
    if len(quantities) >= 7:
        recent_avg = sum(quantities[-7:]) / 7
        predicted_7day = recent_avg * 7
        predicted_30day = recent_avg * 30
        confidence = "medium"
        data_quality = "sufficient"
    elif len(quantities) >= 3:
        recent_avg = sum(quantities) / len(quantities)
        predicted_7day = recent_avg * 7
        predicted_30day = recent_avg * 30
        confidence = "low"
        data_quality = "limited"
    else:
        return _fallback_prediction(product)

    # Calculate expected stockout
    days_until_stockout = None
    if avg_daily_sales > 0:
        days_until_stockout = product.current_stock / avg_daily_sales
    
    # Recommended reorder quantity (cover 30 days + safety stock)
    safety_stock = max(int(avg_daily_sales * 7), product.minimum_stock_level)
    recommended_reorder = max(int(predicted_30day + safety_stock - product.current_stock), 0)

    stockout_date = None
    if days_until_stockout and days_until_stockout < 365:
        stockout_dt = datetime.now() + timedelta(days=int(days_until_stockout))
        stockout_date = stockout_dt.strftime("%Y-%m-%d")

    return {
        "product_id": product.id,
        "product_name": product.name,
        "current_stock": product.current_stock,
        "avg_daily_sales": round(avg_daily_sales, 2),
        "predicted_7day_demand": round(predicted_7day, 1),
        "predicted_30day_demand": round(predicted_30day, 1),
        "expected_stockout_date": stockout_date,
        "recommended_reorder_quantity": recommended_reorder,
        "confidence": confidence,
        "data_quality": data_quality,
        "data_points": len(quantities),
        "trend": "stable",
    }


def _fallback_prediction(product: Product) -> dict:
    """Fallback when insufficient historical data exists."""
    return {
        "product_id": product.id,
        "product_name": product.name,
        "current_stock": product.current_stock,
        "avg_daily_sales": 0,
        "predicted_7day_demand": 0,
        "predicted_30day_demand": 0,
        "expected_stockout_date": None,
        "recommended_reorder_quantity": product.reorder_quantity,
        "confidence": "none",
        "data_quality": "insufficient",
        "data_points": 0,
        "trend": "unknown",
        "message": "Insufficient sales history for prediction. Using default reorder quantity.",
    }


def get_restock_recommendations(db: Session) -> list:
    products = db.query(Product).filter(Product.is_active == True).all()
    recommendations = []

    for product in products:
        prediction = predict_demand(db, product.id)

        avg_daily = prediction.get("avg_daily_sales", 0)
        lead_time = 2
        safety_stock = max(int(avg_daily * lead_time), product.minimum_stock_level)

        if product.current_stock <= safety_stock or product.current_stock <= product.minimum_stock_level:
            predicted_demand = prediction.get("predicted_30day_demand", product.reorder_quantity)
            recommended_qty = max(int(predicted_demand + safety_stock - product.current_stock), product.reorder_quantity)

            # Determine urgency
            if product.current_stock <= 0:
                urgency = "critical"
            elif product.current_stock <= product.minimum_stock_level:
                urgency = "high"
            elif product.current_stock <= safety_stock:
                urgency = "normal"
            else:
                urgency = "low"

            supplier = None
            if product.supplier_id:
                from app.models.models import Supplier
                supplier = db.query(Supplier).filter(Supplier.id == product.supplier_id).first()

            recommendations.append({
                "product_id": product.id,
                "product_name": product.name,
                "current_stock": product.current_stock,
                "avg_daily_sales": avg_daily,
                "predicted_demand": predicted_demand,
                "lead_time_days": lead_time,
                "safety_stock": safety_stock,
                "recommended_order_quantity": recommended_qty,
                "supplier_id": product.supplier_id,
                "supplier_name": supplier.name if supplier else None,
                "urgency": urgency,
                "confidence": prediction.get("confidence", "none"),
            })

    recommendations.sort(key=lambda x: {"critical": 0, "high": 1, "normal": 2, "low": 3}[x["urgency"]])
    return recommendations
