import React, { useEffect, useRef, useState } from 'react';
import {
  Calendar,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  CreditCard,
  Loader,
  MapPin,
  Package,
  Phone,
  PhoneOff,
  Search,
  SlidersHorizontal,
  User,
  Video,
  XCircle,
} from 'lucide-react';
import { io } from 'socket.io-client';

const API = 'http://localhost:5000';
const PAYMENT_SYNC_KEY = 'twm_payment_update';

const statusStyles = {
  pending: { pill: 'bg-amber-50 text-amber-600 border border-amber-200', label: 'Pending' },
  accepted_awaiting_payment: {
    pill: 'bg-orange-50 text-orange-600 border border-orange-200',
    label: 'Awaiting Payment',
  },
  confirmed: { pill: 'bg-emerald-50 text-emerald-600 border border-emerald-200', label: 'Confirmed' },
  rejected: { pill: 'bg-red-50 text-red-500 border border-red-200', label: 'Rejected' },
  cancelled: { pill: 'bg-gray-100 text-gray-500 border border-gray-200', label: 'Cancelled' },
  completed: { pill: 'bg-blue-50 text-blue-600 border border-blue-200', label: 'Completed' },
};

const sessionStatusStyles = {
  scheduled: 'bg-amber-50 text-amber-700 border border-amber-200',
  live: 'bg-green-50 text-green-700 border border-green-200',
  completed: 'bg-blue-50 text-blue-700 border border-blue-200',
  missed: 'bg-red-50 text-red-600 border border-red-200',
};

const scopeOptions = [
  { id: 'active', label: 'Active Trainers' },
  { id: 'all', label: 'All Trainers' },
];

const bookingTypeOptions = [
  { id: 'all', label: 'All Sessions' },
  { id: 'online', label: 'Online' },
  { id: 'offline', label: 'Offline' },
];

const parseDateValue = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatSessionDate = (value) => {
  const parsed = parseDateValue(value);
  if (!parsed) return value || 'Date not set';
  return parsed.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
};

const getBookingFormat = (booking) => {
  const notes = booking.notes || '';
  const isPackage = notes.startsWith('Package:');

  if (!isPackage) {
    return { label: 'Single Session', isPackage: false };
  }

  const normalizedNotes = notes.replace(/\u2013|\u2014/g, '-');
  const packageName = normalizedNotes.replace(/^Package:\s*/, '').split('-')[0].trim();

  return {
    label: packageName ? `Package: ${packageName}` : 'Package Booking',
    isPackage: true,
  };
};

export default function MyTrainersView() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trainerScope, setTrainerScope] = useState('active');
  const [bookingTypeFilter, setBookingTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTrainers, setExpandedTrainers] = useState({});
  const [sessions, setSessions] = useState({});
  const [incomingCall, setIncomingCall] = useState(null);
  const [callDeclined, setCallDeclined] = useState(null);
  const [payingId, setPayingId] = useState(null);

  const socketRef = useRef(null);
  const ringtoneRef = useRef(null);
  const paymentChannelRef = useRef(null);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const authHeader = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${currentUser?.token}`,
  };

  const playRingtone = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const ring = () => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 480;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.8);
      };
      ring();
      ringtoneRef.current = { ctx, interval: setInterval(ring, 1500) };
    } catch {}
  };

  const stopRingtone = () => {
    if (!ringtoneRef.current) return;
    clearInterval(ringtoneRef.current.interval);
    try {
      ringtoneRef.current.ctx.close();
    } catch {}
    ringtoneRef.current = null;
  };

  const openCallTab = (roomId, remoteUser, isInitiator, isOfficialSession) => {
    const cu = JSON.parse(localStorage.getItem('user') || '{}');
    const params = new URLSearchParams({
      roomId,
      remoteUserId: remoteUser._id,
      remoteUserName: remoteUser.name,
      isInitiator: isInitiator ? '1' : '0',
      isOfficialSession: isOfficialSession ? '1' : '0',
      currentUserId: cu._id,
      currentUserName: cu.name,
      token: cu.token,
    });
    window.open(`/call?${params.toString()}`, '_blank', 'width=960,height=680,noopener');
  };

  const fetchBookings = async () => {
    try {
      const res = await fetch(`${API}/api/bookings`, { headers: authHeader });
      if (res.ok) {
        setBookings(await res.json());
      }
    } catch {}
    setLoading(false);
  };

  const loadSession = async (bookingId) => {
    if (sessions[bookingId] !== undefined) return;
    setSessions((prev) => ({ ...prev, [bookingId]: 'loading' }));
    try {
      const res = await fetch(`${API}/api/sessions/booking/${bookingId}`, { headers: authHeader });
      const data = res.ok ? await res.json() : null;
      setSessions((prev) => ({ ...prev, [bookingId]: data }));
    } catch {
      setSessions((prev) => ({ ...prev, [bookingId]: null }));
    }
  };

  const startOfficialSession = async (booking) => {
    let session = sessions[booking._id];
    if (!session || session === 'loading') {
      try {
        const res = await fetch(`${API}/api/sessions/booking/${booking._id}`, { headers: authHeader });
        session = await res.json();
        setSessions((prev) => ({ ...prev, [booking._id]: session }));
      } catch {
        return;
      }
    }

    const trainer = booking.trainer;
    socketRef.current?.emit('call:initiate', {
      toUserId: trainer._id || trainer,
      fromUserId: currentUser._id,
      fromUserName: currentUser.name,
      roomId: session.roomId,
      isOfficialSession: true,
    });

    openCallTab(
      session.roomId,
      { _id: trainer._id || trainer, name: trainer.name || 'Trainer' },
      true,
      true
    );
  };

  const acceptCall = () => {
    if (!incomingCall) return;
    stopRingtone();
    socketRef.current?.emit('call:accepted', {
      toUserId: incomingCall.fromUserId,
      roomId: incomingCall.roomId,
      remoteUserId: currentUser._id,
      remoteUserName: currentUser.name,
      isOfficialSession: incomingCall.isOfficialSession,
    });
    openCallTab(
      incomingCall.roomId,
      { _id: incomingCall.fromUserId, name: incomingCall.fromUserName },
      false,
      incomingCall.isOfficialSession
    );
    setIncomingCall(null);
  };

  const declineCall = () => {
    if (!incomingCall) return;
    stopRingtone();
    socketRef.current?.emit('call:declined', {
      toUserId: incomingCall.fromUserId,
      roomId: incomingCall.roomId,
      fromUserName: currentUser.name,
    });
    setIncomingCall(null);
  };

  const cancelBooking = async (bookingId) => {
    try {
      await fetch(`${API}/api/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: authHeader,
        body: JSON.stringify({ status: 'cancelled' }),
      });
      fetchBookings();
    } catch {}
  };

  const startKhaltiPayment = async (bookingId) => {
    const paymentTab = window.open('', '_blank');

    if (!paymentTab) {
      alert('Please allow popups to continue with Khalti payment.');
      return;
    }

    paymentTab.document.write(`
      <html>
        <head><title>Opening Khalti...</title></head>
        <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
          <div style="text-align: center;">
            <h2>Opening Khalti Payment...</h2>
            <p>Please wait.</p>
          </div>
        </body>
      </html>
    `);
    paymentTab.document.close();

    setPayingId(bookingId);

    try {
      const res = await fetch(`${API}/api/payments/khalti/initiate`, {
        method: 'POST',
        headers: authHeader,
        body: JSON.stringify({ bookingId }),
      });

      const contentType = res.headers.get('content-type') || '';
      const data = contentType.includes('application/json')
        ? await res.json()
        : { message: await res.text() };

      if (!res.ok) {
        paymentTab.close();
        throw new Error(data.message || 'Failed to initiate payment');
      }

      if (data.payment_url) {
        paymentTab.location.href = data.payment_url;
        return;
      }

      paymentTab.close();
      throw new Error('Khalti payment URL not received');
    } catch (error) {
      try {
        paymentTab.close();
      } catch {}
      alert(error.message || 'Unable to start payment');
      setPayingId(null);
    }
  };

  useEffect(() => {
    fetchBookings();

    const socket = io(API, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => socket.emit('join', currentUser?._id));

    socket.on('call:incoming', ({ fromUserId, fromUserName, roomId, isOfficialSession }) => {
      setIncomingCall({ fromUserId, fromUserName, roomId, isOfficialSession });
      playRingtone();
    });

    socket.on('call:declined', ({ fromUserName }) => {
      setCallDeclined({ name: fromUserName || 'They' });
      setTimeout(() => setCallDeclined(null), 4000);
    });

    socket.on('call:accepted', ({ roomId, remoteUserId, remoteUserName, isOfficialSession }) => {
      openCallTab(roomId, { _id: remoteUserId, name: remoteUserName }, true, isOfficialSession);
    });

    const onStorage = (event) => {
      if (event.key !== PAYMENT_SYNC_KEY || !event.newValue) return;
      try {
        const payload = JSON.parse(event.newValue);
        if (payload.type === 'payment_verified') {
          setPayingId(null);
          fetchBookings();
        }
      } catch {}
    };

    window.addEventListener('storage', onStorage);

    if ('BroadcastChannel' in window) {
      paymentChannelRef.current = new BroadcastChannel('twm-payments');
      paymentChannelRef.current.onmessage = (event) => {
        if (event.data?.type === 'payment_verified') {
          setPayingId(null);
          fetchBookings();
        }
      };
    }

    return () => {
      socket.disconnect();
      window.removeEventListener('storage', onStorage);
      paymentChannelRef.current?.close();
    };
  }, []);

  useEffect(() => {
    bookings
      .filter((booking) => booking.sessionType === 'Online' && booking.status === 'confirmed')
      .forEach((booking) => loadSession(booking._id));
  }, [bookings]);

  const totalTrainers = new Set(
    bookings
      .map((booking) => (booking.trainer?._id || booking.trainer || '').toString())
      .filter(Boolean)
  ).size;
  const activeTrainers = new Set(
    bookings
      .filter(
        (booking) =>
          booking.status === 'confirmed' ||
          booking.status === 'pending' ||
          booking.status === 'accepted_awaiting_payment'
      )
      .map((booking) => (booking.trainer?._id || booking.trainer || '').toString())
      .filter(Boolean)
  ).size;
  const onlineTrainers = new Set(
    bookings
      .filter((booking) => booking.sessionType === 'Online')
      .map((booking) => (booking.trainer?._id || booking.trainer || '').toString())
      .filter(Boolean)
  ).size;
  const completedSessions = bookings.filter((booking) => booking.status === 'completed').length;

  const scopedBookings =
    trainerScope === 'active'
      ? bookings.filter(
          (booking) =>
            booking.status === 'confirmed' ||
            booking.status === 'pending' ||
            booking.status === 'accepted_awaiting_payment'
        )
      : bookings;

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredBookings = scopedBookings.filter((booking) => {
    const trainerName = booking.trainer?.name?.toLowerCase() || '';
    const trainerEmail = booking.trainer?.email?.toLowerCase() || '';
    const matchesQuery =
      !normalizedQuery ||
      trainerName.includes(normalizedQuery) ||
      trainerEmail.includes(normalizedQuery);

    const matchesType =
      bookingTypeFilter === 'all' ||
      (bookingTypeFilter === 'online' && booking.sessionType === 'Online') ||
      (bookingTypeFilter === 'offline' && booking.sessionType !== 'Online');

    return matchesQuery && matchesType;
  });

  const trainerMap = filteredBookings.reduce((acc, booking) => {
    const trainerId = (booking.trainer?._id || booking.trainer || '').toString();
    if (!trainerId) return acc;

    if (!acc[trainerId]) acc[trainerId] = { trainer: booking.trainer, bookings: [] };
    acc[trainerId].bookings.push(booking);
    return acc;
  }, {});

  const trainers = Object.values(trainerMap)
    .map((entry) => ({
      ...entry,
      bookings: [...entry.bookings].sort(
        (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      ),
    }))
    .sort((a, b) => a.trainer?.name?.localeCompare(b.trainer?.name || '') || 0);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-gray-200 bg-white">
        <Loader size={28} className="animate-spin text-brandOrange" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <div className="flex flex-col gap-5 border-b border-gray-100 px-5 py-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400">
              Trainer Directory
            </p>
            <h2 className="mt-1 text-xl font-bold text-[#111111]">Manage your trainer bookings</h2>
            <p className="mt-1 text-sm text-gray-500">
              Search trainers, filter bookings, and keep payments and online sessions in one place.
            </p>
          </div>

          <div className="grid gap-x-4 gap-y-3 sm:grid-cols-2 xl:grid-cols-4 lg:w-auto lg:justify-items-start">
            <SummaryStat label="Total Trainers" value={totalTrainers} tone="orange" />
            <SummaryStat label="Active Trainers" value={activeTrainers} tone="green" />
            <SummaryStat label="Online Trainers" value={onlineTrainers} tone="slate" />
            <SummaryStat label="Completed" value={completedSessions} tone="blue" />
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
                placeholder="Search by trainer name or email"
                className="w-full rounded-md border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm text-[#111111] outline-none transition focus:border-[#FF6700]/35"
              />
            </label>

            <select
              value={trainerScope}
              onChange={(event) => setTrainerScope(event.target.value)}
              className="rounded-md border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-600 outline-none transition focus:border-[#FF6700]/35"
            >
              {scopeOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              value={bookingTypeFilter}
              onChange={(event) => setBookingTypeFilter(event.target.value)}
              className="rounded-md border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-600 outline-none transition focus:border-[#FF6700]/35"
            >
              {bookingTypeOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setTrainerScope('active');
                setBookingTypeFilter('all');
              }}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-gray-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-600 transition hover:border-[#FF6700]/25 hover:text-[#FF6700]"
            >
              <SlidersHorizontal size={15} />
              Reset
            </button>
          </div>
        </div>
      </section>

      {trainers.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white px-6 py-20">
          <div className="flex flex-col items-center justify-center text-center">
            <User size={40} className="mb-3 text-gray-200" />
            <p className="text-lg font-bold text-gray-500">No trainers found</p>
            <p className="mt-1 text-sm text-gray-400">
              Try adjusting the filters or book a new session to get started.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {trainers.map(({ trainer, bookings: trainerBookings }) => {
            const trainerId = (trainer?._id || trainer || '').toString();
            const trainerName = trainer?.name || 'Trainer';
            const trainerEmail = trainer?.email || '';
            const latest = trainerBookings[0];
            const confirmedCount = trainerBookings.filter((booking) => booking.status === 'confirmed').length;
            const completedCount = trainerBookings.filter((booking) => booking.status === 'completed').length;
            const pendingCount = trainerBookings.filter(
              (booking) =>
                booking.status === 'pending' || booking.status === 'accepted_awaiting_payment'
            ).length;
            const onlineReady = trainerBookings
              .filter((booking) => booking.sessionType === 'Online' && booking.status === 'confirmed')
              .sort((a, b) => {
                const first = parseDateValue(a.sessionDate)?.getTime() || 0;
                const second = parseDateValue(b.sessionDate)?.getTime() || 0;
                return first - second;
              });

            const primaryOnline = onlineReady[0] || null;
            const additionalOnlineCount = Math.max(onlineReady.length - 1, 0);
            const primarySession = primaryOnline ? sessions[primaryOnline._id] : null;
            const latestFormat = getBookingFormat(latest);
            const isExpanded = Boolean(expandedTrainers[trainerId]);

            return (
              <section
                key={trainerId || trainerName}
                className="overflow-hidden rounded-lg border border-gray-200 bg-white"
              >
                <div className="px-5 py-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-md bg-[#FF6700]/10 text-lg font-bold text-[#FF6700]">
                          {trainerName.charAt(0).toUpperCase()}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-[#111111]">{trainerName}</p>
                          <p className="truncate text-xs text-gray-400">{trainerEmail}</p>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <MetaPill label={`${confirmedCount} upcoming`} accent="green" />
                        <MetaPill label={`${pendingCount} pending`} accent="amber" />
                        <MetaPill label={`${completedCount} completed`} accent="blue" />
                        <MetaPill label={`${trainerBookings.length} bookings`} />
                        <MetaPill
                          icon={latest?.sessionType === 'Online' ? <Video size={13} /> : <MapPin size={13} />}
                          label={latest?.sessionType || 'Session'}
                        />
                        <MetaPill
                          icon={latestFormat.isPackage ? <Package size={13} /> : null}
                          label={latestFormat.label}
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-md px-2.5 py-1 text-[11px] font-bold ${
                          (statusStyles[latest?.status] || statusStyles.pending).pill
                        }`}
                      >
                        {(statusStyles[latest?.status] || statusStyles.pending).label}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          setExpandedTrainers((prev) => ({ ...prev, [trainerId]: !prev[trainerId] }))
                        }
                        className="inline-flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-600 transition hover:border-[#FF6700]/25 hover:text-[#FF6700]"
                      >
                        {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                        {isExpanded ? 'Hide History' : 'View History'}
                      </button>
                    </div>
                  </div>

                  {primaryOnline ? (
                    <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50/70 px-4 py-3">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-blue-700">
                            <Video size={13} />
                            Next Online Session
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <MetaPill
                              icon={<Calendar size={13} />}
                              label={formatSessionDate(primaryOnline.sessionDate)}
                              subtle
                            />
                            <MetaPill
                              icon={<Clock size={13} />}
                              label={primaryOnline.sessionTime || 'Time not set'}
                              subtle
                            />
                            <MetaPill
                              label={`Rs. ${primaryOnline.totalAmount || primaryOnline.price || 0}`}
                              strong
                            />
                            {additionalOnlineCount > 0 ? (
                              <MetaPill label={`+${additionalOnlineCount} more online`} subtle />
                            ) : null}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {primarySession && primarySession !== 'loading' ? (
                            <span
                              className={`rounded-md border px-2.5 py-1 text-[11px] font-bold ${
                                sessionStatusStyles[primarySession.sessionStatus] || ''
                              }`}
                            >
                              {primarySession.sessionStatus}
                            </span>
                          ) : null}

                          {(!primarySession ||
                            primarySession === 'loading' ||
                            primarySession?.sessionStatus === 'scheduled') && (
                            <button
                              onClick={() => startOfficialSession(primaryOnline)}
                              disabled={primarySession === 'loading'}
                              className="inline-flex items-center justify-center gap-2 rounded-md bg-[#FF6700] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-50"
                            >
                              <Video size={15} />
                              Join Session
                            </button>
                          )}

                          {primarySession?.sessionStatus === 'live' && (
                            <button
                              onClick={() => startOfficialSession(primaryOnline)}
                              className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600"
                            >
                              <Video size={15} />
                              Rejoin Live Session
                            </button>
                          )}

                          {primarySession?.sessionStatus === 'completed' && (
                            <div className="inline-flex items-center gap-2 rounded-md border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-blue-700">
                              <CheckCircle size={15} />
                              Completed
                              {primarySession.durationMinutes
                                ? ` ${primarySession.durationMinutes} min`
                                : ''}
                            </div>
                          )}

                          {primarySession?.sessionStatus === 'missed' && (
                            <div className="inline-flex items-center gap-2 rounded-md border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600">
                              <XCircle size={15} />
                              Missed
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {latest?.notes ? (
                    <div className="mt-4 rounded-md border border-gray-200 bg-[#FAFAFA] px-4 py-3">
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400">
                        Latest Note
                      </p>
                      <p className="mt-1 text-sm leading-6 text-gray-600">{latest.notes}</p>
                    </div>
                  ) : null}
                </div>

                {isExpanded ? (
                  <div className="border-t border-gray-100 bg-[#FCFCFD] px-5 py-4">
                    <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400">
                      Booking History
                    </p>
                    <div className="space-y-2">
                      {trainerBookings.map((booking) => {
                        const bookingFormat = getBookingFormat(booking);
                        const bookingStatus = statusStyles[booking.status] || statusStyles.pending;
                        const canPay =
                          booking.status === 'accepted_awaiting_payment' &&
                          booking.paymentStatus !== 'paid';

                        return (
                          <div
                            key={booking._id}
                            className="flex flex-col gap-3 rounded-md border border-gray-200 bg-white px-4 py-3"
                          >
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                              <div className="flex flex-wrap gap-2">
                                <MetaPill
                                  icon={<Calendar size={13} />}
                                  label={formatSessionDate(booking.sessionDate)}
                                />
                                <MetaPill
                                  icon={<Clock size={13} />}
                                  label={booking.sessionTime || 'Time not set'}
                                />
                                <MetaPill
                                  icon={
                                    booking.sessionType === 'Online' ? (
                                      <Video size={13} />
                                    ) : (
                                      <MapPin size={13} />
                                    )
                                  }
                                  label={booking.sessionType || 'Session'}
                                />
                                <MetaPill
                                  icon={bookingFormat.isPackage ? <Package size={13} /> : null}
                                  label={bookingFormat.label}
                                />
                              </div>

                              <div className="flex flex-wrap items-center gap-2">
                                <MetaPill
                                  label={`Rs. ${booking.totalAmount || booking.price || 0}`}
                                  strong
                                />
                                <span
                                  className={`rounded-md px-2.5 py-1 text-[11px] font-bold ${bookingStatus.pill}`}
                                >
                                  {bookingStatus.label}
                                </span>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              {booking.paymentStatus === 'paid' ? (
                                <MetaPill label="Paid" accent="green" />
                              ) : null}

                              {booking.status === 'pending' ? (
                                <button
                                  onClick={() => cancelBooking(booking._id)}
                                  className="inline-flex items-center justify-center gap-2 rounded-md border border-red-200 px-3 py-2 text-sm font-semibold text-red-500 transition hover:bg-red-50"
                                >
                                  Cancel Booking
                                </button>
                              ) : null}

                              {canPay ? (
                                <button
                                  onClick={() => startKhaltiPayment(booking._id)}
                                  disabled={payingId === booking._id}
                                  className="inline-flex items-center justify-center gap-2 rounded-md bg-[#FF6700] px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-50"
                                >
                                  {payingId === booking._id ? (
                                    <Loader size={14} className="animate-spin" />
                                  ) : (
                                    <CreditCard size={14} />
                                  )}
                                  Pay with Khalti
                                </button>
                              ) : null}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </section>
            );
          })}
        </div>
      )}

      {callDeclined ? (
        <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-2xl bg-gray-900 px-6 py-3 text-white shadow-2xl">
          <PhoneOff size={18} className="shrink-0 text-red-400" />
          <p className="text-sm font-semibold">{callDeclined.name} declined the call</p>
        </div>
      ) : null}

      {incomingCall ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="mx-4 w-full max-w-sm rounded-3xl border border-gray-700 bg-gray-900 p-8 text-center shadow-2xl">
            <div className="relative mx-auto mb-5 h-24 w-24">
              <div className="absolute inset-0 animate-ping rounded-full bg-brandOrange/20" />
              <div
                className="absolute inset-2 animate-ping rounded-full bg-brandOrange/30"
                style={{ animationDelay: '0.2s' }}
              />
              <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-brandOrange">
                <Phone size={32} className="text-white" />
              </div>
            </div>
            <h3 className="mb-1 text-xl font-bold text-white">Incoming Call</h3>
            <p className="mb-2 text-sm text-gray-400">{incomingCall.fromUserName} is calling</p>
            {incomingCall.isOfficialSession ? (
              <span className="mb-4 inline-block rounded-full border border-green-500/30 bg-green-500/20 px-3 py-1 text-xs font-bold text-green-400">
                Official Session Call
              </span>
            ) : null}
            <p className="mb-5 text-xs text-gray-500">You must accept or decline to continue</p>
            <div className="flex gap-3">
              <button
                onClick={declineCall}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/20 py-4 font-bold text-red-400 transition hover:bg-red-500/30"
              >
                <PhoneOff size={20} /> Decline
              </button>
              <button
                onClick={acceptCall}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-green-500 py-4 font-bold text-white transition hover:bg-green-600"
              >
                <Phone size={20} /> Accept
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

const SummaryStat = ({ label, value, tone }) => {
  const tones = {
    orange: 'text-[#FF6700]',
    green: 'text-emerald-700',
    slate: 'text-slate-700',
    blue: 'text-blue-700',
  };

  return (
    <div className="px-2 py-1 text-center">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400">{label}</p>
      <p className={`mt-1.5 text-[22px] font-bold tracking-tight ${tones[tone]}`}>{value}</p>
    </div>
  );
};

const MetaPill = ({ icon, label, strong = false, subtle = false, accent }) => {
  const accents = {
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-[11px] ${
        strong
          ? 'border-[#111111] bg-[#111111] text-white'
          : subtle
          ? 'border-blue-100 bg-white text-blue-700'
          : accent
          ? accents[accent]
          : 'border-gray-200 bg-white text-gray-600'
      }`}
    >
      {icon ? <span className={strong ? 'text-white/75' : 'text-gray-400'}>{icon}</span> : null}
      <span className={strong ? 'font-semibold' : 'font-medium'}>{label}</span>
    </span>
  );
};
