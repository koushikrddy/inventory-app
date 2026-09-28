import React, { useState, useEffect } from 'react';
import { Brain, TrendingUp, AlertTriangle, ShoppingCart, RefreshCw } from 'lucide-react';
import api from '../api/axios';
import { formatCurrencyRaw } from '../utils/format';
import toast from 'react-hot-toast';

const AIInsights: React.FC = () => {
  const [predictions, setPredictions] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'predictions' | 'recommendations'>('predictions');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [predRes, recRes] = await Promise.all([
        api.get('/ai/predictions'),
        api.get('/ai/recommendations'),
      ]);
      setPredictions(predRes.data);
      setRecommendations(recRes.data);
    } catch (e) {
      toast.error('Failed to load AI data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'normal': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const getConfidenceBadge = (confidence: string) => {
    switch (confidence) {
      case 'medium': return 'bg-green-100 text-green-800';
      case 'low': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">AI Insights</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-32 mb-3"></div>
              <div className="h-8 bg-gray-200 rounded w-20 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-24"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Brain size={24} className="text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AI Insights</h1>
            <p className="text-sm text-gray-500">AI-powered demand prediction and restock recommendations</p>
          </div>
        </div>
        <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div className="flex border-b border-gray-200">
        <button onClick={() => setActiveTab('predictions')}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'predictions' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}>
          <TrendingUp size={16} /> Demand Predictions
        </button>
        <button onClick={() => setActiveTab('recommendations')}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'recommendations' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}>
          <ShoppingCart size={16} /> Restock Recommendations ({recommendations.length})
        </button>
      </div>

      {activeTab === 'predictions' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {predictions.length === 0 ? (
            <div className="col-span-full p-12 text-center text-gray-500">No prediction data available</div>
          ) : (
            predictions.map((pred) => (
              <div key={pred.product_id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900">{pred.product_name}</h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getConfidenceBadge(pred.confidence)}`}>
                    {pred.confidence} confidence
                  </span>
                </div>

                {pred.data_quality === 'insufficient' ? (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-xs text-yellow-800">⚠️ Insufficient sales history for prediction</p>
                    <p className="text-xs text-yellow-600 mt-1">Using default reorder quantity based on stock levels.</p>
                  </div>
                ) : (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Avg Daily Sales</span>
                      <span className="font-medium">{pred.avg_daily_sales}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">7-Day Forecast</span>
                      <span className="font-medium">{pred.predicted_7day_demand} units</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">30-Day Forecast</span>
                      <span className="font-medium">{pred.predicted_30day_demand} units</span>
                    </div>
                  </div>
                )}

                <div className="border-t border-gray-100 mt-3 pt-3 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Current Stock</span>
                    <span className="font-medium">{pred.current_stock}</span>
                  </div>
                  {pred.expected_stockout_date && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Stockout Date</span>
                      <span className="font-medium text-red-600">{pred.expected_stockout_date}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">Recommended Reorder</span>
                    <span className="font-bold text-indigo-600">{pred.recommended_reorder_quantity} units</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {recommendations.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center text-gray-500 shadow-sm border border-gray-100">
              <ShoppingCart size={48} className="mx-auto text-gray-300 mb-4" />
              <p>No restock recommendations at this time</p>
              <p className="text-sm text-gray-400 mt-1">All products have sufficient stock</p>
            </div>
          ) : (
            recommendations.map((rec) => (
              <div key={rec.product_id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{rec.product_name}</h3>
                    {rec.supplier_name && <p className="text-sm text-gray-500">Supplier: {rec.supplier_name}</p>}
                  </div>
                  <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getUrgencyColor(rec.urgency)}`}>
                    {rec.urgency.toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">Current Stock</p>
                    <p className="text-lg font-bold text-gray-900">{rec.current_stock}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">Avg Daily Sales</p>
                    <p className="text-lg font-bold text-gray-900">{rec.avg_daily_sales}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">Safety Stock</p>
                    <p className="text-lg font-bold text-gray-900">{rec.safety_stock}</p>
                  </div>
                  <div className="p-3 bg-indigo-50 rounded-lg">
                    <p className="text-xs text-indigo-600">Recommended Order</p>
                    <p className="text-lg font-bold text-indigo-600">{rec.recommended_order_quantity} units</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default AIInsights;
