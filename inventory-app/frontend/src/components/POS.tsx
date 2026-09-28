import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Plus, Minus, Trash2, ShoppingCart, Check, Package, AlertTriangle, CreditCard, Banknote, Smartphone, X, Layers, Zap, ScanBarcode } from 'lucide-react';
import api from '../api/axios';
import { formatCurrencyRaw } from '../utils/format';
import toast from 'react-hot-toast';
import ReceiptPrinter from './ReceiptPrinter';

interface CartItem {
  id: number;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  stock: number;
  unit: string;
  category?: string;
}

interface Product {
  id: number;
  name: string;
  sku: string;
  selling_price: number;
  current_stock: number;
  unit: string;
  category_name?: string;
  image_url?: string;
}

interface SaleResult {
  invoice_number: string;
  total: number;
  items: { name: string; quantity: number; unit_price: number; total_price: number }[];
  payment_method: string;
  date: string;
}

const POS: React.FC = () => {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [processing, setProcessing] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [saleResult, setSaleResult] = useState<SaleResult | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [scanning, setScanning] = useState<number | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Load all products
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const [prodRes, catRes] = await Promise.all([
          api.get('/products?page_size=100&sort_by=name&sort_order=asc'),
          api.get('/categories'),
        ]);
        const active = prodRes.data.items.filter((p: any) => p.is_active);
        setAllProducts(active);
        const cats = ['All', ...catRes.data.map((c: any) => c.name)];
        setCategories(cats);
      } catch (e) {
        console.error('Failed to load products:', e);
      }
    };
    loadProducts();
  }, []);

  // Filter products
  const filteredProducts = allProducts.filter(p => {
    const matchesSearch = !search.trim() ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category_name === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const addToCart = useCallback((product: Product) => {
    if (product.current_stock <= 0) {
      toast.error(`${product.name} is out of stock!`);
      return;
    }

    // Scanner animation
    setScanning(product.id);
    setTimeout(() => setScanning(null), 300);

    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.current_stock) {
          toast.error(`Only ${product.current_stock} ${product.unit} available!`);
          return prev;
        }
        return prev.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, {
        id: product.id,
        name: product.name,
        sku: product.sku,
        price: product.selling_price,
        quantity: 1,
        stock: product.current_stock,
        unit: product.unit,
        category: product.category_name,
      }];
    });

    // Beep toast
    toast.success(`✓ ${product.name}`, { duration: 1000, icon: '🔊' });
  }, []);

  const updateQuantity = (id: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id !== id) return item;
      const newQty = item.quantity + delta;
      if (newQty <= 0) {
        return { ...item, quantity: 0 };
      }
      if (newQty > item.stock) {
        toast.error(`Only ${item.stock} ${item.unit} available!`);
        return item;
      }
      return { ...item, quantity: newQty };
    }));
  };

  const removeFromCart = (id: number) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const clearCart = () => setCart([]);

  // Remove items with 0 quantity
  const activeCart = cart.filter(item => item.quantity > 0);

  const subtotal = activeCart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalItems = activeCart.reduce((sum, item) => sum + item.quantity, 0);
  const itemCount = activeCart.length;

  const handlePurchase = async () => {
    if (activeCart.length === 0) {
      toast.error('Cart is empty!');
      return;
    }
    setProcessing(true);
    try {
      const saleData = {
        items: activeCart.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
          unit_price: item.price,
        })),
        payment_method: paymentMethod,
        discount: 0,
        tax_rate: 0,
      };
      const res = await api.post('/sales', saleData);
      setSaleResult({
        invoice_number: res.data.invoice_number,
        total: res.data.total,
        items: activeCart.map(item => ({
          name: item.name,
          quantity: item.quantity,
          unit_price: item.price,
          total_price: item.price * item.quantity,
        })),
        payment_method: paymentMethod,
        date: new Date().toLocaleString(),
      });
      setShowReceipt(true);
      setCart([]);
      // Reload products with updated stock
      const prodRes = await api.get('/products?page_size=100&sort_by=name&sort_order=asc');
      const active = prodRes.data.items.filter((p: any) => p.is_active);
      setAllProducts(active);
      toast.success('Sale completed! 🎉');
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Sale failed');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      <div className="flex gap-5" style={{ height: '640px' }}>
        {/* ═══════════════ LEFT: PRODUCT SHELVES ═══════════════ */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Search + Scanner effect */}
          <div className="relative mb-3">
            <div className="relative">
              <ScanBarcode className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={24} />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="🔍  Scan barcode or search product name..."
                className="w-full pl-12 pr-4 py-5 rounded-2xl text-white placeholder-gray-400 focus:outline-none transition-all text-[18px] text-center"
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '2px solid rgba(255,255,255,0.1)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(99,102,241,0.5)';
                  e.currentTarget.style.boxShadow = '0 0 0 4px rgba(99,102,241,0.15), 0 4px 20px rgba(0,0,0,0.2)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.2)';
                }}
                autoFocus
              />
              {search && (
                <button onClick={() => { setSearch(''); searchRef.current?.focus(); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
                  <X size={18} />
                </button>
              )}
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className="flex-shrink-0 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap"
                style={{
                  background: selectedCategory === cat ? 'linear-gradient(135deg, #6366f1, #7c3aed)' : 'rgba(255,255,255,0.04)',
                  border: `1.5px solid ${selectedCategory === cat ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.06)'}`,
                  color: selectedCategory === cat ? '#fff' : '#94a3b8',
                  boxShadow: selectedCategory === cat ? '0 2px 10px rgba(99,102,241,0.3)' : 'none',
                }}
              >
                {cat === 'All' ? '🏪 All' : cat}
              </button>
            ))}
          </div>

          {/* Product Grid - Supermarket shelves */}
          <div className="flex-1 overflow-y-auto pr-1">
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2.5">
              {filteredProducts.map((product) => {
                const inCart = cart.find(c => c.id === product.id);
                const isOutOfStock = product.current_stock <= 0;
                const isLowStock = product.current_stock > 0 && product.current_stock <= 5;
                const isScanning = scanning === product.id;

                return (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    disabled={isOutOfStock}
                    className={`relative flex flex-col p-2.5 rounded-xl transition-all duration-150 text-left group ${
                      isOutOfStock ? 'opacity-35 cursor-not-allowed' : 'cursor-pointer'
                    }`}
                    style={{
                      background: isScanning ? 'rgba(99,102,241,0.2)' : inCart ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.04)',
                      border: `1.5px solid ${inCart ? 'rgba(99,102,241,0.3)' : isOutOfStock ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.05)'}`,
                      transform: isScanning ? 'scale(0.95)' : 'scale(1)',
                    }}
                  >
                    {/* Cart count badge */}
                    {inCart && inCart.quantity > 0 && (
                      <div className="absolute -top-2 -right-2 min-w-[22px] h-[22px] rounded-full flex items-center justify-center text-[10px] font-bold text-white z-10 px-1" style={{
                        background: 'linear-gradient(135deg, #6366f1, #7c3aed)',
                        boxShadow: '0 2px 8px rgba(99,102,241,0.4)',
                      }}>
                        {inCart.quantity}
                      </div>
                    )}

                    {/* Low stock warning */}
                    {isLowStock && !isOutOfStock && (
                      <div className="absolute top-1.5 left-1.5">
                        <AlertTriangle size={11} className="text-amber-400" />
                      </div>
                    )}

                    {/* Product image area */}
                    <div className="w-full aspect-square rounded-lg flex items-center justify-center mb-1.5 overflow-hidden" style={{
                      background: isOutOfStock ? 'rgba(239,68,68,0.08)' : isLowStock ? 'rgba(245,158,11,0.08)' : 'rgba(99,102,241,0.08)',
                    }}>
                      {(product as any).image_url ? (
                        <img src={(product as any).image_url} alt={product.name} className="w-full h-full object-contain p-1" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                      ) : null}
                      <div className="w-full h-full flex items-center justify-center">
                        <Package size={22} className={isOutOfStock ? 'text-red-400/60' : isLowStock ? 'text-amber-400/70' : 'text-indigo-400/70'} />
                      </div>
                    </div>

                    {/* Product name */}
                    <p className="text-[11px] font-semibold text-white truncate w-full leading-tight">{product.name}</p>

                    {/* Price */}
                    <p className="text-[12px] font-bold text-indigo-400 mt-0.5">{formatCurrencyRaw(product.selling_price)}</p>

                    {/* Stock */}
                    <p className={`text-[9px] font-medium ${isOutOfStock ? 'text-red-400' : isLowStock ? 'text-amber-400' : 'text-gray-500'}`}>
                      {isOutOfStock ? 'Out of stock' : `${product.current_stock} left`}
                    </p>
                  </button>
                );
              })}
            </div>

            {filteredProducts.length === 0 && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Package size={48} className="mx-auto text-gray-600 mb-3" />
                  <p className="text-gray-400 text-sm">No products found</p>
                  <p className="text-gray-600 text-xs mt-1">Try a different search or category</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ═══════════════ RIGHT: BILL / CHECKOUT ═══════════════ */}
        <div className="w-[360px] flex-shrink-0 flex flex-col rounded-2xl overflow-hidden" style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}>
          {/* Bill Header */}
          <div className="px-5 py-3.5 flex items-center justify-between" style={{
            background: 'rgba(255,255,255,0.03)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                <ShoppingCart size={16} className="text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Billing Counter</h3>
                <p className="text-[11px] text-gray-500">{itemCount} items · {totalItems} qty</p>
              </div>
            </div>
            {activeCart.length > 0 && (
              <button onClick={clearCart} className="text-[11px] text-red-400 hover:text-red-300 font-medium px-2 py-1 rounded-lg hover:bg-red-500/10 transition-all">
                Clear
              </button>
            )}
          </div>

          {/* Bill Items */}
          <div className="flex-1 overflow-y-auto px-4 py-2">
            {activeCart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <ScanBarcode size={28} className="text-gray-600" />
                </div>
                <p className="text-gray-400 text-sm font-medium">No items yet</p>
                <p className="text-gray-600 text-xs mt-1">Click products or scan barcode</p>
              </div>
            ) : (
              <>
                {/* Column headers */}
                <div className="flex items-center text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-2 px-1">
                  <span className="flex-1">Item</span>
                  <span className="w-24 text-center">Qty</span>
                  <span className="w-16 text-right">Total</span>
                  <span className="w-6"></span>
                </div>

                <div className="space-y-1.5">
                  {activeCart.map((item) => (
                    <div key={item.id} className="flex items-center gap-1.5 p-2 rounded-lg animate-slide-up" style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.04)',
                    }}>
                      {/* Item info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-semibold text-white truncate">{item.name}</p>
                        <p className="text-[10px] text-gray-500">{formatCurrencyRaw(item.price)}/{item.unit}</p>
                      </div>

                      {/* Quantity controls */}
                      <div className="flex items-center gap-1">
                        <button onClick={() => updateQuantity(item.id, -1)}
                          className="w-6 h-6 rounded-md flex items-center justify-center bg-white/5 hover:bg-white/10 transition-colors">
                          <Minus size={10} className="text-gray-400" />
                        </button>
                        <span className="w-6 text-center text-[12px] font-bold text-white">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)}
                          className="w-6 h-6 rounded-md flex items-center justify-center bg-indigo-500/20 hover:bg-indigo-500/30 transition-colors">
                          <Plus size={10} className="text-indigo-400" />
                        </button>
                      </div>

                      {/* Price */}
                      <p className="w-16 text-right text-[12px] font-bold text-white">{formatCurrencyRaw(item.price * item.quantity)}</p>

                      {/* Remove */}
                      <button onClick={() => removeFromCart(item.id)}
                        className="w-5 h-5 rounded flex items-center justify-center hover:bg-red-500/10 transition-colors">
                        <X size={10} className="text-red-400" />
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Bill Footer - Checkout */}
          <div className="px-5 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            {/* Payment Method */}
            <div className="grid grid-cols-3 gap-1.5 mb-3">
              {[
                { key: 'cash', label: 'Cash', icon: Banknote },
                { key: 'card', label: 'Card', icon: CreditCard },
                { key: 'upi', label: 'UPI', icon: Smartphone },
              ].map(({ key, label, icon: Icon }) => (
                <button key={key} onClick={() => setPaymentMethod(key)}
                  className="flex items-center justify-center gap-1 py-2 rounded-lg text-[11px] font-semibold transition-all"
                  style={{
                    background: paymentMethod === key ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)',
                    border: `1.5px solid ${paymentMethod === key ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.05)'}`,
                    color: paymentMethod === key ? '#818cf8' : '#64748b',
                  }}>
                  <Icon size={13} />
                  {label}
                </button>
              ))}
            </div>

            {/* Totals */}
            <div className="space-y-1.5 mb-3">
              <div className="flex justify-between text-[12px]">
                <span className="text-gray-400">Subtotal</span>
                <span className="text-white font-medium">{formatCurrencyRaw(subtotal)}</span>
              </div>
              <div className="flex justify-between pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <span className="text-base font-bold text-white">TOTAL</span>
                <span className="text-xl font-extrabold text-white">{formatCurrencyRaw(subtotal)}</span>
              </div>
            </div>

            {/* Purchase Button */}
            <button
              onClick={handlePurchase}
              disabled={activeCart.length === 0 || processing}
              className="w-full py-4 rounded-xl font-bold text-white text-[15px] transition-all disabled:opacity-20 disabled:cursor-not-allowed relative overflow-hidden group"
              style={{
                background: 'linear-gradient(135deg, #10b981, #059669)',
                boxShadow: activeCart.length > 0 ? '0 6px 25px rgba(16, 185, 129, 0.35)' : 'none',
              }}
              onMouseEnter={(e) => {
                if (activeCart.length > 0) {
                  e.currentTarget.style.boxShadow = '0 10px 35px rgba(16, 185, 129, 0.5)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = activeCart.length > 0 ? '0 6px 25px rgba(16, 185, 129, 0.35)' : 'none';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {processing ? (
                  <>
                    <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>🛒 Purchase — {formatCurrencyRaw(subtotal)}</>
                )}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Receipt Printer */}
      {showReceipt && saleResult && (
        <ReceiptPrinter sale={saleResult} onClose={() => setShowReceipt(false)} />
      )}
    </>
  );
};

export default POS;
