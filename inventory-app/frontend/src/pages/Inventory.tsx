import React, { useState, useEffect } from 'react';
import { ArrowDown, ArrowUp, ArrowLeftRight, Search, Package } from 'lucide-react';
import api from '../api/axios';
import { formatDateTime, formatCurrencyRaw } from '../utils/format';
import toast from 'react-hot-toast';

const Inventory: React.FC = () => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [typeFilter, setTypeFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'history' | 'stockin' | 'stockout' | 'adjust'>('history');

  // Form states
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), page_size: '20' });
      if (typeFilter) params.append('transaction_type', typeFilter);
      const res = await api.get(`/inventory/transactions?${params}`);
      setTransactions(res.data.items);
      setTotal(res.data.total);
      setTotalPages(res.data.total_pages);
    } catch (e) {
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products?page_size=100');
      setProducts(res.data.items);
    } catch (e) {}
  };

  useEffect(() => { fetchProducts(); }, []);
  useEffect(() => { fetchTransactions(); }, [page, typeFilter]);

  const handleStockIn = async () => {
    if (!selectedProduct || quantity <= 0) { toast.error('Select a product and valid quantity'); return; }
    setSaving(true);
    try {
      await api.post('/inventory/stock-in', { product_id: Number(selectedProduct), quantity, notes });
      toast.success('Stock added successfully');
      setSelectedProduct(''); setQuantity(1); setNotes('');
      fetchTransactions();
      fetchProducts();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Failed');
    } finally { setSaving(false); }
  };

  const handleStockOut = async () => {
    if (!selectedProduct || quantity <= 0) { toast.error('Select a product and valid quantity'); return; }
    setSaving(true);
    try {
      await api.post('/inventory/stock-out', { product_id: Number(selectedProduct), quantity, notes });
      toast.success('Stock removed successfully');
      setSelectedProduct(''); setQuantity(1); setNotes('');
      fetchTransactions();
      fetchProducts();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Failed');
    } finally { setSaving(false); }
  };

  const handleAdjustment = async (type: string) => {
    if (!selectedProduct || quantity <= 0) { toast.error('Select a product and valid quantity'); return; }
    setSaving(true);
    try {
      await api.post('/inventory/adjustment', { product_id: Number(selectedProduct), quantity, adjustment_type: type, notes });
      toast.success('Stock adjusted successfully');
      setSelectedProduct(''); setQuantity(1); setNotes('');
      fetchTransactions();
      fetchProducts();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Failed');
    } finally { setSaving(false); }
  };

  const getTxnColor = (type: string) => {
    switch (type) {
      case 'PURCHASE': return 'bg-green-100 text-green-800';
      case 'SALE': return 'bg-blue-100 text-blue-800';
      case 'ADJUSTMENT_IN': return 'bg-purple-100 text-purple-800';
      case 'ADJUSTMENT_OUT': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>

      {/* Action Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-200">
          {[
            { key: 'history', label: 'Transaction History', icon: Package },
            { key: 'stockin', label: 'Stock In', icon: ArrowDown },
            { key: 'stockout', label: 'Stock Out', icon: ArrowUp },
            { key: 'adjust', label: 'Adjust Stock', icon: ArrowLeftRight },
          ].map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setActiveTab(key as any)}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === key ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              <Icon size={16} /> {label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Stock In/Out/Adjust Form */}
          {activeTab !== 'history' && (
            <div className="max-w-xl space-y-4 mb-6 pb-6 border-b border-gray-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product *</label>
                <select value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                  <option value="">Select product</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} (Stock: {p.current_stock})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                <input type="number" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} min={1}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
              </div>
              <div className="flex gap-3">
                {activeTab === 'stockin' && (
                  <button onClick={handleStockIn} disabled={saving}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">
                    {saving ? 'Processing...' : 'Add Stock'}
                  </button>
                )}
                {activeTab === 'stockout' && (
                  <button onClick={handleStockOut} disabled={saving}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50">
                    {saving ? 'Processing...' : 'Remove Stock'}
                  </button>
                )}
                {activeTab === 'adjust' && (
                  <>
                    <button onClick={() => handleAdjustment('adjustment_in')} disabled={saving}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50">
                      Adjust In
                    </button>
                    <button onClick={() => handleAdjustment('adjustment_out')} disabled={saving}
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-50">
                      Adjust Out
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Transaction History */}
          {activeTab === 'history' && (
            <>
              <div className="mb-4">
                <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
                  className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                  <option value="">All Types</option>
                  <option value="PURCHASE">Purchase</option>
                  <option value="SALE">Sale</option>
                  <option value="ADJUSTMENT_IN">Adjustment In</option>
                  <option value="ADJUSTMENT_OUT">Adjustment Out</option>
                </select>
              </div>
            </>
          )}

          {/* Transactions Table */}
          {loading ? (
            <div className="text-center py-8 text-gray-400">Loading...</div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12">
              <Package size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No transactions found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr className="text-left text-xs text-gray-500 uppercase">
                    <th className="px-4 py-3 font-medium">Product</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">Qty</th>
                    <th className="px-4 py-3 font-medium">Previous</th>
                    <th className="px-4 py-3 font-medium">New Stock</th>
                    <th className="px-4 py-3 font-medium">User</th>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {transactions.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{t.product_name}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getTxnColor(t.transaction_type)}`}>
                          {t.transaction_type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">{t.quantity}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{t.previous_stock}</td>
                      <td className="px-4 py-3 text-sm font-medium">{t.new_stock}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{t.user_name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{formatDateTime(t.created_at)}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{t.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-500">Page {page} of {totalPages} ({total} total)</p>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="px-3 py-1 text-sm border border-gray-200 rounded-lg disabled:opacity-50">Prev</button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="px-3 py-1 text-sm border border-gray-200 rounded-lg disabled:opacity-50">Next</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Inventory;
