import { useEffect, useState } from 'react';
import { useRoomContext } from '@livekit/components-react';

interface OrderData {
  order_id?: string;
  customer_id?: string;
  customer_name?: string;
  book_title?: string;
  author?: string;
  genre?: string;
  quantity?: number;
  unit_price?: number;
  total_amount?: number;
  payment_method?: string;
  delivery_option?: string;
  delivery_address?: string;
  order_status?: string;
  order_date?: string;
  special_requests?: string;
}

export default function useOrderData() {
  const [orderData, setOrderData] = useState<OrderData>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const room = useRoomContext();

  useEffect(() => {
    const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000';
    const roomId = (room as any)?.name || (room as any)?.room?.name;

    if (!roomId || roomId === 'unknown-room') return;

    const fetchOrderData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${backendBase}/rooms/${roomId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          setOrderData(data.order || {});
        } else if (response.status === 404) {
          // Room not found yet, this is normal for new sessions
          setOrderData({});
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (error) {
        console.error('Failed to fetch order data:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch order data');
      } finally {
        setLoading(false);
      }
    };

    // Fetch immediately
    fetchOrderData();

    // Set up polling every 3 seconds for real-time updates
    const interval = setInterval(fetchOrderData, 3000);

    return () => clearInterval(interval);
  }, [room]);

  return { orderData, loading, error };
}
