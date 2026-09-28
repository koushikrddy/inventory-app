import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from datetime import datetime, timedelta
import random
from app.database.database import engine, Base, SessionLocal
from app.models.models import (
    User, Category, Supplier, Product, Sale, SaleItem,
    Purchase, PurchaseItem, InventoryTransaction, Notification, Setting
)
from app.utils.auth import get_password_hash


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Check if already seeded
        if db.query(User).count() > 0:
            print("Database already seeded. Checking for missing product images...")
            # Update any products missing image_url
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
            updated = 0
            for product in db.query(Product).all():
                if not product.image_url and product.name in product_images:
                    product.image_url = product_images[product.name]
                    updated += 1
            if updated > 0:
                db.commit()
                print(f"  Updated {updated} products with image URLs.")
            else:
                print("  All products already have images.")
            return

        print("Seeding database...")

        # ============ USERS ============
        admin = User(
            email="admin@store.com",
            username="admin",
            hashed_password=get_password_hash("admin123"),
            full_name="Store Owner",
            role="admin",
        )
        staff = User(
            email="staff@store.com",
            username="staff",
            hashed_password=get_password_hash("staff123"),
            full_name="Raj Kumar",
            role="staff",
        )
        db.add_all([admin, staff])
        db.flush()

        # ============ CATEGORIES ============
        categories_data = [
            ("Grocery", "Rice, Wheat, Dal, Oil, Spices"),
            ("Beverages", "Tea, Coffee, Soft Drinks, Juice"),
            ("Snacks", "Biscuits, Chips, Namkeen, Chocolate"),
            ("Personal Care", "Soap, Shampoo, Toothpaste, Cream"),
            ("Household", "Detergent, Cleaning, Utensils"),
            ("Dairy", "Milk, Butter, Cheese, Curd"),
            ("Bakery", "Bread, Cake, Biscuits"),
            ("Stationery", "Pens, Books, Paper"),
            ("Electronics", "Batteries, Chargers, Cables"),
            ("Frozen Foods", "Ice Cream, Frozen Vegetables"),
        ]
        categories = {}
        for name, desc in categories_data:
            cat = Category(name=name, description=desc)
            db.add(cat)
            db.flush()
            categories[name] = cat

        # ============ SUPPLIERS ============
        suppliers_data = [
            ("HUL Distributors", "Suresh Patel", "9876543210", "suresh@hul.com", "Mumbai, Maharashtra", "Hindustan Unilever Distributors", "27AABCU9603R1ZM"),
            ("ITC Wholesale", "Amit Sharma", "9876543211", "amit@itc.com", "Delhi", "ITC Limited Wholesale", "06AABCI1234F1ZQ"),
            ("Britannia Dealers", "Priya Nair", "9876543212", "priya@britannia.com", "Bangalore, Karnataka", "Britannia Industries Ltd", "29AABCB5678G1ZR"),
            ("Nestle Supply Co", "Vikram Singh", "9876543213", "vikram@nestle.com", "Chennai, Tamil Nadu", "Nestle India Ltd", "33AABCC9012H1ZS"),
            ("Local Grocery Wholesaler", "Mohammed Ali", "9876543214", "ali@localwholesale.com", "Hyderabad, Telangana", "Ali Trading Co", "36AABCD3456I1ZT"),
        ]
        suppliers = {}
        for name, contact, phone, email, address, company, gst in suppliers_data:
            s = Supplier(
                name=name, contact_person=contact, phone=phone,
                email=email, address=address, company_name=company,
                gst_vat_number=gst,
            )
            db.add(s)
            db.flush()
            suppliers[name] = s

        # ============ PRODUCTS ============
        products_data = [
            # Grocery
            ("GR001", "Basmati Rice 5kg", "Grocery", "HUL Distributors", "ITC", 35000, 45000, 80, 20, 200, 50, "kg"),
            ("GR002", "Toor Dal 1kg", "Grocery", "Local Grocery Wholesaler", "Tata", 12000, 16000, 60, 15, 150, 30, "kg"),
            ("GR003", "Sunflower Oil 1L", "Grocery", "HUL Distributors", "Fortune", 11000, 14500, 45, 10, 100, 25, "ltr"),
            ("GR004", "Wheat Flour 5kg", "Grocery", "Local Grocery Wholesaler", "Aashirvaad", 25000, 32000, 70, 20, 200, 40, "kg"),
            ("GR005", "Sugar 1kg", "Grocery", "Local Grocery Wholesaler", "Madhur", 4500, 5500, 100, 30, 300, 60, "kg"),
            ("GR006", "Salt 1kg", "Grocery", "Local Grocery Wholesaler", "Tata", 2000, 2500, 120, 30, 300, 60, "kg"),
            ("GR007", "Turmeric Powder 100g", "Grocery", "Local Grocery Wholesaler", "Everest", 3500, 5000, 50, 10, 100, 20, "pkt"),
            ("GR008", "Red Chili Powder 100g", "Grocery", "Local Grocery Wholesaler", "MDH", 4000, 5500, 40, 10, 100, 20, "pkt"),
            # Beverages
            ("BV001", "Tea Powder 250g", "Beverages", "ITC Wholesale", "Taj Mahal", 8000, 11000, 35, 10, 100, 20, "pkt"),
            ("BV002", "Nescafe Coffee 100g", "Beverages", "Nestle Supply Co", "Nescafe", 12000, 16000, 25, 8, 80, 15, "pkt"),
            ("BV003", "Thums Up 750ml", "Beverages", "Nestle Supply Co", "Coca Cola", 3000, 4000, 40, 10, 100, 20, "btl"),
            ("BV004", "Frooti Mango 200ml", "Beverages", "Nestle Supply Co", "Parle", 800, 1200, 60, 10, 100, 20, "pkt"),
            ("BV005", "Bisleri Water 1L", "Beverages", "Local Grocery Wholesaler", "Bisleri", 1500, 2000, 80, 20, 200, 40, "btl"),
            # Snacks
            ("SN001", "Parle-G Biscuit 100g", "Snacks", "Britannia Dealers", "Parle", 3000, 4000, 70, 15, 150, 30, "pkt"),
            ("SN002", "Lays Chips 52g", "Snacks", "Britannia Dealers", "Lays", 1000, 1500, 55, 10, 100, 20, "pkt"),
            ("SN003", "Haldiram Aloo Bhujia 200g", "Snacks", "Local Grocery Wholesaler", "Haldiram", 6000, 8500, 30, 10, 100, 15, "pkt"),
            ("SN004", "Dairy Milk 40g", "Snacks", "Britannia Dealers", "Cadbury", 2000, 2500, 65, 10, 100, 20, "pcs"),
            ("SN005", "Kurkure 90g", "Snacks", "Britannia Dealers", "PepsiCo", 900, 1200, 50, 10, 100, 20, "pkt"),
            # Personal Care
            ("PC001", "Lifebuoy Soap 100g", "Personal Care", "HUL Distributors", "HUL", 2500, 3500, 90, 20, 200, 40, "pcs"),
            ("PC002", "Head & Shoulders 180ml", "Personal Care", "HUL Distributors", "P&G", 15000, 21000, 20, 8, 80, 10, "btl"),
            ("PC003", "Colgate Toothpaste 150g", "Personal Care", "HUL Distributors", "Colgate", 5500, 7500, 40, 10, 100, 15, "pcs"),
            ("PC004", "Dettol Soap 75g", "Personal Care", "HUL Distributors", "Dettol", 3500, 5000, 55, 15, 150, 25, "pcs"),
            ("PC005", "Vim Liquid 500ml", "Personal Care", "HUL Distributors", "HUL", 6000, 8000, 30, 8, 80, 15, "btl"),
            # Dairy
            ("DA001", "Amul Milk 1L", "Dairy", "Nestle Supply Co", "Amul", 2200, 2800, 25, 15, 100, 30, "ltr"),
            ("DA002", "Amul Butter 100g", "Dairy", "Nestle Supply Co", "Amul", 4500, 5500, 30, 10, 80, 15, "pcs"),
            ("DA003", "Amul Cheese 200g", "Dairy", "Nestle Supply Co", "Amul", 8000, 10000, 15, 5, 50, 10, "pcs"),
            # Household
            ("HH001", "Surf Excel 1kg", "Household", "HUL Distributors", "HUL", 13000, 18000, 35, 10, 100, 15, "pkt"),
            ("HH002", "Harpic 500ml", "Household", "HUL Distributors", "Reckitt", 5000, 7000, 25, 8, 80, 10, "btl"),
            ("HH003", "Vim Dishwash Bar 200g", "Household", "HUL Distributors", "HUL", 1500, 2000, 70, 20, 200, 40, "pcs"),
            # Stationery
            ("ST001", "Ball Pen Pack", "Stationery", "Local Grocery Wholesaler", "Cello", 3000, 4500, 45, 10, 100, 20, "pkt"),
            ("ST002", "A4 Paper 500 sheets", "Stationery", "Local Grocery Wholesaler", "JK Paper", 25000, 32000, 20, 5, 50, 10, "rim"),
            # Frozen
            ("FZ001", "Amul Ice Cream 500ml", "Frozen Foods", "Nestle Supply Co", "Amul", 6000, 9000, 18, 8, 50, 10, "cup"),
            ("FZ002", "Frozen Peas 500g", "Frozen Foods", "Nestle Supply Co", "Safal", 5000, 7000, 22, 8, 60, 12, "pkt"),
        ]

        # Map product names to image URLs
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

        products = {}
        for sku, name, cat_name, sup_name, brand, pp, sp, stock, min_s, max_s, reorder, unit in products_data:
            p = Product(
                sku=sku,
                name=name,
                description=f"Premium quality {name}",
                category_id=categories[cat_name].id,
                brand=brand,
                supplier_id=suppliers[sup_name].id,
                purchase_price=pp,
                selling_price=sp,
                current_stock=stock,
                minimum_stock_level=min_s,
                maximum_stock_level=max_s,
                reorder_quantity=reorder,
                unit=unit,
                barcode=f"890{random.randint(1000000, 9999999)}",
                image_url=product_images.get(name, ""),
            )
            db.add(p)
            db.flush()
            products[sku] = p

        # ============ SALES (Last 60 days) ============
        payment_methods = ["cash", "card", "upi"]
        product_list = list(products.values())

        for day_offset in range(60, 0, -1):
            sale_date = datetime.now() - timedelta(days=day_offset)
            num_sales = random.randint(3, 8)
            
            for _ in range(num_sales):
                num_items = random.randint(1, 5)
                sale_items = random.sample(product_list, min(num_items, len(product_list)))
                
                subtotal = 0
                total_profit = 0
                items_data = []

                for product in sale_items:
                    qty = random.randint(1, min(5, product.current_stock)) if product.current_stock > 0 else 0
                    if qty > 0:
                        item_total = product.selling_price * qty
                        profit = (product.selling_price - product.purchase_price) * qty
                        subtotal += item_total
                        total_profit += profit
                        items_data.append((product, qty, product.selling_price, item_total, profit))

                if not items_data:
                    continue

                discount = random.choice([0, 0, 0, subtotal // 20])
                tax = int(subtotal * 0.18)
                grand_total = subtotal - discount + tax
                final_profit = total_profit - discount

                sale = Sale(
                    invoice_number=f"INV-{sale_date.strftime('%Y%m%d')}-{random.randint(1000, 9999)}",
                    user_id=random.choice([admin.id, staff.id]),
                    subtotal=subtotal,
                    discount=discount,
                    tax=tax,
                    total=grand_total,
                    payment_method=random.choice(payment_methods),
                    profit=final_profit,
                    created_at=sale_date,
                )
                db.add(sale)
                db.flush()

                for product, qty, unit_price, item_total, profit in items_data:
                    sale_item = SaleItem(
                        sale_id=sale.id,
                        product_id=product.id,
                        quantity=qty,
                        unit_price=unit_price,
                        total_price=item_total,
                        profit=profit,
                    )
                    db.add(sale_item)

                    # Reduce stock
                    previous_stock = product.current_stock
                    product.current_stock = max(0, product.current_stock - qty)

                    txn = InventoryTransaction(
                        product_id=product.id,
                        transaction_type="SALE",
                        quantity=qty,
                        previous_stock=previous_stock,
                        new_stock=product.current_stock,
                        reference_id=sale.id,
                        reference_type="sale",
                        user_id=sale.user_id,
                        notes=f"Sale {sale.invoice_number}",
                        created_at=sale_date,
                    )
                    db.add(txn)

        # ============ PURCHASES (Last 30 days) ============
        for day_offset in range(30, 0, -5):
            purchase_date = datetime.now() - timedelta(days=day_offset)
            
            for _ in range(random.randint(1, 3)):
                supplier = random.choice(list(suppliers.values()))
                num_items = random.randint(2, 6)
                purchase_items_data = random.sample(product_list, min(num_items, len(product_list)))
                
                items_data = []
                for product in purchase_items_data:
                    qty = random.randint(10, 50)
                    items_data.append((product, qty, product.purchase_price))

                total_amount = sum(qty * price for _, qty, price in items_data)

                purchase = Purchase(
                    invoice_number=f"PUR-{purchase_date.strftime('%Y%m%d')}-{random.randint(1000, 9999)}",
                    supplier_id=supplier.id,
                    user_id=admin.id,
                    total_amount=total_amount,
                    purchase_date=purchase_date,
                    notes="Regular stock replenishment",
                    created_at=purchase_date,
                )
                db.add(purchase)
                db.flush()

                for product, qty, unit_price in items_data:
                    purchase_item = PurchaseItem(
                        purchase_id=purchase.id,
                        product_id=product.id,
                        quantity=qty,
                        unit_price=unit_price,
                        total_price=qty * unit_price,
                    )
                    db.add(purchase_item)

                    previous_stock = product.current_stock
                    product.current_stock += qty

                    txn = InventoryTransaction(
                        product_id=product.id,
                        transaction_type="PURCHASE",
                        quantity=qty,
                        previous_stock=previous_stock,
                        new_stock=product.current_stock,
                        reference_id=purchase.id,
                        reference_type="purchase",
                        user_id=admin.id,
                        notes=f"Purchase {purchase.invoice_number}",
                        created_at=purchase_date,
                    )
                    db.add(txn)

        # ============ SETTINGS ============
        settings_data = [
            ("store_name", "Smart Retail Store"),
            ("currency", "INR"),
            ("currency_symbol", "₹"),
            ("tax_percentage", "18"),
            ("low_stock_threshold", "10"),
            ("date_format", "YYYY-MM-DD"),
        ]
        for key, value in settings_data:
            db.add(Setting(key=key, value=value))

        # ============ NOTIFICATIONS ============
        for product in product_list:
            from app.services.inventory_service import get_stock_status
            status = get_stock_status(product)
            if status == "low_stock":
                db.add(Notification(
                    user_id=admin.id,
                    title=f"Low Stock: {product.name}",
                    message=f"{product.name} is running low. Current stock: {product.current_stock}, Minimum: {product.minimum_stock_level}.",
                    notification_type="low_stock",
                    priority="warning",
                    related_id=product.id,
                    related_type="product",
                ))
            elif status == "out_of_stock":
                db.add(Notification(
                    user_id=admin.id,
                    title=f"Out of Stock: {product.name}",
                    message=f"{product.name} is completely out of stock.",
                    notification_type="out_of_stock",
                    priority="critical",
                    related_id=product.id,
                    related_type="product",
                ))
            elif status == "overstocked":
                db.add(Notification(
                    user_id=admin.id,
                    title=f"Overstock: {product.name}",
                    message=f"{product.name} is overstocked. Current: {product.current_stock}, Max: {product.maximum_stock_level}.",
                    notification_type="overstock",
                    priority="info",
                    related_id=product.id,
                    related_type="product",
                ))

        db.commit()
        print("✅ Database seeded successfully!")
        print("   Admin: admin@store.com / admin123")
        print("   Staff: staff@store.com / staff123")
        print(f"   Categories: {len(categories)}")
        print(f"   Suppliers: {len(suppliers)}")
        print(f"   Products: {len(products)}")

    except Exception as e:
        db.rollback()
        print(f"❌ Error seeding database: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
