import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

const API = 'http://localhost:5000';
const PAYMENT_SYNC_KEY = 'twm_payment_update';

const KhaltiCallback = () => {
  const [searchParams] = useSearchParams();
  const [message, setMessage] = useState('Verifying your payment...');
  const channelRef = useRef(null);

  useEffect(() => {
    if ('BroadcastChannel' in window) {
      channelRef.current = new BroadcastChannel('twm-payments');
    }

    const notifyMainTab = (payload) => {
      try {
        localStorage.setItem(PAYMENT_SYNC_KEY, JSON.stringify(payload));
      } catch {}

      try {
        channelRef.current?.postMessage(payload);
      } catch {}
    };

    const verifyPayment = async () => {
      const pidx = searchParams.get('pidx');
      const purchaseOrderId = searchParams.get('purchase_order_id');
      const user = JSON.parse(localStorage.getItem('user') || '{}');

      if (!pidx || !purchaseOrderId || !user?.token) {
        setMessage('Missing payment details. You can close this tab.');
        return;
      }

      try {
        const res = await fetch(`${API}/api/payments/khalti/verify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${user.token}`,
          },
          body: JSON.stringify({
            pidx,
            bookingId: purchaseOrderId,
          }),
        });

        const contentType = res.headers.get('content-type') || '';
        const data = contentType.includes('application/json')
          ? await res.json()
          : { message: await res.text() };

        if (!res.ok) {
          throw new Error(data.message || 'Payment verification failed');
        }

        notifyMainTab({
          type: 'payment_verified',
          bookingId: purchaseOrderId,
          pidx,
          at: Date.now(),
        });

        setMessage('Payment successful. Your booking has been confirmed. You can close this tab.');
      } catch (err) {
        setMessage(err.message || 'Payment verification failed. You can close this tab and try again.');
      }
    };

    verifyPayment();

    return () => {
      channelRef.current?.close();
    };
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-[#F7F9FC] flex items-center justify-center px-4">
      <div className="bg-white border border-gray-100 rounded-3xl shadow-sm px-8 py-10 text-center max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Khalti Payment</h1>
        <p className="text-sm text-gray-500">{message}</p>
      </div>
    </div>
  );
};

export default KhaltiCallback;
