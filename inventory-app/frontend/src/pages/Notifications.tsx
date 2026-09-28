import React, { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, AlertTriangle, AlertCircle, Info, Trash2 } from 'lucide-react';
import api from '../api/axios';
import { formatDateTime } from '../utils/format';
import toast from 'react-hot-toast';

const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.items);
      setUnreadCount(res.data.unread_count);
    } catch (e) {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotifications(); }, []);

  const markAsRead = async (id: number) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) {}
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (e) {}
  };

  const getIcon = (type: string, priority: string) => {
    if (priority === 'critical') return <AlertCircle size={20} className="text-red-500" />;
    if (priority === 'warning') return <AlertTriangle size={20} className="text-yellow-500" />;
    return <Info size={20} className="text-blue-500" />;
  };

  const getBgColor = (type: string, priority: string) => {
    if (!type) return 'bg-gray-50';
    if (type.includes('out_of_stock') || priority === 'critical') return 'bg-red-50 border-red-100';
    if (type.includes('low_stock') || priority === 'warning') return 'bg-yellow-50 border-yellow-100';
    if (type.includes('overstock')) return 'bg-orange-50 border-orange-100';
    return 'bg-blue-50 border-blue-100';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          {unreadCount > 0 && (
            <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
              {unreadCount} unread
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllAsRead}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200">
            <CheckCheck size={16} /> Mark all as read
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center">
            <Bell size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No notifications</p>
            <p className="text-sm text-gray-400 mt-1">You're all caught up!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notification) => (
              <div key={notification.id}
                className={`flex items-start gap-4 p-4 ${getBgColor(notification.notification_type, notification.priority)} ${
                  !notification.is_read ? 'border-l-4 border-l-indigo-500' : ''
                }`}>
                <div className="mt-1">
                  {getIcon(notification.notification_type, notification.priority)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className={`text-sm font-medium ${!notification.is_read ? 'text-gray-900' : 'text-gray-700'}`}>
                      {notification.title}
                    </h3>
                    {!notification.is_read && (
                      <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{formatDateTime(notification.created_at)}</p>
                </div>
                {!notification.is_read && (
                  <button onClick={() => markAsRead(notification.id)}
                    className="p-2 hover:bg-white/80 rounded-lg" title="Mark as read">
                    <Check size={14} className="text-gray-400" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
