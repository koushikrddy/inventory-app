from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


# ============ AUTH SCHEMAS ============
class UserCreate(BaseModel):
    email: str
    username: str
    password: str
    full_name: str
    role: str = "staff"


class UserLogin(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    full_name: str
    role: str
    is_active: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


class PasswordChange(BaseModel):
    current_password: str
    new_password: str


# ============ CATEGORY SCHEMAS ============
class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class CategoryResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    product_count: int = 0
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ============ SUPPLIER SCHEMAS ============
class SupplierCreate(BaseModel):
    name: str
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    company_name: Optional[str] = None
    gst_vat_number: Optional[str] = None
    notes: Optional[str] = None


class SupplierUpdate(BaseModel):
    name: Optional[str] = None
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    company_name: Optional[str] = None
    gst_vat_number: Optional[str] = None
    notes: Optional[str] = None


class SupplierResponse(BaseModel):
    id: int
    name: str
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    company_name: Optional[str] = None
    gst_vat_number: Optional[str] = None
    notes: Optional[str] = None
    product_count: int = 0
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ============ PRODUCT SCHEMAS ============
class ProductCreate(BaseModel):
    sku: str
    barcode: Optional[str] = None
    name: str
    description: Optional[str] = None
    category_id: Optional[int] = None
    brand: Optional[str] = None
    supplier_id: Optional[int] = None
    purchase_price: int = 0
    selling_price: int = 0
    current_stock: int = 0
    minimum_stock_level: int = 10
    maximum_stock_level: int = 1000
    reorder_quantity: int = 50
    unit: str = "piece"
    expiry_date: Optional[datetime] = None
    image_url: Optional[str] = None


class ProductUpdate(BaseModel):
    sku: Optional[str] = None
    barcode: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    category_id: Optional[int] = None
    brand: Optional[str] = None
    supplier_id: Optional[int] = None
    purchase_price: Optional[int] = None
    selling_price: Optional[int] = None
    current_stock: Optional[int] = None
    minimum_stock_level: Optional[int] = None
    maximum_stock_level: Optional[int] = None
    reorder_quantity: Optional[int] = None
    unit: Optional[str] = None
    expiry_date: Optional[datetime] = None
    image_url: Optional[str] = None
    is_active: Optional[bool] = None


class ProductResponse(BaseModel):
    id: int
    sku: str
    barcode: Optional[str] = None
    name: str
    description: Optional[str] = None
    category_id: Optional[int] = None
    category_name: Optional[str] = None
    brand: Optional[str] = None
    supplier_id: Optional[int] = None
    supplier_name: Optional[str] = None
    purchase_price: int
    selling_price: int
    current_stock: int
    minimum_stock_level: int
    maximum_stock_level: int
    reorder_quantity: int
    unit: str
    expiry_date: Optional[datetime] = None
    image_url: Optional[str] = None
    is_active: bool
    stock_status: str = "in_stock"
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ============ INVENTORY SCHEMAS ============
class StockInRequest(BaseModel):
    product_id: int
    quantity: int
    reference_id: Optional[int] = None
    reference_type: Optional[str] = None
    notes: Optional[str] = None


class StockOutRequest(BaseModel):
    product_id: int
    quantity: int
    reference_id: Optional[int] = None
    reference_type: Optional[str] = None
    notes: Optional[str] = None


class StockAdjustmentRequest(BaseModel):
    product_id: int
    quantity: int
    adjustment_type: str = "adjustment_in"  # adjustment_in or adjustment_out
    notes: Optional[str] = None


class InventoryTransactionResponse(BaseModel):
    id: int
    product_id: int
    product_name: Optional[str] = None
    transaction_type: str
    quantity: int
    previous_stock: int
    new_stock: int
    reference_id: Optional[int] = None
    reference_type: Optional[str] = None
    user_id: int
    user_name: Optional[str] = None
    notes: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ============ SALE SCHEMAS ============
class SaleItemCreate(BaseModel):
    product_id: int
    quantity: int
    unit_price: int


class SaleCreate(BaseModel):
    items: list[SaleItemCreate]
    discount: int = 0
    tax_rate: int = 0  # percentage * 100 (e.g., 1800 for 18%)
    payment_method: str = "cash"
    notes: Optional[str] = None


class SaleItemResponse(BaseModel):
    id: int
    product_id: int
    product_name: Optional[str] = None
    quantity: int
    unit_price: int
    total_price: int
    profit: int

    class Config:
        from_attributes = True


class SaleResponse(BaseModel):
    id: int
    invoice_number: str
    user_id: int
    user_name: Optional[str] = None
    subtotal: int
    discount: int
    tax: int
    total: int
    payment_method: str
    profit: int
    notes: Optional[str] = None
    items: list[SaleItemResponse] = []
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ============ PURCHASE SCHEMAS ============
class PurchaseItemCreate(BaseModel):
    product_id: int
    quantity: int
    unit_price: int


class PurchaseCreate(BaseModel):
    supplier_id: int
    items: list[PurchaseItemCreate]
    purchase_date: Optional[datetime] = None
    notes: Optional[str] = None


class PurchaseItemResponse(BaseModel):
    id: int
    product_id: int
    product_name: Optional[str] = None
    quantity: int
    unit_price: int
    total_price: int

    class Config:
        from_attributes = True


class PurchaseResponse(BaseModel):
    id: int
    invoice_number: str
    supplier_id: int
    supplier_name: Optional[str] = None
    user_id: int
    user_name: Optional[str] = None
    total_amount: int
    purchase_date: datetime
    notes: Optional[str] = None
    items: list[PurchaseItemResponse] = []
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ============ NOTIFICATION SCHEMAS ============
class NotificationResponse(BaseModel):
    id: int
    title: str
    message: str
    notification_type: str
    priority: str
    is_read: bool
    related_id: Optional[int] = None
    related_type: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ============ DASHBOARD SCHEMAS ============
class DashboardResponse(BaseModel):
    total_products: int = 0
    total_inventory_value: int = 0
    todays_sales: int = 0
    todays_profit: int = 0
    low_stock_count: int = 0
    out_of_stock_count: int = 0
    overstock_count: int = 0
    total_sales_today: int = 0
    total_purchases_today: int = 0
    sales_trend: list = []
    revenue_trend: list = []
    top_products: list = []
    category_sales: list = []
    low_stock_products: list = []
    fast_moving_products: list = []
    slow_moving_products: list = []
    smart_insights: list = []


# ============ AI SCHEMAS ============
class DemandPrediction(BaseModel):
    product_id: int
    product_name: str
    current_stock: int
    avg_daily_sales: float
    predicted_7day_demand: float
    predicted_30day_demand: float
    expected_stockout_date: Optional[str] = None
    recommended_reorder_quantity: int
    confidence: str = "low"
    data_quality: str = "insufficient"


class RestockRecommendation(BaseModel):
    product_id: int
    product_name: str
    current_stock: int
    avg_daily_sales: float
    predicted_demand: float
    lead_time_days: int = 2
    safety_stock: int
    recommended_order_quantity: int
    supplier_id: Optional[int] = None
    supplier_name: Optional[str] = None
    urgency: str = "normal"


# ============ REPORT SCHEMAS ============
class ReportRequest(BaseModel):
    report_type: str
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class PaginatedResponse(BaseModel):
    items: list
    total: int
    page: int
    page_size: int
    total_pages: int
