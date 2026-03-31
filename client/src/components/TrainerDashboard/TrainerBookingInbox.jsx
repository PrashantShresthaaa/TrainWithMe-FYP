import React, { useState, useEffect } from 'react';
import {
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  Video,
  MapPin,
  Loader,
  AlertCircle,
  Inbox,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const statusStyles = {
  pending: 'bg-amber-50 text-amber-600 border-amber-200',
  accepted_awaiting_payment: 'bg-orange-50 text-orange-600 border-orange-200',
  confirmed: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  rejected: 'bg-red-50 text-red-500 border-red-200',
  cancelled: 'bg-gray-100 text-gray-500 border-gray-200',
  completed: 'bg-blue-50 text-blue-600 border-blue-200',
};

const paymentStyles = {
  unpaid: 'bg-gray-100 text-gray-500 border-gray-200',
  pending: 'bg-amber-50 text-amber-600 border-amber-200',
  paid: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  failed: 'bg-red-50 text-red-500 border-red-200',
  refunded: 'bg-blue-50 text-blue-600 border-blue-200',
};

const formatStatusLabel = (value) => value.replace(/_/g, ' ');

const TrainerBookingInbox = () => {
  const { getToken } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const fetchBookings = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/bookings', {
        headers: { Authorization: `Bearer ${getToken()}` },
      });

      if (!res.ok) {
        throw new Error('Failed to load bookings');
      }

      const data = await res.json();
      setBookings(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const updateStatus = async (bookingId, newStatus) => {
    setUpdatingId(bookingId);

    try {
      const res = await fetch(`http://localhost:5000/api/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to update status');
      }

      setBookings((prev) => prev.map((b) => (b._id === bookingId ? data : b)));
    } catch (err) {
      alert(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <Loader size={28} className="animate-spin text-brandOrange" />
          <p className="text-sm text-gray-400 font-semibold">Loading requests...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-2 text-red-500">
          <AlertCircle size={28} />
          <p className="text-sm font-semibold">{error}</p>
        </div>
      </div>
    );
  }

  const pending = bookings.filter((b) => b.status === 'pending');
  const others = bookings.filter((b) => b.status !== 'pending');

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white p-5 rounded-2xl border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900">Booking Requests</h2>
        <p className="text-gray-400 text-sm mt-0.5">
          {pending.length > 0
            ? `You have ${pending.length} pending request${pending.length > 1 ? 's' : ''} waiting for your response.`
            : 'No pending requests right now.'}
        </p>
      </div>

      {pending.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 px-1">
            Pending ({pending.length})
          </h3>
          <div className="flex flex-col gap-4">
            {pending.map((booking) => (
              <BookingCard
                key={booking._id}
                booking={booking}
                onUpdate={updateStatus}
                isUpdating={updatingId === booking._id}
                showActions={true}
              />
            ))}
          </div>
        </div>
      )}

      {others.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 px-1">
            All Requests
          </h3>
          <div className="flex flex-col gap-4">
            {others.map((booking) => (
              <BookingCard
                key={booking._id}
                booking={booking}
                onUpdate={updateStatus}
                isUpdating={updatingId === booking._id}
                showActions={false}
              />
            ))}
          </div>
        </div>
      )}

      {bookings.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-gray-400">
          <Inbox size={48} className="mb-4 text-gray-300" />
          <p className="text-lg font-bold text-gray-500">No booking requests yet</p>
          <p className="text-sm mt-1">When clients book you, their requests will appear here.</p>
        </div>
      )}
    </div>
  );
};

const BookingCard = ({ booking, onUpdate, isUpdating, showActions }) => {
  const clientName = booking.client?.name || 'Unknown Client';
  const clientEmail = booking.client?.email || '';

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-gray-200 transition">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex items-center gap-4 flex-1">
            <div className="w-11 h-11 rounded-xl bg-brandOrange/10 text-brandOrange flex items-center justify-center font-bold text-sm">
              {clientName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-bold text-gray-800">{clientName}</p>
              <p className="text-xs text-gray-400">{clientEmail}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
            <span className="flex items-center gap-1 bg-gray-50 px-3 py-1.5 rounded-lg">
              <Calendar size={12} /> {booking.sessionDate}
            </span>
            <span className="flex items-center gap-1 bg-gray-50 px-3 py-1.5 rounded-lg">
              <Clock size={12} /> {booking.sessionTime}
            </span>
            <span className="flex items-center gap-1 bg-gray-50 px-3 py-1.5 rounded-lg">
              {booking.sessionType === 'Online' ? <Video size={12} /> : <MapPin size={12} />}
              {booking.sessionType}
            </span>
            <span className="bg-gray-50 px-3 py-1.5 rounded-lg font-semibold text-gray-700">
              Rs. {booking.totalAmount || booking.price}
            </span>
          </div>

          <span className={`px-3 py-1.5 rounded-lg text-xs font-bold border capitalize ${statusStyles[booking.status] || 'bg-gray-100 text-gray-500 border-gray-200'}`}>
            {formatStatusLabel(booking.status)}
          </span>

          {showActions && (
            <div className="flex gap-2">
              <button
                onClick={() => onUpdate(booking._id, 'accepted_awaiting_payment')}
                disabled={isUpdating}
                className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdating ? <Loader size={12} className="animate-spin" /> : <CheckCircle size={14} />}
                Accept
              </button>
              <button
                onClick={() => onUpdate(booking._id, 'rejected')}
                disabled={isUpdating}
                className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-500 px-4 py-2 rounded-xl text-xs font-bold border border-red-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdating ? <Loader size={12} className="animate-spin" /> : <XCircle size={14} />}
                Reject
              </button>
            </div>
          )}

          {booking.status === 'confirmed' && (
            <button
              onClick={() => onUpdate(booking._id, 'completed')}
              disabled={isUpdating}
              className="flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 px-4 py-2 rounded-xl text-xs font-bold border border-blue-200 transition disabled:opacity-50"
            >
              {isUpdating ? <Loader size={12} className="animate-spin" /> : <CheckCircle size={14} />}
              Mark Complete
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className={`px-3 py-1.5 rounded-lg border font-bold ${paymentStyles[booking.paymentStatus] || 'bg-gray-100 text-gray-500 border-gray-200'}`}>
            Payment: {booking.paymentStatus || 'unpaid'}
          </span>

          {booking.platformFee > 0 && (
            <span className="px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-600 font-semibold">
              App Fee: Rs. {booking.platformFee}
            </span>
          )}

          {booking.trainerEarning > 0 && (
            <span className="px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-600 font-semibold">
              Trainer Share: Rs. {booking.trainerEarning}
            </span>
          )}
        </div>
      </div>

      {booking.notes && (
        <div className="mt-4 pt-4 border-t border-gray-50">
          <p className="text-xs text-gray-400 font-bold uppercase mb-1">Client Notes</p>
          <p className="text-sm text-gray-600">{booking.notes}</p>
        </div>
      )}
    </div>
  );
};

export default TrainerBookingInbox;
