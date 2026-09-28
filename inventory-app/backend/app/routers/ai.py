from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.models import Product
from app.utils.auth import get_current_user
from app.ai.demand_prediction import predict_demand, get_restock_recommendations

router = APIRouter(prefix="/api/ai", tags=["AI Insights"])


@router.get("/demand/{product_id}")
def get_demand_prediction(
    product_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    prediction = predict_demand(db, product_id)
    return prediction


@router.get("/predictions")
def get_all_predictions(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    products = db.query(Product).filter(Product.is_active == True).all()
    predictions = []
    for product in products:
        prediction = predict_demand(db, product.id)
        predictions.append(prediction)
    
    # Sort by urgency (stockout soonest first)
    predictions.sort(key=lambda x: x.get("expected_stockout_date") or "9999-12-31")
    return predictions


@router.get("/recommendations")
def get_restock_recs(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return get_restock_recommendations(db)
