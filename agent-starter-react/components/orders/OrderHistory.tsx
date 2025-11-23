'use client';

import React, { useState, useEffect } from 'react';
import { Package, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCurrentUser } from '@/hooks/useCurrentUser';

interface Order {
  order_id: string;
  customer_name: string;
  book_title: string;
  author: string;
  quantity: number;
  total_amount: number;
  payment_method: string;
  delivery_option: string;
  order_status: string;
  order_date: string;
}

export const OrderHistory: React.FC = () => {
  const { user, loading: userLoading } = useCurrentUser();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && !userLoading) {
      fetchUserOrders();
    }
  }, [user, userLoading]);

  const fetchUserOrders = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
      const response = await fetch(`${backendUrl}/orders/user/${user.email}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }

      const data = await response.json();
      // Convert orders object to array
      const ordersArray = Object.values(data.orders || {}) as Order[];
      setOrders(ordersArray);
    } catch (err) {
      console.error('Failed to fetch user orders:', err);
      setError('Failed to load your order history');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusLower = status?.toLowerCase() || '';
    switch (statusLower) {
      case 'completed':
      case 'confirmed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    const statusLower = status?.toLowerCase() || '';
    switch (statusLower) {
      case 'completed':
      case 'confirmed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Package className="h-5 w-5 text-gray-500" />;
    }
  };

  if (userLoading || loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600">Loading your orders...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6 text-center">
            <XCircle className="h-12 w-12 text-red-400 mx-auto mb-3" />
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6 text-center">
            <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No orders found</p>
            <p className="text-sm text-gray-400 mt-2">Your order history will appear here</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-800">My Order History</h2>
        <p className="text-sm text-gray-500">{orders.length} order(s) found</p>
      </div>

      <div className="space-y-3">
        {orders.map((order, index) => (
          <Card key={order.order_id || index} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  {getStatusIcon(order.order_status)}
                  Order #{order.order_id?.slice(-6) || 'N/A'}
                </CardTitle>
                {getStatusBadge(order.order_status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="border-t pt-3">
                <div className="text-sm font-medium text-gray-900">{order.book_title || 'N/A'}</div>
                <div className="text-xs text-gray-500">by {order.author || 'Unknown'}</div>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Quantity:</span>
                <span className="font-medium">{order.quantity || 0}</span>
              </div>

              <div className="flex justify-between items-center border-t pt-3">
                <span className="text-sm font-medium text-gray-700">Total:</span>
                <span className="text-lg font-bold text-green-600">
                  ${order.total_amount?.toFixed(2) || '0.00'}
                </span>
              </div>

              <div className="text-xs text-gray-500 flex justify-between items-center">
                <span>{order.payment_method || 'N/A'} • {order.delivery_option || 'N/A'}</span>
                <span>
                  {order.order_date 
                    ? new Date(order.order_date).toLocaleDateString()
                    : 'N/A'}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default OrderHistory;
