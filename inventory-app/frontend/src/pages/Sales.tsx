import React, { useState, useEffect, useRef } from 'react';
import { ShoppingCart, Search, Plus, Minus, Trash2, X, Receipt, Eye } from 'lucide-react';
import api from '../api/axios';
import { formatCurrencyRaw, formatDateTime } from '../utils/format';
import toast from 'react-hot-toast';

interface CartItem {
  product_id: number;
  name: string;
  sku: string;
  unit_price: number;
  current_stock: number;
  quantity: number;
  total: number;
}

const Sales: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pos' | 'history'>('pos');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [taxRate, setTaxRate] = useState(1800);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [processing, setProcessing] = useState(false);
  const [sales, setSales] = useState<any[]>([]);
  const [salesPage, setSalesPage] = useState(1);
  const [salesTotal, setSalesTotal] = useState(0);
  const [salesTotalPages, setSalesTotalPages] = useState(1);
  const [salesLoading, setSalesLoading] = useState(true);
  const [showInvoice, setShowInvoice] = useState<any>(null);
  const [saleSearch, setSaleSearch] = useState('');
  const searchTimeout = useRef<any>(null);

  const searchProducts = (q: string) => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (q.length < 2) { setSearchResults([]); return; }
    searchTimeout.current = setTimeout(async () => {
      try {
        const res = await api.get(`/sales/search/product?q=${encodeURIComponent(q)}`);
        setSearchResults(res.data);
      } catch (e) {}
    }, 300);
  };

  const addToCart = (product: any) => {
    const existing = cart.find((item) => item.product_id === product.id);
    if (existing) {
      if (existing.quantity >= product.current_stock) {
        toast.error('Insufficient stock');
        return;
      }
      setCart(cart.map((item) =>
        item.product_id === product.id
          ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.unit_price }
          : item
      ));
    } else {
      setCart([...cart, {
        product_id: product.id, name: product.name, sku: product.sku,
        unit_price: product.selling_price, current_stock: product.current_stock,
        quantity: 1, total: product.selling_price,
      }]);
    }
    setSearchQuery('');
    setSearchResults([]);
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart(cart.map((item) => {
      if (item.product_id === productId) {
        const newQty = item.quantity + delta;
        if (newQty <= 0) return item;
        if (newQty > item.current_stock) { toast.error('Insufficient stock'); return item; }
        return { ...item, quantity: newQty, total: newQty * item.unit_price };
      }
      return item;
    }));
  };

  const removeFromCart = (productId: number) => {
    setCart(cart.filter((item) => item.product_id !== productId));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
  const tax = Math.round(subtotal * (taxRate / 10000));
  const grandTotal = subtotal - discount + tax;

  const handleCheckout = async () => {
    if (cart.length === 0) { toast.error('Cart is empty'); return; }
    setProcessing(true);
    try {
      const saleData = {
        items: cart.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
        })),
        discount,
        tax_rate: taxRate,
        payment_method: paymentMethod,
      };
      const res = await api.post('/sales', saleData);
      toast.success(`Sale completed! Invoice: ${res.data.invoice_number}`);
      setCart([]);
      setDiscount(0);
      fetchSales();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Sale failed');
    } finally {
      setProcessing(false);
    }
  };

  const fetchSales = async () => {
    setSalesLoading(true);
    try {
      const params = new URLSearchParams({ page: String(salesPage), page_size: '20' });
      if (saleSearch) params.append('search', saleSearch);
      const res = await api.get(`/sales?${params}`);
      setSales(res.data.items);
      setSalesTotal(res.data.total);
      setSalesTotalPages(res.data.total_pages);
    } catch (e) {}
    setSalesLoading(false);
  };

  useEffect(() => { fetchSales(); }, [salesPage, saleSearch]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Sales</h1>

      <div className="flex border-b border-gray-200">
        <button onClick={() => setActiveTab('pos')}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'pos' ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}>
          <ShoppingCart size={16} /> Point of Sale
        </button>
        <button onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'history' ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}>
          <Receipt size={16} /> Sales History
        </button>
      </div>

      {activeTab === 'pos' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Product Search & Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input type="text" value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); searchProducts(e.target.value); }}
                  placeholder="Search products by name, SKU, or barcode..."
                  className="w-full pl-9 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              {searchResults.length > 0 && (
                <div className="mt-2 border border-gray-200 rounded-lg max-h-60 overflow-y-auto">
                  {searchResults.map((p) => (
                    <button key={p.id} onClick={() => addToCart(p)}
                      className="w-full flex items-center justify-between p-3 hover:bg-gray-50 border-b border-gray-100 last:border-0 text-left">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{p.name}</p>
                        <p className="text-xs text-gray-500">SKU: {p.sku} | Stock: {p.current_stock}</p>
                      </div>
                      <span className="text-sm font-semibold text-indigo-600">{formatCurrencyRaw(p.selling_price)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900">Cart ({cart.length} items)</h3>
              </div>
              {cart.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  <ShoppingCart size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Add products to start a sale</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {cart.map((item) => (
                    <div key={item.product_id} className="flex items-center justify-between p-4">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{item.name}</p>
                        <p className="text-xs text-gray-500">{formatCurrencyRaw(item.unit_price)} each</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button onClick={() => updateQuantity(item.product_id, -1)}
                          className="w-7 h-7 flex items-center justify-center bg-gray-100 rounded-lg hover:bg-gray-200">
                          <Minus size={14} />
                        </button>
                        <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.product_id, 1)}
                          className="w-7 h-7 flex items-center justify-center bg-gray-100 rounded-lg hover:bg-gray-200">
                          <Plus size={14} />
                        </button>
                        <span className="text-sm font-semibold w-20 text-right">{formatCurrencyRaw(item.total)}</span>
                        <button onClick={() => removeFromCart(item.product_id)}
                          className="p-1 hover:bg-red-50 rounded-lg"><Trash2 size={14} className="text-red-500" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Checkout Panel */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 h-fit sticky top-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span className="font-medium">{formatCurrencyRaw(subtotal)}</span></div>
              <div className="flex justify-between">
                <span className="text-gray-500">Discount</span>
                <input type="number" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} min={0}
                  className="w-24 text-right px-2 py-1 border border-gray-200 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Tax (%)</span>
                <input type="number" value={taxRate / 100} onChange={(e) => setTaxRate(Number(e.target.value) * 100)} min={0} step={0.5}
                  className="w-24 text-right px-2 py-1 border border-gray-200 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
              </div>
              <div className="border-t border-gray-200 pt-3 flex justify-between text-base font-bold">
                <span>Total</span><span className="text-indigo-600">{formatCurrencyRaw(grandTotal)}</span>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="upi">UPI</option>
                <option value="other">Other</option>
              </select>
            </div>

            <button onClick={handleCheckout} disabled={processing || cart.length === 0}
              className="w-full mt-4 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
              {processing ? 'Processing...' : 'Complete Sale'}
            </button>
          </div>
        </div>
      ) : (
        /* Sales History */
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <input type="text" value={saleSearch} onChange={(e) => { setSaleSearch(e.target.value); setSalesPage(1); }}
              placeholder="Search by invoice number..." className="w-full max-w-md px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
          </div>
          {salesLoading ? <div className="p-8 text-center text-gray-400">Loading...</div> : sales.length === 0 ? (
            <div className="p-12 text-center text-gray-500">No sales found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr className="text-left text-xs text-gray-500 uppercase">
                    <th className="px-4 py-3 font-medium">Invoice</th>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Items</th>
                    <th className="px-4 py-3 font-medium">Total</th>
                    <th className="px-4 py-3 font-medium">Payment</th>
                    <th className="px-4 py-3 font-medium">Profit</th>
                    <th className="px-4 py-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-indigo-600">{sale.invoice_number}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{formatDateTime(sale.created_at)}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{sale.items?.length || 0}</td>
                      <td className="px-4 py-3 text-sm font-medium">{formatCurrencyRaw(sale.total)}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 capitalize">{sale.payment_method}</td>
                      <td className="px-4 py-3 text-sm text-green-600 font-medium">{formatCurrencyRaw(sale.profit)}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => setShowInvoice(sale)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                          <Eye size={14} className="text-gray-500" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {salesTotalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <p className="text-sm text-gray-500">Page {salesPage} of {salesTotalPages}</p>
              <div className="flex gap-2">
                <button onClick={() => setSalesPage(p => Math.max(1, p - 1))} disabled={salesPage === 1}
                  className="px-3 py-1 text-sm border border-gray-200 rounded-lg disabled:opacity-50">Prev</button>
                <button onClick={() => setSalesPage(p => Math.min(salesTotalPages, p + 1))} disabled={salesPage === salesTotalPages}
                  className="px-3 py-1 text-sm border border-gray-200 rounded-lg disabled:opacity-50">Next</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Invoice Modal */}
      {showInvoice && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold">Invoice</h2>
              <button onClick={() => setShowInvoice(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
            </div>
            <div className="p-6">
              <div className="text-center mb-4">
                <h3 className="text-xl font-bold text-indigo-600">📦 InventoryPro</h3>
                <p className="text-sm text-gray-500">Smart Retail Store</p>
              </div>
              <div className="text-sm space-y-2 mb-4">
                <div className="flex justify-between"><span className="text-gray-500">Invoice:</span><span className="font-medium">{showInvoice.invoice_number}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Date:</span><span>{formatDateTime(showInvoice.created_at)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Payment:</span><span className="capitalize">{showInvoice.payment_method}</span></div>
              </div>
              <div className="border-t border-dashed border-gray-300 my-4"></div>
              <div className="space-y-2 text-sm">
                {showInvoice.items?.map((item: any, i: number) => (
                  <div key={i} className="flex justify-between">
                    <span>{item.product_name} x{item.quantity}</span>
                    <span>{formatCurrencyRaw(item.total_price)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-dashed border-gray-300 my-4"></div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>{formatCurrencyRaw(showInvoice.subtotal)}</span></div>
                {showInvoice.discount > 0 && <div className="flex justify-between"><span className="text-gray-500">Discount</span><span>-{formatCurrencyRaw(showInvoice.discount)}</span></div>}
                {showInvoice.tax > 0 && <div className="flex justify-between"><span className="text-gray-500">Tax</span><span>{formatCurrencyRaw(showInvoice.tax)}</span></div>}
                <div className="flex justify-between text-base font-bold pt-2"><span>Total</span><span className="text-indigo-600">{formatCurrencyRaw(showInvoice.total)}</span></div>
              </div>
              <div className="text-center mt-6 text-xs text-gray-400">Thank you for your purchase!</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales;
