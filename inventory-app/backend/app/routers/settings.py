from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.models import Setting, User
from app.utils.auth import get_current_user, require_admin

router = APIRouter(prefix="/api/settings", tags=["Settings"])


@router.get("")
def get_settings(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    settings = db.query(Setting).all()
    result = {s.key: s.value for s in settings}
    
    # Defaults
    if "store_name" not in result:
        result["store_name"] = "My Store"
    if "currency" not in result:
        result["currency"] = "INR"
    if "currency_symbol" not in result:
        result["currency_symbol"] = "₹"
    if "tax_percentage" not in result:
        result["tax_percentage"] = "18"
    if "low_stock_threshold" not in result:
        result["low_stock_threshold"] = "10"
    if "date_format" not in result:
        result["date_format"] = "YYYY-MM-DD"
    
    return result


@router.put("")
def update_settings(
    settings_data: dict,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    for key, value in settings_data.items():
        setting = db.query(Setting).filter(Setting.key == key).first()
        if setting:
            setting.value = str(value)
        else:
            setting = Setting(key=key, value=str(value))
            db.add(setting)
    
    db.commit()
    return {"message": "Settings updated successfully"}


@router.get("/users")
def list_users(
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    users = db.query(User).all()
    return [
        {
            "id": u.id,
            "email": u.email,
            "username": u.username,
            "full_name": u.full_name,
            "role": u.role,
            "is_active": u.is_active,
            "created_at": u.created_at.isoformat() if u.created_at else None,
        }
        for u in users
    ]


@router.put("/users/{user_id}/toggle-active")
def toggle_user_active(
    user_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot deactivate yourself")
    
    user.is_active = not user.is_active
    db.commit()
    return {"message": f"User {'activated' if user.is_active else 'deactivated'} successfully"}


@router.get("/store")
def get_store_info(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    settings = db.query(Setting).all()
    result = {s.key: s.value for s in settings}
    return {
        "store_name": result.get("store_name", "My Store"),
        "currency": result.get("currency", "INR"),
        "currency_symbol": result.get("currency_symbol", "₹"),
        "tax_percentage": result.get("tax_percentage", "18"),
    }
