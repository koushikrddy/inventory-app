import React, { useState, useEffect } from 'react';
import { BarChart3, Download, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import api from '../api/axios';
import { formatCurrencyRaw, formatCurrency, formatDate } from '../utils/format';
import toast from 'react-hot-toast';

const Reports: React.FC = () => {
  const [activeReport, setActiveReport] = useState('sales');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    try {
      let res;
      switch (activeReport) {
        case 'sales':
          res = await api.get(`/reports/sales?start_date=${startDate}&end_date=${endDate}`);
          setData({ type: 'sales', ...res.data });
          break;
        case 'inventory':
          res = await api.get('/reports/inventory');
          setData({ type: 'inventory', ...res.data });
          break;
        case 'fast':
          res = await api.get('/reports/products/fast-moving?days=30');
          setData({ type: 'fast', items: res.data });
          break;
        case 'slow':
          res = await api.get('/reports/products/slow-moving?days=30');
          setData({ type: 'slow', items: res.data });
          break;
        case 'purchases':
          res = await api.get(`/reports/purchases?start_date=${startDate}&end_date=${endDate}`);
          setData({ type: 'purchases', ...res.data });
          break;
        case 'suppliers':
          res = await api.get('/reports/suppliers');
          setData({ type: 'suppliers', items: res.data });
          break;
      }
    } catch (e) {
      toast.error('Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReport(); }, [activeReport, startDate, endDate]);

  const exportCSV = () => {
    if (!data) return;
    let csv = '';
    const items = data.items || data.daily_data || [];
    if (items.length === 0) { toast.error('No data to export'); return; }
    csv = Object.keys(items[0]).join(',') + '\n';
    items.forEach((row: any) => {
      csv += Object.values(row).map(v => `"${v}"`).join(',') + '\n';
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeReport}_report.csv`;
    a.click();
    toast.success('CSV exported');
  };

  const reports = [
    { key: 'sales', label: 'Sales Report' },
    { key: 'inventory', label: 'Inventory Report' },
    { key: 'fast', label: 'Fast Moving' },
    { key: 'slow', label: 'Slow Moving' },
    { key: 'purchases', label: 'Purchase Report' },
    { key: 'suppliers', label: 'Supplier Report' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200">
          <Download size={16} /> Export CSV
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {reports.map((r) => (
          <button key={r.key} onClick={() => setActiveReport(r.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeReport === r.key ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}>
            {r.label}
          </button>
        ))}
      </div>

      {['sales', 'purchases'].includes(activeReport) && (
        <div className="flex items-center gap-3 bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <Calendar size={16} className="text-gray-400" />
          <label className="text-sm text-gray-600">From:</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
          <label className="text-sm text-gray-600">To:</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-xl p-12 text-center text-gray-400 shadow-sm border border-gray-100">Loading report...</div>
      ) : !data ? (
        <div className="bg-white rounded-xl p-12 text-center text-gray-400 shadow-sm border border-gray-100">Select a report</div>
      ) : (
        <div className="space-y-6">
          {/* Sales Report */}
          {data.type === 'sales' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { label: 'Total Revenue', value: formatCurrencyRaw(data.summary.total_revenue), color: 'text-indigo-600' },
                  { label: 'Total Profit', value: formatCurrencyRaw(data.summary.total_profit), color: 'text-green-600' },
                  { label: 'Total Sales', value: data.summary.total_count, color: 'text-purple-600' },
                  { label: 'Total Discount', value: formatCurrencyRaw(data.summary.total_discount), color: 'text-red-600' },
                ].map((s, i) => (
                  <div key={i} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                    <p className="text-sm text-gray-500">{s.label}</p>
                    <p className={`text-2xl font-bold ${s.color} mt-1`}>{s.value}</p>
                  </div>
                ))}
              </div>
              {data.daily_data.length > 0 && (
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <h3 className="text-lg font-semibold mb-4">Daily Sales</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data.daily_data}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v: any) => formatCurrencyRaw(v)} />
                      <Bar dataKey="revenue" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </>
          )}

          {/* Inventory Report */}
          {data.type === 'inventory' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                  <p className="text-sm text-gray-500">Total Value</p>
                  <p className="text-2xl font-bold text-indigo-600 mt-1">{formatCurrencyRaw(data.summary.total_value)}</p>
                </div>
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                  <p className="text-sm text-gray-500">Retail Value</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">{formatCurrencyRaw(data.summary.total_retail_value)}</p>
                </div>
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                  <p className="text-sm text-gray-500">Total Items</p>
                  <p className="text-2xl font-bold text-purple-600 mt-1">{data.summary.total_items.toLocaleString()}</p>
                </div>
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                  <p className="text-sm text-gray-500">Potential Profit</p>
                  <p className="text-2xl font-bold text-emerald-600 mt-1">{formatCurrencyRaw(data.summary.potential_profit)}</p>
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold mb-4">Stock Status</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(data.status_breakdown).map(([status, count]: [string, any]) => (
                    <div key={status} className="p-4 bg-gray-50 rounded-lg text-center">
                      <p className="text-2xl font-bold text-gray-900">{count}</p>
                      <p className="text-sm text-gray-500 capitalize">{status.replace('_', ' ')}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Fast/Slow Moving */}
          {(data.type === 'fast' || data.type === 'slow') && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr className="text-left text-xs text-gray-500 uppercase">
                    {data.type === 'fast' ? (
                      <>
                        <th className="px-4 py-3 font-medium">Product</th>
                        <th className="px-4 py-3 font-medium">Units Sold</th>
                        <th className="px-4 py-3 font-medium">Revenue</th>
                        <th className="px-4 py-3 font-medium">Avg Daily</th>
                        <th className="px-4 py-3 font-medium">Stock</th>
                        <th className="px-4 py-3 font-medium">Days Until Stockout</th>
                      </>
                    ) : (
                      <>
                        <th className="px-4 py-3 font-medium">Product</th>
                        <th className="px-4 py-3 font-medium">Stock</th>
                        <th className="px-4 py-3 font-medium">Sold (30d)</th>
                        <th className="px-4 py-3 font-medium">Last Sale</th>
                        <th className="px-4 py-3 font-medium">Days Since Sale</th>
                        <th className="px-4 py-3 font-medium">Value</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(data.items || []).map((item: any) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.name}</td>
                      {data.type === 'fast' ? (
                        <>
                          <td className="px-4 py-3 text-sm">{item.units_sold}</td>
                          <td className="px-4 py-3 text-sm">{formatCurrencyRaw(item.revenue)}</td>
                          <td className="px-4 py-3 text-sm">{item.avg_daily_sales}</td>
                          <td className="px-4 py-3 text-sm">{item.current_stock}</td>
                          <td className="px-4 py-3 text-sm font-medium">{item.days_until_stockout || '-'}</td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-3 text-sm">{item.current_stock}</td>
                          <td className="px-4 py-3 text-sm">{item.units_sold}</td>
                          <td className="px-4 py-3 text-sm">{item.last_sale_date || 'Never'}</td>
                          <td className="px-4 py-3 text-sm">{item.days_since_last_sale} days</td>
                          <td className="px-4 py-3 text-sm">{formatCurrencyRaw(item.inventory_value)}</td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Purchases Report */}
          {data.type === 'purchases' && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Total Purchases</p>
                  <p className="text-2xl font-bold text-gray-900">{data.summary.total_purchases}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Total Amount</p>
                  <p className="text-2xl font-bold text-indigo-600">{formatCurrencyRaw(data.summary.total_amount)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Suppliers Report */}
          {data.type === 'suppliers' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr className="text-left text-xs text-gray-500 uppercase">
                    <th className="px-4 py-3 font-medium">Supplier</th>
                    <th className="px-4 py-3 font-medium">Products</th>
                    <th className="px-4 py-3 font-medium">Total Purchases</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(data.items || []).map((s: any) => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{s.name}</td>
                      <td className="px-4 py-3 text-sm">{s.product_count}</td>
                      <td className="px-4 py-3 text-sm font-medium">{formatCurrencyRaw(s.total_purchases)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Reports;
