import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  Inbox,
  Loader,
  MapPin,
  Package,
  Search,
  SlidersHorizontal,
  Video,
  XCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const statusStyles = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  accepted_awaiting_payment: 'bg-orange-50 text-orange-700 border-orange-200',
  confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-red-50 text-red-600 border-red-200',
  cancelled: 'bg-gray-100 text-gray-500 border-gray-200',
  completed: 'bg-blue-50 text-blue-700 border-blue-200',
};

const statusOptions = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'accepted_awaiting_payment', label: 'Awaiting Payment' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'completed', label: 'Completed' },
];

const sessionTypeOptions = ['All Types', 'Online', 'Offline'];

const formatStatusLabel = (value) => value.replace(/_/g, ' ');

const getBookingFormat = (booking) => {
  const notes = booking.notes || '';
  const isPackage = notes.startsWith('Package:');

  if (!isPackage) {
    return { label: 'Single Session', isPackage: false };
  }

  const packageName = notes.replace(/^Package:\s*/, '').split(/[—-]/)[0].trim();

  return {
    label: packageName ? `Package: ${packageName}` : 'Package Booking',
    isPackage: true,
  };
};

const parseDateValue = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatSessionDate = (value) => {
  const parsed = parseDateValue(value);
  if (!parsed) return value || 'Unscheduled';

  return parsed.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
};

const sortBookings = (items, sortBy) => {
  const sorted = [...items];

  if (sortBy === 'session_asc') {
    sorted.sort((a, b) => {
      const first = parseDateValue(a.sessionDate)?.getTime() || 0;
      const second = parseDateValue(b.sessionDate)?.getTime() || 0;
      return first - second;
    });
    return sorted;
  }

  if (sortBy === 'session_desc') {
    sorted.sort((a, b) => {
      const first = parseDateValue(a.sessionDate)?.getTime() || 0;
      const second = parseDateValue(b.sessionDate)?.getTime() || 0;
      return second - first;
    });
    return sorted;
  }

  sorted.sort((a, b) => {
    const first = new Date(b.createdAt || b.updatedAt || 0).getTime();
    const second = new Date(a.createdAt || a.updatedAt || 0).getTime();
    return first - second;
  });

  return sorted;
};

const TrainerBookingInbox = () => {
  const { getToken } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sessionTypeFilter, setSessionTypeFilter] = useState('All Types');
  const [sortBy, setSortBy] = useState('recent');

  const fetchBookings = async () => {
    try {
      setError('');
      const res = await fetch('http://localhost:5000/api/bookings', {
        headers: { Authorization: `Bearer ${getToken()}` },
      });

      if (!res.ok) {
        throw new Error('Failed to load bookings');
      }

      const data = await res.json();
      setBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [getToken]);

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

      setBookings((prev) => prev.map((booking) => (booking._id === bookingId ? data : booking)));
    } catch (err) {
      alert(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const summaryCounts = {
    pending: bookings.filter((booking) => booking.status === 'pending').length,
    awaitingPayment: bookings.filter(
      (booking) => booking.status === 'accepted_awaiting_payment'
    ).length,
    confirmed: bookings.filter((booking) => booking.status === 'confirmed').length,
    completed: bookings.filter((booking) => booking.status === 'completed').length,
  };

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredBookings = sortBookings(
    bookings.filter((booking) => {
      const clientName = booking.client?.name?.toLowerCase() || '';
      const clientEmail = booking.client?.email?.toLowerCase() || '';
      const sessionType = booking.sessionType || '';

      const matchesQuery =
        !normalizedQuery ||
        clientName.includes(normalizedQuery) ||
        clientEmail.includes(normalizedQuery);

      const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
      const matchesSessionType =
        sessionTypeFilter === 'All Types' || sessionType === sessionTypeFilter;

      return matchesQuery && matchesStatus && matchesSessionType;
    }),
    sortBy
  );

  const hasActiveFilters =
    searchQuery.trim() ||
    statusFilter !== 'all' ||
    sessionTypeFilter !== 'All Types' ||
    sortBy !== 'recent';

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-gray-200 bg-white">
        <div className="flex flex-col items-center gap-3">
          <Loader size={28} className="animate-spin text-brandOrange" />
          <p className="text-sm font-semibold text-gray-400">Loading requests...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-red-100 bg-white">
        <div className="flex flex-col items-center gap-2 text-red-500">
          <AlertCircle size={28} />
          <p className="text-sm font-semibold">{error}</p>
        </div>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white px-6 py-20">
        <div className="flex flex-col items-center justify-center text-center text-gray-400">
          <Inbox size={48} className="mb-4 text-gray-300" />
          <p className="text-lg font-bold text-gray-500">No booking requests yet</p>
          <p className="mt-1 text-sm">When clients book you, their requests will appear here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <div className="flex flex-col gap-5 border-b border-gray-100 px-5 py-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400">
              Requests Inbox
            </p>
            <h2 className="mt-1 text-xl font-bold text-[#111111]">Review and manage bookings</h2>
            <p className="mt-1 text-sm text-gray-500">
              Filter requests by client, status, and session type to find what you need faster.
            </p>
          </div>

          <div className="flex flex-wrap items-end gap-6">
            <SummaryStat label="Pending" value={summaryCounts.pending} tone="orange" />
            <SummaryStat
              label="Awaiting Payment"
              value={summaryCounts.awaitingPayment}
              tone="amber"
            />
            <SummaryStat label="Confirmed" value={summaryCounts.confirmed} tone="green" />
            <SummaryStat label="Completed" value={summaryCounts.completed} tone="slate" />
          </div>
        </div>

        <div className="space-y-4 px-5 py-4">
          <div className="grid gap-3 lg:grid-cols-[1.2fr_auto_auto_auto]">
            <label className="relative block">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search by client name or email"
                className="w-full rounded-md border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm text-[#111111] outline-none transition focus:border-[#FF6700]/35"
              />
            </label>

            <select
              value={sessionTypeFilter}
              onChange={(event) => setSessionTypeFilter(event.target.value)}
              className="rounded-md border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-600 outline-none transition focus:border-[#FF6700]/35"
            >
              {sessionTypeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="rounded-md border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-600 outline-none transition focus:border-[#FF6700]/35"
            >
              <option value="recent">Newest first</option>
              <option value="session_asc">Session date: earliest</option>
              <option value="session_desc">Session date: latest</option>
            </select>

            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setSessionTypeFilter('All Types');
                setSortBy('recent');
              }}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-gray-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-600 transition hover:border-[#FF6700]/25 hover:text-[#FF6700]"
            >
              <SlidersHorizontal size={15} />
              Reset
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {statusOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setStatusFilter(option.id)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  statusFilter === option.id
                    ? 'bg-[#FF6700] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-orange-50 hover:text-[#FF6700]'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <div className="flex flex-col gap-2 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-[12px] font-bold uppercase tracking-[0.16em] text-[#111111]">
              All Requests
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Showing {filteredBookings.length} of {bookings.length} request
              {bookings.length !== 1 ? 's' : ''}.
            </p>
          </div>

          {hasActiveFilters ? (
            <p className="text-xs font-semibold text-[#FF6700]">Filters applied</p>
          ) : null}
        </div>

        {filteredBookings.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <p className="text-base font-bold text-[#111111]">No matching requests</p>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting the client search, status, or session type filters.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredBookings.map((booking) => (
              <BookingCard
                key={booking._id}
                booking={booking}
                onUpdate={updateStatus}
                isUpdating={updatingId === booking._id}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

const SummaryStat = ({ label, value, tone }) => {
  const tones = {
    orange: 'text-[#FF6700]',
    amber: 'text-amber-700',
    green: 'text-emerald-700',
    slate: 'text-slate-700',
  };

  return (
    <div className="min-w-[96px]">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400">{label}</p>
      <p className={`mt-1 text-[24px] font-bold tracking-tight ${tones[tone]}`}>{value}</p>
    </div>
  );
};

const BookingCard = ({ booking, onUpdate, isUpdating }) => {
  const clientName = booking.client?.name || 'Unknown Client';
  const clientEmail = booking.client?.email || '';
  const canAcceptOrReject = booking.status === 'pending';
  const canMarkComplete = booking.status === 'confirmed';
  const isCompleted = booking.status === 'completed';
  const bookingFormat = getBookingFormat(booking);

  return (
    <div className="px-5 py-4 transition hover:bg-gray-50/60">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-md bg-[#FF6700]/10 text-sm font-bold text-[#FF6700]">
                {clientName.charAt(0).toUpperCase()}
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-[#111111]">{clientName}</p>
                <p className="truncate text-xs text-gray-400">{clientEmail}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-md border px-2.5 py-1 text-[11px] font-bold capitalize ${
                  statusStyles[booking.status] || 'bg-gray-100 text-gray-500 border-gray-200'
                }`}
              >
                {formatStatusLabel(booking.status)}
              </span>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <MetaPill icon={<Calendar size={13} />} label={formatSessionDate(booking.sessionDate)} />
            <MetaPill icon={<Clock size={13} />} label={booking.sessionTime || 'Time not set'} />
            <MetaPill
              icon={booking.sessionType === 'Online' ? <Video size={13} /> : <MapPin size={13} />}
              label={booking.sessionType || 'Session'}
            />
            <MetaPill
              icon={bookingFormat.isPackage ? <Package size={13} /> : null}
              label={bookingFormat.label}
            />
            <MetaPill label={`Rs. ${booking.totalAmount || booking.price || 0}`} strong />
          </div>

          {booking.notes ? (
            <div className="mt-4 rounded-md border border-gray-200 bg-[#FAFAFA] px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400">
                Client Notes
              </p>
              <p className="mt-1 text-sm leading-6 text-gray-600">{booking.notes}</p>
            </div>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-wrap gap-2 xl:w-[210px] xl:flex-col">
          {canAcceptOrReject ? (
            <>
              <button
                onClick={() => onUpdate(booking._id, 'accepted_awaiting_payment')}
                disabled={isUpdating}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isUpdating ? (
                  <Loader size={14} className="animate-spin" />
                ) : (
                  <CheckCircle size={15} />
                )}
                Accept
              </button>

              <button
                onClick={() => onUpdate(booking._id, 'rejected')}
                disabled={isUpdating}
                className="inline-flex items-center justify-center gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isUpdating ? (
                  <Loader size={14} className="animate-spin" />
                ) : (
                  <XCircle size={15} />
                )}
                Reject
              </button>
            </>
          ) : null}

          {canMarkComplete ? (
            <button
              onClick={() => onUpdate(booking._id, 'completed')}
              disabled={isUpdating}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isUpdating ? (
                <Loader size={14} className="animate-spin" />
              ) : (
                <CheckCircle size={15} />
              )}
              Mark Complete
            </button>
          ) : null}

          {isCompleted ? (
            <button
              type="button"
              disabled
              className="inline-flex items-center justify-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 opacity-90"
            >
              <CheckCircle size={15} />
              Completed
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
};

const MetaPill = ({ icon, label, strong = false }) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-md border border-gray-200 px-3 py-1.5 text-[11px] ${
      strong ? 'bg-[#111111] text-white' : 'bg-white text-gray-600'
    }`}
  >
    {icon ? <span className={strong ? 'text-white/75' : 'text-gray-400'}>{icon}</span> : null}
    <span className={strong ? 'font-semibold' : 'font-medium'}>{label}</span>
  </span>
);

export default TrainerBookingInbox;
