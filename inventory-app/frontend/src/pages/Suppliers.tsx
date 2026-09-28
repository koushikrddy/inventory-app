import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Truck, X, Phone, Mail, MapPin } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const emptySupplier = { name: '', contact_person: '', phone: '', email: '', address: '', company_name: '', gst_vat_number: '', notes: '' };

const Suppliers: React.FC = () => {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState(emptySupplier);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const params = search ? `?search=${search}` : '';
      const res = await api.get(`/suppliers${params}`);
      setSuppliers(res.data);
    } catch (e) {
      toast.error('Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSuppliers(); }, [search]);

  const handleSave = async () => {
    if (!formData.name) { toast.error('Supplier name is required'); return; }
    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/suppliers/${editingId}`, formData);
        toast.success('Supplier updated');
      } else {
        await api.post('/suppliers', formData);
        toast.success('Supplier created');
      }
      setShowModal(false);
      setFormData(emptySupplier);
      fetchSuppliers();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this supplier?')) return;
    try {
      await api.delete(`/suppliers/${id}`);
      toast.success('Supplier deleted');
      fetchSuppliers();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Failed to delete');
    }
  };

  const openEdit = (s: any) => {
    setFormData({ name: s.name, contact_person: s.contact_person || '', phone: s.phone || '', email: s.email || '',
      address: s.address || '', company_name: s.company_name || '', gst_vat_number: s.gst_vat_number || '', notes: s.notes || '' });
    setEditingId(s.id);
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Suppliers</h1>
        <button onClick={() => { setFormData(emptySupplier); setEditingId(null); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
          <Plus size={16} /> Add Supplier
        </button>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search suppliers..."
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          [...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-32 mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-40"></div>
            </div>
          ))
        ) : suppliers.length === 0 ? (
          <div className="col-span-full p-12 text-center">
            <Truck size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No suppliers found</p>
          </div>
        ) : (
          suppliers.map((supplier) => (
            <div key={supplier.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <Truck size={20} className="text-purple-600" />
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(supplier)} className="p-1.5 hover:bg-gray-100 rounded-lg"><Edit2 size={14} className="text-gray-500" /></button>
                  <button onClick={() => handleDelete(supplier.id)} className="p-1.5 hover:bg-red-50 rounded-lg"><Trash2 size={14} className="text-red-500" /></button>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{supplier.name}</h3>
              {supplier.company_name && <p className="text-sm text-gray-500">{supplier.company_name}</p>}
              {supplier.contact_person && <p className="text-sm text-gray-600 mt-1">Contact: {supplier.contact_person}</p>}
              <div className="mt-3 space-y-1">
                {supplier.phone && <div className="flex items-center gap-2 text-sm text-gray-500"><Phone size={12} />{supplier.phone}</div>}
                {supplier.email && <div className="flex items-center gap-2 text-sm text-gray-500"><Mail size={12} />{supplier.email}</div>}
                {supplier.address && <div className="flex items-center gap-2 text-sm text-gray-500"><MapPin size={12} />{supplier.address}</div>}
              </div>
              <div className="flex gap-4 mt-3 text-sm">
                <span className="text-indigo-600 font-medium">{supplier.product_count} products</span>
                <span className="text-gray-400">{supplier.purchase_count} purchases</span>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">{editingId ? 'Edit Supplier' : 'Add Supplier'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key: 'name', label: 'Name *', type: 'text' },
                { key: 'company_name', label: 'Company Name', type: 'text' },
                { key: 'contact_person', label: 'Contact Person', type: 'text' },
                { key: 'phone', label: 'Phone', type: 'text' },
                { key: 'email', label: 'Email', type: 'email' },
                { key: 'gst_vat_number', label: 'GST/VAT Number', type: 'text' },
              ].map(({ key, label, type }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <input type={type} value={(formData as any)[key]} onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                </div>
              ))}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" rows={2} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" rows={2} />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
              <button onClick={handleSave} disabled={saving}
                className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Suppliers;
