import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Eye, X, Package, Filter } from 'lucide-react';
import api from '../api/axios';
import { formatCurrencyRaw, getStockStatusColor, getStockStatusLabel, formatDate } from '../utils/format';
import toast from 'react-hot-toast';

const emptyProduct = {
  sku: '', barcode: '', name: '', description: '', category_id: 0,
  brand: '', supplier_id: 0, purchase_price: 0, selling_price: 0,
  current_stock: 0, minimum_stock_level: 10, maximum_stock_level: 1000,
  reorder_quantity: 50, unit: 'piece', image_url: '',
};

const Products: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [formData, setFormData] = useState(emptyProduct);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page), page_size: '20', sort_by: sortBy, sort_order: 'asc',
      });
      if (search) params.append('search', search);
      if (categoryFilter) params.append('category_id', categoryFilter);
      if (statusFilter) params.append('stock_status', statusFilter);
      const res = await api.get(`/products?${params}`);
      setProducts(res.data.items);
      setTotal(res.data.total);
      setTotalPages(res.data.total_pages);
    } catch (e) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const fetchMeta = async () => {
    try {
      const [catRes, supRes] = await Promise.all([api.get('/categories'), api.get('/suppliers')]);
      setCategories(catRes.data);
      setSuppliers(supRes.data);
    } catch (e) {}
  };

  useEffect(() => { fetchMeta(); }, []);
  useEffect(() => { fetchProducts(); }, [page, search, categoryFilter, statusFilter, sortBy]);

  const openAdd = () => {
    setFormData(emptyProduct);
    setEditingId(null);
    setShowModal(true);
  };

  const openEdit = (product: any) => {
    setFormData({
      sku: product.sku, barcode: product.barcode || '', name: product.name,
      description: product.description || '', category_id: product.category_id || 0,
      brand: product.brand || '', supplier_id: product.supplier_id || 0,
      purchase_price: product.purchase_price, selling_price: product.selling_price,
      current_stock: product.current_stock, minimum_stock_level: product.minimum_stock_level,
      maximum_stock_level: product.maximum_stock_level, reorder_quantity: product.reorder_quantity,
      unit: product.unit, image_url: product.image_url || '',
    });
    setEditingId(product.id);
    setShowModal(true);
  };

  const openDetail = async (productId: number) => {
    try {
      const res = await api.get(`/products/${productId}`);
      setSelectedProduct(res.data);
      setShowDetailModal(true);
    } catch (e) {
      toast.error('Failed to load product');
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.sku) {
      toast.error('Name and SKU are required');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/products/${editingId}`, formData);
        toast.success('Product updated successfully');
      } else {
        await api.post('/products', formData);
        toast.success('Product created successfully');
      }
      setShowModal(false);
      fetchProducts();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success('Product deleted');
      fetchProducts();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Failed to delete');
    }
  };

  const darkInput = "w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all";
  const darkSelect = "px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all";
  const darkLabel = "block text-sm font-medium text-gray-300 mb-1.5";
  const cardStyle = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.06)' };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Products</h1>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white rounded-xl transition-all hover:scale-[1.02]" style={{
          background: 'linear-gradient(135deg, #6366f1, #7c3aed)',
          boxShadow: '0 4px 15px rgba(99,102,241,0.3)',
        }}>
          <Plus size={16} /> Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="rounded-2xl p-4" style={cardStyle}>
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
            <input
              type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by name, SKU, barcode..."
              className={`${darkInput} pl-9`}
            />
          </div>
          <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }} className={darkSelect}>
            <option value="">All Categories</option>
            {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className={darkSelect}>
            <option value="">All Status</option>
            <option value="in_stock">In Stock</option>
            <option value="low_stock">Low Stock</option>
            <option value="out_of_stock">Out of Stock</option>
            <option value="overstocked">Overstocked</option>
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className={darkSelect}>
            <option value="name">Sort by Name</option>
            <option value="current_stock">Sort by Stock</option>
            <option value="selling_price">Sort by Price</option>
            <option value="created_at">Sort by Date</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="rounded-2xl overflow-hidden" style={cardStyle}>
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center">
            <Package size={48} className="mx-auto text-gray-600 mb-4" />
            <p className="text-gray-400">No products found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr className="text-left text-xs text-gray-500 uppercase">
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">SKU</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Price</th>
                  <th className="px-4 py-3 font-medium">Stock</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg flex-shrink-0 overflow-hidden flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.08)' }}>
                          {product.image_url ? (
                            <img src={product.image_url} alt={product.name} className="w-full h-full object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          ) : (
                            <Package size={18} className="text-indigo-400/70" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{product.name}</p>
                          <p className="text-xs text-gray-500">{product.brand}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">{product.sku}</td>
                    <td className="px-4 py-3 text-sm text-gray-400">{product.category_name || '-'}</td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-white">{formatCurrencyRaw(product.selling_price)}</p>
                      <p className="text-xs text-gray-500">Cost: {formatCurrencyRaw(product.purchase_price)}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-white">{product.current_stock} {product.unit}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStockStatusColor(product.stock_status)}`}>
                        {getStockStatusLabel(product.stock_status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openDetail(product.id)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"><Eye size={14} className="text-gray-400" /></button>
                        <button onClick={() => openEdit(product)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"><Edit2 size={14} className="text-gray-400" /></button>
                        <button onClick={() => handleDelete(product.id)} className="p-1.5 hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 size={14} className="text-red-400" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
            <p className="text-sm text-gray-400">Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, total)} of {total}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1 text-sm border border-white/10 rounded-lg disabled:opacity-50 hover:bg-white/5 text-gray-300 transition-all">Prev</button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-3 py-1 text-sm border border-white/10 rounded-lg disabled:opacity-50 hover:bg-white/5 text-gray-300 transition-all">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" style={{
            background: 'rgba(15, 15, 35, 0.95)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <h2 className="text-lg font-semibold text-white">{editingId ? 'Edit Product' : 'Add Product'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors"><X size={18} className="text-gray-400" /></button>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className={darkLabel}>Product Name *</label><input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className={darkInput} /></div>
              <div><label className={darkLabel}>SKU *</label><input type="text" value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} className={darkInput} /></div>
              <div><label className={darkLabel}>Barcode</label><input type="text" value={formData.barcode} onChange={(e) => setFormData({ ...formData, barcode: e.target.value })} className={darkInput} /></div>
              <div><label className={darkLabel}>Brand</label><input type="text" value={formData.brand} onChange={(e) => setFormData({ ...formData, brand: e.target.value })} className={darkInput} /></div>
              <div><label className={darkLabel}>Category</label><select value={formData.category_id} onChange={(e) => setFormData({ ...formData, category_id: Number(e.target.value) })} className={darkSelect}><option value={0}>Select Category</option>{categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
              <div><label className={darkLabel}>Supplier</label><select value={formData.supplier_id} onChange={(e) => setFormData({ ...formData, supplier_id: Number(e.target.value) })} className={darkSelect}><option value={0}>Select Supplier</option>{suppliers.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
              <div><label className={darkLabel}>Purchase Price (paise)</label><input type="number" value={formData.purchase_price} onChange={(e) => setFormData({ ...formData, purchase_price: Number(e.target.value) })} className={darkInput} /></div>
              <div><label className={darkLabel}>Selling Price (paise)</label><input type="number" value={formData.selling_price} onChange={(e) => setFormData({ ...formData, selling_price: Number(e.target.value) })} className={darkInput} /></div>
              <div><label className={darkLabel}>Current Stock</label><input type="number" value={formData.current_stock} onChange={(e) => setFormData({ ...formData, current_stock: Number(e.target.value) })} className={darkInput} /></div>
              <div><label className={darkLabel}>Min Stock Level</label><input type="number" value={formData.minimum_stock_level} onChange={(e) => setFormData({ ...formData, minimum_stock_level: Number(e.target.value) })} className={darkInput} /></div>
              <div><label className={darkLabel}>Max Stock Level</label><input type="number" value={formData.maximum_stock_level} onChange={(e) => setFormData({ ...formData, maximum_stock_level: Number(e.target.value) })} className={darkInput} /></div>
              <div><label className={darkLabel}>Reorder Quantity</label><input type="number" value={formData.reorder_quantity} onChange={(e) => setFormData({ ...formData, reorder_quantity: Number(e.target.value) })} className={darkInput} /></div>
              <div><label className={darkLabel}>Unit</label><select value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} className={darkSelect}><option value="piece">Piece</option><option value="kg">Kg</option><option value="ltr">Litre</option><option value="pkt">Packet</option><option value="btl">Bottle</option><option value="cup">Cup</option><option value="rim">Rim</option></select></div>
              <div className="md:col-span-2"><label className={darkLabel}>Description</label><textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className={darkInput} rows={2} /></div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-white/5">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-400 bg-white/5 rounded-lg hover:bg-white/10 transition-all">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm text-white rounded-lg disabled:opacity-50 transition-all" style={{
                background: 'linear-gradient(135deg, #6366f1, #7c3aed)',
              }}>
                {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" style={{
            background: 'rgba(15, 15, 35, 0.95)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <h2 className="text-lg font-semibold text-white">{selectedProduct.name}</h2>
              <button onClick={() => setShowDetailModal(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors"><X size={18} className="text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              {selectedProduct.image_url && (
                <div className="flex justify-center">
                  <div className="w-32 h-32 rounded-xl overflow-hidden flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.08)' }}>
                    <img src={selectedProduct.image_url} alt={selectedProduct.name} className="w-full h-full object-contain" />
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs text-gray-500">SKU</p><p className="text-sm font-medium text-white">{selectedProduct.sku}</p></div>
                <div><p className="text-xs text-gray-500">Barcode</p><p className="text-sm font-medium text-white">{selectedProduct.barcode || '-'}</p></div>
                <div><p className="text-xs text-gray-500">Category</p><p className="text-sm font-medium text-white">{selectedProduct.category_name || '-'}</p></div>
                <div><p className="text-xs text-gray-500">Brand</p><p className="text-sm font-medium text-white">{selectedProduct.brand || '-'}</p></div>
                <div><p className="text-xs text-gray-500">Purchase Price</p><p className="text-sm font-medium text-white">{formatCurrencyRaw(selectedProduct.purchase_price)}</p></div>
                <div><p className="text-xs text-gray-500">Selling Price</p><p className="text-sm font-medium text-white">{formatCurrencyRaw(selectedProduct.selling_price)}</p></div>
                <div><p className="text-xs text-gray-500">Current Stock</p><p className="text-sm font-medium text-white">{selectedProduct.current_stock} {selectedProduct.unit}</p></div>
                <div><p className="text-xs text-gray-500">Status</p><span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStockStatusColor(selectedProduct.stock_status)}`}>{getStockStatusLabel(selectedProduct.stock_status)}</span></div>
                <div><p className="text-xs text-gray-500">Min Stock</p><p className="text-sm font-medium text-white">{selectedProduct.minimum_stock_level}</p></div>
                <div><p className="text-xs text-gray-500">Max Stock</p><p className="text-sm font-medium text-white">{selectedProduct.maximum_stock_level}</p></div>
                <div><p className="text-xs text-gray-500">Reorder Qty</p><p className="text-sm font-medium text-white">{selectedProduct.reorder_quantity}</p></div>
                <div><p className="text-xs text-gray-500">Supplier</p><p className="text-sm font-medium text-white">{selectedProduct.supplier_name || '-'}</p></div>
              </div>
              {selectedProduct.description && (
                <div><p className="text-xs text-gray-500 mb-1">Description</p><p className="text-sm text-gray-300">{selectedProduct.description}</p></div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
