"""Update image_url for all products in the existing database."""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database.database import SessionLocal
from app.models.models import Product

product_images = {
    "Basmati Rice 5kg": "/images/products/basmati-rice.svg",
    "Toor Dal 1kg": "/images/products/toor-dal.svg",
    "Sunflower Oil 1L": "/images/products/sunflower-oil.svg",
    "Wheat Flour 5kg": "/images/products/wheat-flour.svg",
    "Sugar 1kg": "/images/products/sugar.svg",
    "Salt 1kg": "/images/products/salt.svg",
    "Turmeric Powder 100g": "/images/products/turmeric-powder.svg",
    "Red Chili Powder 100g": "/images/products/chili-powder.svg",
    "Tea Powder 250g": "/images/products/tea-powder.svg",
    "Nescafe Coffee 100g": "/images/products/coffee.svg",
    "Thums Up 750ml": "/images/products/thums-up.svg",
    "Frooti Mango 200ml": "/images/products/frooti.svg",
    "Bisleri Water 1L": "/images/products/bisleri-water.svg",
    "Parle-G Biscuit 100g": "/images/products/parle-g.svg",
    "Lays Chips 52g": "/images/products/lays-chips.svg",
    "Haldiram Aloo Bhujia 200g": "/images/products/haldiram-bhujia.svg",
    "Dairy Milk 40g": "/images/products/dairy-milk.svg",
    "Kurkure 90g": "/images/products/kurkure.svg",
    "Lifebuoy Soap 100g": "/images/products/lifebuoy-soap.svg",
    "Head & Shoulders 180ml": "/images/products/head-shoulders.svg",
    "Colgate Toothpaste 150g": "/images/products/colgate.svg",
    "Dettol Soap 75g": "/images/products/dettol-soap.svg",
    "Vim Liquid 500ml": "/images/products/vim-liquid.svg",
    "Amul Milk 1L": "/images/products/amul-milk.svg",
    "Amul Butter 100g": "/images/products/amul-butter.svg",
    "Amul Cheese 200g": "/images/products/amul-cheese.svg",
    "Surf Excel 1kg": "/images/products/surf-excel.svg",
    "Harpic 500ml": "/images/products/harpic.svg",
    "Vim Dishwash Bar 200g": "/images/products/vim-dishwash-bar.svg",
    "Ball Pen Pack": "/images/products/ball-pen.svg",
    "A4 Paper 500 sheets": "/images/products/a4-paper.svg",
    "Amul Ice Cream 500ml": "/images/products/amul-icecream.svg",
    "Frozen Peas 500g": "/images/products/frozen-peas.svg",
}

db = SessionLocal()
try:
    products = db.query(Product).all()
    updated = 0
    for product in products:
        image_url = product_images.get(product.name, "")
        if image_url:
            product.image_url = image_url
            updated += 1
            print(f"  {product.name} -> {image_url}")
    db.commit()
    print(f"\nUpdated {updated}/{len(products)} products with image URLs.")
except Exception as e:
    db.rollback()
    print(f"Error: {e}")
finally:
    db.close()
