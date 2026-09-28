from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.config import settings
from app.database.database import engine, Base
from app.routers import auth, products, categories, suppliers, inventory, sales, purchases, dashboard, ai, notifications, reports, settings as settings_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Smart Inventory Management System for Small Retail Stores",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router)
app.include_router(products.router)
app.include_router(categories.router)
app.include_router(suppliers.router)
app.include_router(inventory.router)
app.include_router(sales.router)
app.include_router(purchases.router)
app.include_router(dashboard.router)
app.include_router(ai.router)
app.include_router(notifications.router)
app.include_router(reports.router)
app.include_router(settings_router.router)


@app.get("/")
def root():
    return {
        "message": "Smart Inventory Management System API",
        "version": settings.APP_VERSION,
        "docs": "/docs",
    }


@app.get("/api/health")
def health_check():
    return {"status": "healthy"}
