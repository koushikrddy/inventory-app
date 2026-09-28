import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Eye, X, ShoppingBag } from 'lucide-react';
import api from '../api/axios';
import { formatCurrencyRaw, formatDateTime } from '../utils/format';
import toast from 'react-hot-toast';

const Purchases: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'create' | 'history'>('create');
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showDetail, setShowDetail] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      const [supRes, prodRes] = await Promise.all([api.get('/suppliers'), api.get('/products?page_size=100')]);
      setSuppliers(supRes.data);
      setProducts(prodRes.data.items);
    };
    load();
  }, []);

  const fetchPurchases = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/purchases?page=${page}&page_size=20`);
      setPurchases(res.data.items);
      setTotalPages(res.data.total_pages);
    } catch (e) {}
    setLoading(false);
  };

  useEffect(() => { fetchPurchases(); }, [page]);

  const addItem = () => {
    setItems([...items, { product_id: '', quantity: 1, unit_price: 0 }]);
  };

  const updateItem = (index: number, field: string, value: any) => {
    setItems(items.map((item, i) => {
      if (i !== index) return item;
      const updated = { ...item, [field]: value };
      if (field === 'product_id') {
        const product = products.find(p => p.id === Number(value));
        if (product) updated.unit_price = product.purchase_price;
      }
      return updated;
    }));
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

  const handlePurchase = async () => {
    if (!selectedSupplier) { toast.error('Select a supplier'); return; }
    if (items.length === 0) { toast.error('Add at least one item'); return; }
    const validItems = items.filter(i => i.product_id && i.quantity > 0 && i.unit_price > 0);
    if (validItems.length === 0) { toast.error('Fill in all item details'); return; }
    setSaving(true);
    try {
      await api.post('/purchases', {
        supplier_id: Number(selectedSupplier),
        items: validItems.map(i => ({ product_id: Number(i.product_id), quantity: i.quantity, unit_price: i.unit_price })),
        notes,
      });
      toast.success('Purchase completed successfully!');
      setItems([]);
      setSelectedSupplier('');
      setNotes('');
      setActiveTab('history');
      fetchPurchases();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Purchase failed');
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Purchases</h1>

      <div className="flex border-b border-gray-200">
        <button onClick={() => setActiveTab('create')}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'create' ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}>
          <Plus size={16} /> New Purchase
        </button>
        <button onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'history' ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}>
          <ShoppingBag size={16} /> Purchase History
        </button>
      </div>

      {activeTab === 'create' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Supplier *</label>
                  <select value={selectedSupplier} onChange={(e) => setSelectedSupplier(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                    <option value="">Select supplier</option>
                    {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900">Items</h3>
                <button onClick={addItem} className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-100">
                  <Plus size={14} /> Add Item
                </button>
              </div>

              {items.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">Click "Add Item" to start</div>
              ) : (
                <div className="space-y-3">
                  {items.map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <select value={item.product_id} onChange={(e) => updateItem(i, 'product_id', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                        <option value="">Select product</option>
                        {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                      <input type="number" value={item.quantity} onChange={(e) => updateItem(i, 'quantity', Number(e.target.value))} min={1}
                        className="w-20 px-2 py-2 border border-gray-200 rounded-lg text-sm text-center focus:ring-2 focus:ring-indigo-500 focus:outline-none" placeholder="Qty" />
                      <input type="number" value={item.unit_price} onChange={(e) => updateItem(i, 'unit_price', Number(e.target.value))} min={0}
                        className="w-28 px-2 py-2 border border-gray-200 rounded-lg text-sm text-right focus:ring-2 focus:ring-indigo-500 focus:outline-none" placeholder="Price" />
                      <span className="text-sm font-medium w-24 text-right">{formatCurrencyRaw(item.quantity * item.unit_price)}</span>
                      <button onClick={() => removeItem(i)} className="p-1.5 hover:bg-red-50 rounded-lg"><Trash2 size={14} className="text-red-500" /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 h-fit sticky top-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Purchase Summary</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Items</span><span>{items.length}</span></div>
              <div className="border-t border-gray-200 pt-3 flex justify-between text-base font-bold">
                <span>Total</span><span className="text-indigo-600">{formatCurrencyRaw(totalAmount)}</span>
              </div>
            </div>
            <button onClick={handlePurchase} disabled={saving}
              className="w-full mt-4 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50">
              {saving ? 'Processing...' : 'Complete Purchase'}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? <div className="p-8 text-center text-gray-400">Loading...</div> : purchases.length === 0 ? (
            <div className="p-12 text-center text-gray-500">No purchases found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr className="text-left text-xs text-gray-500 uppercase">
                    <th className="px-4 py-3 font-medium">Invoice</th>
                    <th className="px-4 py-3 font-medium">Supplier</th>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Items</th>
                    <th className="px-4 py-3 font-medium">Total</th>
                    <th className="px-4 py-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {purchases.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-indigo-600">{p.invoice_number}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{p.supplier_name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{formatDateTime(p.purchase_date)}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{p.items?.length || 0}</td>
                      <td className="px-4 py-3 text-sm font-medium">{formatCurrencyRaw(p.total_amount)}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => setShowDetail(p)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                          <Eye size={14} className="text-gray-500" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 text-sm border border-gray-200 rounded-lg disabled:opacity-50">Prev</button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1 text-sm border border-gray-200 rounded-lg disabled:opacity-50">Next</button>
              </div>
            </div>
          )}
        </div>
      )}

      {showDetail && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold">Purchase Details</h2>
              <button onClick={() => setShowDetail(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
            </div>
            <div className="p-6">
              <div className="text-sm space-y-2 mb-4">
                <div className="flex justify-between"><span className="text-gray-500">Invoice:</span><span className="font-medium">{showDetail.invoice_number}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Supplier:</span><span>{showDetail.supplier_name}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Date:</span><span>{formatDateTime(showDetail.purchase_date)}</span></div>
              </div>
              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-sm font-medium mb-2">Items</h4>
                {showDetail.items?.map((item: any, i: number) => (
                  <div key={i} className="flex justify-between text-sm py-2 border-b border-gray-100">
                    <span>{item.product_name} x{item.quantity}</span>
                    <span className="font-medium">{formatCurrencyRaw(item.total_price)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-base font-bold mt-3 pt-2">
                  <span>Total</span><span className="text-indigo-600">{formatCurrencyRaw(showDetail.total_amount)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Purchases;
