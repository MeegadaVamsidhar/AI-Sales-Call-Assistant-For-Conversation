'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Mail, Package, User, Calendar, DollarSign, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Order {
  order_id: string;
  customer_id: string;
  customer_name: string;
  book_title: string;
  author: string;
  genre: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  payment_method: string;
  delivery_option: string;
  delivery_address: string;
  order_status: string;
  order_date: string;
  special_requests: string;
  room_id?: string;
}

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Record<string, Order>>({});
  const [loading, setLoading] = useState(true);
  const [processingOrder, setProcessingOrder] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'rejected'>('all');

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
      const res = await fetch(`${backendUrl}/orders/all`);
      if (!res.ok) throw new Error('Failed to fetch orders');
      const data = await res.json();
      setOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleOrderAction(roomId: string, order: Order, action: 'accept' | 'reject') {
    setProcessingOrder(order.order_id);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
      
      // Update order status
      const statusRes = await fetch(`${backendUrl}/api/admin/orders/update-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room_id: roomId,
          order_id: order.order_id,
          status: action === 'accept' ? 'confirmed' : 'rejected',
        }),
      });

      if (!statusRes.ok) throw new Error('Failed to update order status');

      // Send confirmation email
      const emailRes = await fetch(`${backendUrl}/api/admin/orders/send-confirmation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: order.order_id,
          customer_email: order.customer_id, // Assuming customer_id is email
          customer_name: order.customer_name,
          book_title: order.book_title,
          status: action === 'accept' ? 'confirmed' : 'rejected',
          order_details: order,
        }),
      });

      if (!emailRes.ok) {
        console.warn('Email notification failed, but order status updated');
      }

      // Refresh orders
      await fetchOrders();
      alert(`Order ${action === 'accept' ? 'accepted' : 'rejected'} successfully! Email sent to customer.`);
    } catch (error) {
      console.error('Error processing order:', error);
      alert('Failed to process order. Please try again.');
    } finally {
      setProcessingOrder(null);
    }
  }

  const filteredOrders = Object.entries(orders).filter(([_, order]) => {
    if (filter === 'all') return true;
    return order.order_status === filter;
  });

  const pendingCount = Object.values(orders).filter(o => o.order_status === 'pending').length;
  const confirmedCount = Object.values(orders).filter(o => o.order_status === 'confirmed').length;
  const rejectedCount = Object.values(orders).filter(o => o.order_status === 'rejected').length;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-orange-500 border-t-transparent"></div>
          <p className="text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">📦 Order Management Dashboard</h1>
          <p className="text-gray-600">Review and manage customer book orders</p>
        </div>

        {/* Stats Cards */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-lg bg-white p-4 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">{Object.keys(orders).length}</p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          <div className="rounded-lg bg-white p-4 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
              </div>
              <Calendar className="h-8 w-8 text-yellow-500" />
            </div>
          </div>
          <div className="rounded-lg bg-white p-4 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Confirmed</p>
                <p className="text-2xl font-bold text-green-600">{confirmedCount}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </div>
          <div className="rounded-lg bg-white p-4 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Rejected</p>
                <p className="text-2xl font-bold text-red-600">{rejectedCount}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6 flex gap-2 rounded-lg bg-white p-2 shadow">
          {(['all', 'pending', 'confirmed', 'rejected'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                filter === status
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {filteredOrders.length === 0 ? (
            <div className="rounded-lg bg-white p-12 text-center shadow">
              <Package className="mx-auto mb-4 h-16 w-16 text-gray-300" />
              <p className="text-lg text-gray-600">No {filter !== 'all' ? filter : ''} orders found</p>
            </div>
          ) : (
            filteredOrders.map(([roomId, order]) => (
              <div key={order.order_id} className="rounded-lg bg-white p-6 shadow transition-shadow hover:shadow-lg">
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{order.book_title || 'Untitled Book'}</h3>
                    <p className="text-sm text-gray-600">by {order.author || 'Unknown Author'}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          order.order_status === 'confirmed'
                            ? 'bg-green-100 text-green-800'
                            : order.order_status === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {order.order_status?.toUpperCase() || 'PENDING'}
                      </span>
                      <span className="text-xs text-gray-500">Order ID: {order.order_id}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-orange-600">
                      ${order.total_amount?.toFixed(2) || '0.00'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {order.quantity || 1} {order.quantity === 1 ? 'copy' : 'copies'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">Customer:</span>
                      <span className="text-gray-600">{order.customer_name || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">Email:</span>
                      <span className="text-gray-600">{order.customer_id || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">Payment:</span>
                      <span className="text-gray-600">{order.payment_method || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Truck className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">Delivery:</span>
                      <span className="text-gray-600">{order.delivery_option || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">Date:</span>
                      <span className="text-gray-600">
                        {order.order_date ? new Date(order.order_date).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    {order.genre && (
                      <div className="flex items-center gap-2 text-sm">
                        <Package className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">Genre:</span>
                        <span className="text-gray-600">{order.genre}</span>
                      </div>
                    )}
                  </div>
                </div>

                {order.delivery_address && (
                  <div className="mt-3 rounded-md bg-gray-50 p-3">
                    <p className="text-sm font-medium text-gray-700">Delivery Address:</p>
                    <p className="text-sm text-gray-600">{order.delivery_address}</p>
                  </div>
                )}

                {order.special_requests && (
                  <div className="mt-3 rounded-md bg-blue-50 p-3">
                    <p className="text-sm font-medium text-blue-900">Special Requests:</p>
                    <p className="text-sm text-blue-700">{order.special_requests}</p>
                  </div>
                )}

                {order.order_status === 'pending' && (
                  <div className="mt-4 flex gap-3">
                    <Button
                      onClick={() => handleOrderAction(roomId, order, 'accept')}
                      disabled={processingOrder === order.order_id}
                      className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      {processingOrder === order.order_id ? 'Processing...' : 'Accept Order'}
                    </Button>
                    <Button
                      onClick={() => handleOrderAction(roomId, order, 'reject')}
                      disabled={processingOrder === order.order_id}
                      className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700"
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      {processingOrder === order.order_id ? 'Processing...' : 'Reject Order'}
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
