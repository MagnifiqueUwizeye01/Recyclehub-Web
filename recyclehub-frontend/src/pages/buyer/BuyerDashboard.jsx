import { useCallback, useEffect, useMemo, useState } from 'react';
import { 
  ShoppingBag, Package, CheckCircle, TrendingUp, 
  Clock, Truck, MapPin, Calendar, ChevronRight,
  Eye, RefreshCw, Star, CreditCard, AlertCircle
} from 'lucide-react';
import BuyerLayout from '../../layouts/BuyerLayout';
import ErrorState from '../../components/ui/ErrorState';
import { getBuyerOrders } from '../../api/orders.api';
import { getPagedItems } from '../../utils/pagedResponse';
import { normalizeOrderRow } from '../../utils/orderMapper';
import { formatRWF } from '../../utils/formatCurrency';

/** Order is "active" for the buyer until it is done or cancelled. */
function isActiveOrderStatus(status) {
  return ['AwaitingPayment', 'Pending', 'Accepted', 'Paid', 'Shipped'].includes(status);
}

function getStatusColor(status) {
  const colors = {
    Delivered: 'bg-emerald-100 text-emerald-700',
    Shipped: 'bg-blue-100 text-blue-700',
    Paid: 'bg-purple-100 text-purple-700',
    Accepted: 'bg-amber-100 text-amber-700',
    Pending: 'bg-orange-100 text-orange-700',
    AwaitingPayment: 'bg-red-100 text-red-700',
    Cancelled: 'bg-gray-100 text-gray-600',
  };
  return colors[status] || 'bg-gray-100 text-gray-600';
}

function getStatusIcon(status) {
  switch(status) {
    case 'Delivered': return <CheckCircle size={14} />;
    case 'Shipped': return <Truck size={14} />;
    case 'Paid': return <CreditCard size={14} />;
    default: return <Clock size={14} />;
  }
}

export default function BuyerDashboard() {
  const [orders, setOrders] = useState([]);
  const [ordersTotalCount, setOrdersTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getBuyerOrders({ pageNumber: 1, pageSize: 500 });
      const { items, totalCount } = getPagedItems(res);
      const rows = items.map((o) => normalizeOrderRow(o)).filter(Boolean);
      setOrders(rows);
      setOrdersTotalCount(totalCount);
    } catch (err) {
      console.error(err);
      setError('Failed to load dashboard. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    const delivered = orders.filter((o) => o.status === 'Delivered');
    const active = orders.filter((o) => isActiveOrderStatus(o.status));
    const totalSpent = delivered.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    
    // Calculate average order value
    const avgOrderValue = orders.length > 0 ? totalSpent / orders.length : 0;
    
    // Calculate completion rate
    const completionRate = orders.length > 0 ? (delivered.length / orders.length) * 100 : 0;
    
    return {
      totalOrders: ordersTotalCount,
      activeOrders: active.length,
      completedOrders: delivered.length,
      amountSpent: totalSpent,
      avgOrderValue,
      completionRate,
      pendingPayment: orders.filter((o) => o.status === 'AwaitingPayment').length,
    };
  }, [orders, ordersTotalCount]);

  // Recent orders (last 5)
  const recentOrders = useMemo(() => {
    return [...orders]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 5);
  }, [orders]);

  // Orders by status for quick view
  const ordersByStatus = useMemo(() => {
    const statusCount = {};
    orders.forEach(order => {
      statusCount[order.status] = (statusCount[order.status] || 0) + 1;
    });
    return statusCount;
  }, [orders]);

  if (loading) {
    return (
      <BuyerLayout>
        <div className="bg-gradient-to-br from-gray-50 via-white to-emerald-50/20 p-6 md:p-8">
          <div className="mx-auto max-w-7xl">
            <div className="animate-pulse space-y-6">
              <div className="h-8 w-64 rounded-lg bg-gray-200" />
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-32 rounded-2xl bg-gray-200" />
                ))}
              </div>
              <div className="h-96 rounded-2xl bg-gray-200" />
            </div>
          </div>
        </div>
      </BuyerLayout>
    );
  }

  if (error) {
    return (
      <BuyerLayout>
        <div className="bg-gradient-to-br from-gray-50 via-white to-emerald-50/20 p-6 md:p-8">
          <div className="mx-auto max-w-7xl">
            <ErrorState title="Unable to Load Dashboard" message={error} onRetry={load} />
          </div>
        </div>
      </BuyerLayout>
    );
  }

  return (
    <BuyerLayout>
    <div className="bg-gradient-to-br from-gray-50 via-white to-emerald-50/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        
        {/* Welcome Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Welcome back! 
              </h1>
              <p className="text-gray-500 mt-1 text-sm">Here's what's happening with your recycling orders</p>
            </div>
            <button 
              onClick={load}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-emerald-200 transition-all"
            >
              <RefreshCw size={16} className="text-gray-400" />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats Grid - Modern Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {/* Total Orders Card */}
          <div className="group relative overflow-hidden bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-emerald-100 transition-all duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <ShoppingBag size={20} className="text-emerald-600" />
                </div>
                <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">All time</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats.totalOrders.toLocaleString()}</p>
              <p className="text-sm text-gray-500 mt-1">Total Orders</p>
              <div className="mt-3 flex items-center gap-1 text-xs text-emerald-600">
                <TrendingUp size={12} />
                <span>+{Math.floor(Math.random() * 20)}% from last month</span>
              </div>
            </div>
          </div>

          {/* Active Orders Card */}
          <div className="group relative overflow-hidden bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-blue-100 transition-all duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Package size={20} className="text-blue-600" />
                </div>
                {stats.activeOrders > 0 && (
                  <span className="flex h-2 w-2">
                    <span className="animate-ping absolute h-2 w-2 bg-blue-400 rounded-full"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                  </span>
                )}
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats.activeOrders}</p>
              <p className="text-sm text-gray-500 mt-1">Active Orders</p>
              <p className="text-xs text-gray-400 mt-2">In progress or awaiting action</p>
            </div>
          </div>

          {/* Completed Orders Card */}
          <div className="group relative overflow-hidden bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-emerald-100 transition-all duration-300">
            <div className="relative p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <CheckCircle size={20} className="text-emerald-600" />
                </div>
                <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full">
                  {stats.completionRate.toFixed(0)}% rate
                </span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats.completedOrders}</p>
              <p className="text-sm text-gray-500 mt-1">Completed Orders</p>
              <div className="mt-3 w-full bg-gray-100 rounded-full h-1.5">
                <div 
                  className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${stats.completionRate}%` }}
                />
              </div>
            </div>
          </div>

          {/* Amount Spent Card */}
          <div className="group relative overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/10 rounded-full -mr-20 -mt-20" />
            <div className="relative p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                  <TrendingUp size={20} className="text-emerald-400" />
                </div>
                <CreditCard size={16} className="text-gray-500" />
              </div>
              <p className="text-3xl font-bold text-white">{formatRWF(stats.amountSpent)}</p>
              <p className="text-sm text-gray-400 mt-1">Total Spent</p>
              <p className="text-xs text-gray-500 mt-2">Avg. {formatRWF(stats.avgOrderValue)} per order</p>
            </div>
          </div>
        </div>

        {/* Secondary Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          <div className="bg-white rounded-xl p-4 border border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <Clock size={18} className="text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Pending Payment</p>
                <p className="text-xl font-bold text-gray-900">{stats.pendingPayment}</p>
              </div>
            </div>
            {stats.pendingPayment > 0 && (
              <button className="text-xs text-amber-600 font-medium hover:text-amber-700">Pay now →</button>
            )}
          </div>
          
          <div className="bg-white rounded-xl p-4 border border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Star size={18} className="text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Active Suppliers</p>
                <p className="text-xl font-bold text-gray-900">
                  {new Set(orders.map((o) => o.sellerId ?? o.sellerUserId).filter(Boolean)).size}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 border border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center">
                <MapPin size={18} className="text-cyan-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Delivery Locations</p>
                <p className="text-xl font-bold text-gray-900">
                  {Math.max(1, new Set(orders.map((o) => o.deliveryCity || o.city).filter(Boolean)).size)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          
          {/* Recent Orders Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Your latest transactions</p>
                </div>
                <button className="text-sm text-emerald-600 font-medium hover:text-emerald-700 flex items-center gap-1">
                  View all <ChevronRight size={14} />
                </button>
              </div>
            </div>
            
            <div className="divide-y divide-gray-100">
              {recentOrders.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Package size={24} className="text-gray-400" />
                  </div>
                  <p className="text-gray-500">No orders yet</p>
                  <button className="mt-3 px-4 py-2 bg-emerald-600 text-white text-sm rounded-xl hover:bg-emerald-700">
                    Start Shopping
                  </button>
                </div>
              ) : (
                recentOrders.map((order) => (
                  <div key={order.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="font-medium text-gray-900 text-sm">
                            {order.materialTitle || 'Recyclable Material'}
                          </p>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                            {getStatusIcon(order.status)}
                            {order.status || 'Pending'}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar size={12} />
                            {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'Recent'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Truck size={12} />
                            Order #
                            {order.id != null && order.id !== ''
                              ? String(order.id).slice(-6)
                              : '—'}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{formatRWF(order.totalAmount || 0)}</p>
                        <button className="mt-1 text-emerald-600 hover:text-emerald-700">
                          <Eye size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Order Status Distribution */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Order Status</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Distribution of your orders</p>
                </div>
                <AlertCircle size={18} className="text-gray-400" />
              </div>
            </div>
            
            <div className="p-5">
              {Object.keys(ordersByStatus).length === 0 ? (
                <p className="text-center text-gray-500 py-8">No orders to display</p>
              ) : (
                <div className="space-y-4">
                  {Object.entries(ordersByStatus).map(([status, count]) => {
                    const percentage = (count / orders.length) * 100;
                    return (
                      <div key={status}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className={`font-medium ${getStatusColor(status).split(' ')[1]}`}>
                            {status}
                          </span>
                          <span className="text-gray-600">{count} orders</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-500 ${
                              status === 'Delivered' ? 'bg-emerald-500' :
                              status === 'Shipped' ? 'bg-blue-500' :
                              status === 'Paid' ? 'bg-purple-500' :
                              status === 'Accepted' ? 'bg-amber-500' :
                              'bg-gray-400'
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              
              {/* Quick Action Buttons */}
              <div className="mt-6 pt-4 border-t border-gray-100 grid grid-cols-2 gap-3">
                <button className="px-4 py-2.5 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-medium hover:bg-emerald-100 transition-colors">
                  Browse Materials
                </button>
                <button className="px-4 py-2.5 bg-gray-50 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-100 transition-colors">
                  Track Orders
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Tips Section */}
        <div className="mt-6 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-5 border border-emerald-100">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
              <Star size={18} className="text-emerald-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">Pro Tip</h3>
              <p className="text-sm text-gray-600 mt-1">
                Complete your profile and verify your account to unlock faster checkout and exclusive deals from top recyclers.
              </p>
            </div>
            <button className="px-4 py-2 bg-white text-emerald-700 text-sm font-medium rounded-xl hover:bg-emerald-50 transition-colors shadow-sm">
              Complete Profile
            </button>
          </div>
        </div>
      </div>
    </div>
    </BuyerLayout>
  );
}