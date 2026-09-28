import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package, DollarSign, TrendingUp, AlertTriangle, ShoppingCart,
  BarChart3, Lightbulb, ArrowRight, Zap
} from 'lucide-react';
import POS from '../components/POS';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import api from '../api/axios';
import { formatCurrencyRaw } from '../utils/format';

const COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#ec4899', '#06b6d4', '#10b981'];

const Dashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/dashboard');
        setData(res.data);
      } catch (e) {
        console.error('Dashboard error:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-2xl p-6 animate-pulse" style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}>
              <div className="h-4 bg-white/10 rounded w-24 mb-4"></div>
              <div className="h-8 bg-white/10 rounded w-32 mb-2"></div>
              <div className="h-3 bg-white/10 rounded w-20"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data) return <div className="text-center py-8 text-gray-400">Failed to load dashboard</div>;

  const statCards = [
    { label: 'Total Products', value: data.total_products, icon: Package, gradient: 'linear-gradient(135deg, #6366f1, #818cf8)' },
    { label: 'Inventory Value', value: formatCurrencyRaw(data.total_inventory_value), icon: DollarSign, gradient: 'linear-gradient(135deg, #10b981, #34d399)' },
    { label: "Today's Sales", value: formatCurrencyRaw(data.todays_sales), icon: TrendingUp, gradient: 'linear-gradient(135deg, #8b5cf6, #a78bfa)' },
    { label: "Today's Profit", value: formatCurrencyRaw(data.todays_profit), icon: DollarSign, gradient: 'linear-gradient(135deg, #06b6d4, #22d3ee)' },
    { label: 'Low Stock', value: data.low_stock_count, icon: AlertTriangle, gradient: 'linear-gradient(135deg, #f59e0b, #fbbf24)' },
    { label: 'Out of Stock', value: data.out_of_stock_count, icon: ShoppingCart, gradient: 'linear-gradient(135deg, #ef4444, #f87171)' },
  ];

  const cardStyle = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.06)',
    backdropFilter: 'blur(12px',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between animate-slide-up">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Dashboard</h1>
          <p className="text-sm text-gray-400 mt-1">Welcome back! Here's your store overview.</p>
        </div>
      </div>

      {/* Quick Sale (POS) */}
      <div className="rounded-2xl p-5 animate-slide-up" style={cardStyle}>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
            <Zap size={18} className="text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Quick Sale</h2>
            <p className="text-xs text-gray-400">Scan or search items to sell</p>
          </div>
        </div>
        <POS />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 stagger-children">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="rounded-2xl p-5 group cursor-default transition-all hover:scale-[1.02]" style={cardStyle}>
              <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 rounded-xl text-white shadow-lg group-hover:scale-110 transition-transform duration-300" style={{
                  background: stat.gradient,
                  boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                }}>
                  <Icon size={18} />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-white">{stat.value}</p>
              <p className="text-xs text-gray-400 mt-1 font-medium">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 stagger-children">
        {/* Sales Trend */}
        <div className="rounded-2xl p-6" style={cardStyle}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">Sales Trend</h3>
            <span className="text-xs font-medium text-gray-400 bg-white/5 px-2.5 py-1 rounded-full">30 Days</span>
          </div>
          {data.sales_trend.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={data.sales_trend}>
                <defs>
                  <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={(v) => `₹${(v/100).toFixed(0)}`} />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(15,15,35,0.95)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                    color: '#fff',
                  }}
                  formatter={(v: any) => formatCurrencyRaw(v)}
                />
                <Line type="monotone" dataKey="revenue" stroke="url(#lineGradient)" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-8">No sales data yet</p>
          )}
        </div>

        {/* Category Sales */}
        <div className="rounded-2xl p-6" style={cardStyle}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">Category Sales</h3>
            <span className="text-xs font-medium text-gray-400 bg-white/5 px-2.5 py-1 rounded-full">Revenue</span>
          </div>
          {data.category_sales.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.category_sales}>
                <defs>
                  {COLORS.map((color, i) => (
                    <linearGradient key={i} id={`barGrad${i}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={color} />
                      <stop offset="100%" stopColor={color} stopOpacity={0.6} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={(v) => `₹${(v/100).toFixed(0)}`} />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(15,15,35,0.95)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                    color: '#fff',
                  }}
                  formatter={(v: any) => formatCurrencyRaw(v)}
                />
                <Bar dataKey="revenue" radius={[8, 8, 0, 0]}>
                  {data.category_sales.map((_: any, i: number) => (
                    <Cell key={i} fill={`url(#barGrad${i % COLORS.length})`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-8">No category data yet</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 stagger-children">
        {/* Top Products */}
        <div className="rounded-2xl p-6" style={cardStyle}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">Top Selling Products</h3>
            <Link to="/products" className="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1 group">
              View all <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          {data.top_products.length > 0 ? (
            <div className="space-y-3">
              {data.top_products.map((p: any, i: number) => (
                <div key={p.id} className="flex items-center justify-between p-3.5 rounded-xl transition-all hover:shadow-md" style={{
                  background: i === 0 ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.03)',
                }}>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-bold ${i === 0 ? 'text-indigo-400' : 'text-gray-500'}`}>
                      #{i + 1}
                    </span>
                    <span className="text-sm font-semibold text-white">{p.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-white">{p.total_sold} units</p>
                    <p className="text-xs text-gray-400">{formatCurrencyRaw(p.revenue)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No sales data yet</p>
          )}
        </div>

        {/* Smart Insights */}
        <div className="rounded-2xl p-6" style={cardStyle}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg" style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)' }}>
                <Lightbulb size={16} className="text-white" />
              </div>
              <h3 className="text-lg font-bold text-white">Smart Insights</h3>
            </div>
          </div>
          {data.smart_insights.length > 0 ? (
            <div className="space-y-3">
              {data.smart_insights.map((insight: any, i: number) => (
                <div key={i} className="p-3.5 rounded-xl border transition-all hover:shadow-sm" style={{
                  background: insight.type === 'critical' ? 'rgba(239,68,68,0.08)' :
                  insight.type === 'warning' ? 'rgba(245,158,11,0.08)' :
                  insight.type === 'success' ? 'rgba(16,185,129,0.08)' :
                  'rgba(59,130,246,0.08)',
                  borderColor: insight.type === 'critical' ? 'rgba(239,68,68,0.15)' :
                  insight.type === 'warning' ? 'rgba(245,158,11,0.15)' :
                  insight.type === 'success' ? 'rgba(16,185,129,0.15)' :
                  'rgba(59,130,246,0.15)',
                }}>
                  <p className="text-sm font-semibold text-white">{insight.title}</p>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">{insight.message}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No insights available</p>
          )}
        </div>
      </div>

      {/* Low Stock Alert */}
      {data.low_stock_products.length > 0 && (
        <div className="rounded-2xl p-6 animate-slide-up" style={cardStyle}>
          <h3 className="text-lg font-bold text-white mb-4">Low Stock Products</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase tracking-wider">
                  <th className="pb-3 font-semibold">Product</th>
                  <th className="pb-3 font-semibold">Current Stock</th>
                  <th className="pb-3 font-semibold">Min Level</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data.low_stock_products.map((p: any) => (
                  <tr key={p.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3.5 text-sm font-semibold text-white">{p.name}</td>
                    <td className="py-3.5 text-sm text-gray-400">{p.current_stock}</td>
                    <td className="py-3.5 text-sm text-gray-400">{p.minimum_stock_level}</td>
                    <td className="py-3.5">
                      <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${
                        p.status === 'out_of_stock' ? 'bg-red-500/15 text-red-400' : 'bg-amber-500/15 text-amber-400'
                      }`}>
                        {p.status === 'out_of_stock' ? 'Out of Stock' : 'Low Stock'}
                      </span>
                    </td>
                    <td className="py-3.5">
                      <Link to="/purchases" className="text-sm font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 group">
                        Restock <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
