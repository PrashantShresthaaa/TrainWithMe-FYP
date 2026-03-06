import React, { useState, useEffect } from 'react';
import {
  Loader, AlertCircle, XCircle, CheckCircle, Clock,
  Calendar, Video, MapPin, Star, Eye, UserCheck, Inbox,
  Package, ChevronRight, Zap
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const statusStyles = {
  pending:   { pill: 'bg-amber-50 text-amber-600 border border-amber-200',       dot: 'bg-amber-400',   label: 'Pending'   },
  confirmed: { pill: 'bg-emerald-50 text-emerald-600 border border-emerald-200', dot: 'bg-emerald-400', label: 'Confirmed' },
  rejected:  { pill: 'bg-red-50 text-red-500 border border-red-200',             dot: 'bg-red-400',     label: 'Rejected'  },
  cancelled: { pill: 'bg-gray-100 text-gray-500 border border-gray-200',         dot: 'bg-gray-300',    label: 'Cancelled' },
  completed: { pill: 'bg-blue-50 text-blue-600 border border-blue-200',          dot: 'bg-blue-400',    label: 'Completed' },
};

// Works whether trainer is a populated object OR a plain ID string
const getTrainerId = (trainer) => {
  if (!trainer) return null;
  if (typeof trainer === 'string') return trainer;
  if (trainer._id) return trainer._id.toString();
  return trainer.toString();
};

const getTrainerName  = (trainer) => (trainer?.name  || 'Trainer');
const getTrainerEmail = (trainer) => (trainer?.email || '');

// ── Package definitions ──
const PACKAGES = [
  {
    id: 'single',
    label: 'Single Session',
    sessions: 1,
    period: null,
    badge: null,
    description: 'Try a session before committing',
    discount: 0,
  },
  {
    id: 'weekly',
    label: 'Weekly Pack',
    sessions: 3,
    period: 'week',
    badge: 'Popular',
    description: '3 sessions per week for focused progress',
    discount: 5,
  },
  {
    id: 'monthly',
    label: 'Monthly Pack',
    sessions: 12,
    period: 'month',
    badge: 'Best Value',
    description: '12 sessions over a month — save more',
    discount: 15,
  },
  {
    id: 'quarterly',
    label: '3-Month Pack',
    sessions: 36,
    period: '3 months',
    badge: 'Max Savings',
    description: '36 sessions over 3 months — biggest discount',
    discount: 25,
  },
];

// ── Package Booking Modal ──
const PackageModal = ({ trainer, basePrice, onClose, onBook }) => {
  const [selected, setSelected] = useState('monthly');
  const [sessionType, setSessionType] = useState('In-Person');
  const [startDate, setStartDate] = useState('');
  const [loading, setLoading] = useState(false);

  const pkg = PACKAGES.find(p => p.id === selected);
  const pricePerSession = Math.round(basePrice * (1 - pkg.discount / 100));
  const totalPrice = pricePerSession * pkg.sessions;

  const handleBook = async () => {
    if (!startDate) { alert('Please select a start date'); return; }
    setLoading(true);
    await onBook({ package: pkg, sessionType, startDate, pricePerSession, totalPrice });
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="bg-[#111] text-white p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Book a Package with</p>
              <h3 className="text-xl font-bold">{getTrainerName(trainer)}</h3>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white text-xl font-bold">×</button>
          </div>
          <p className="text-gray-400 text-sm mt-2">Base rate: Rs. {basePrice} / session</p>
        </div>

        <div className="p-6 space-y-5">
          {/* Package selection */}
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Choose Package</p>
            <div className="grid grid-cols-2 gap-3">
              {PACKAGES.map(p => {
                const discountedPrice = Math.round(basePrice * (1 - p.discount / 100));
                const total = discountedPrice * p.sessions;
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelected(p.id)}
                    className={`relative text-left p-4 rounded-xl border-2 transition-all ${
                      selected === p.id
                        ? 'border-brandOrange bg-orange-50'
                        : 'border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    {p.badge && (
                      <span className="absolute -top-2 -right-2 bg-brandOrange text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                        {p.badge}
                      </span>
                    )}
                    <p className="font-bold text-sm text-gray-800">{p.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{p.sessions} session{p.sessions > 1 ? 's' : ''}{p.period ? ` / ${p.period}` : ''}</p>
                    <div className="mt-2">
                      {p.discount > 0 && (
                        <span className="text-[10px] text-green-600 font-bold bg-green-50 px-1.5 py-0.5 rounded mr-1">
                          -{p.discount}%
                        </span>
                      )}
                      <span className="text-sm font-bold text-gray-800">Rs. {total.toLocaleString()}</span>
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-gray-400 mt-2 italic">{pkg.description}</p>
          </div>

          {/* Session type */}
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Session Type</p>
            <div className="flex gap-3">
              {['In-Person', 'Online'].map(type => (
                <button
                  key={type}
                  onClick={() => setSessionType(type)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition ${
                    sessionType === type
                      ? 'border-brandOrange bg-orange-50 text-brandOrange'
                      : 'border-gray-100 text-gray-500 hover:border-gray-200'
                  }`}
                >
                  {type === 'Online' ? <Video size={14} className="inline mr-1" /> : <MapPin size={14} className="inline mr-1" />}
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Start date */}
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Start Date</p>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full border-2 border-gray-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-brandOrange transition"
            />
          </div>

          {/* Price summary */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-500">Rs. {basePrice} × {pkg.sessions} sessions</span>
              <span className="text-gray-400 line-through">Rs. {(basePrice * pkg.sessions).toLocaleString()}</span>
            </div>
            {pkg.discount > 0 && (
              <div className="flex justify-between text-sm mb-1">
                <span className="text-green-600 font-medium">Package discount ({pkg.discount}%)</span>
                <span className="text-green-600 font-medium">-Rs. {(basePrice * pkg.sessions - totalPrice).toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base border-t border-gray-200 pt-2 mt-2">
              <span>Total</span>
              <span className="text-brandOrange">Rs. {totalPrice.toLocaleString()}</span>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">Rs. {pricePerSession} per session</p>
          </div>

          <button
            onClick={handleBook}
            disabled={loading}
            className="w-full bg-brandOrange hover:bg-orange-600 text-white font-bold py-3.5 rounded-xl transition shadow-lg shadow-brandOrange/20 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader size={16} className="animate-spin" /> : <Zap size={16} />}
            {loading ? 'Booking...' : `Book ${pkg.label} — Rs. ${totalPrice.toLocaleString()}`}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main Component ──
const MyTrainersView = ({ setActiveTab }) => {
  const { getToken } = useAuth();
  const [section, setSection] = useState('trainers');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [packageModal, setPackageModal] = useState(null); // { trainer, basePrice }

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/bookings', {
        headers: { 'Authorization': `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setBookings(data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBookings(); }, []);

  const handleCancel = async (bookingId) => {
    if (!window.confirm('Cancel this booking?')) return;
    setCancellingId(bookingId);
    try {
      const res = await fetch(`http://localhost:5000/api/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
        body: JSON.stringify({ status: 'cancelled' }),
      });
      if (!res.ok) throw new Error();
      setBookings(prev => prev.map(b => b._id === bookingId ? { ...b, status: 'cancelled' } : b));
    } catch {
      alert('Failed to cancel. Please try again.');
    } finally {
      setCancellingId(null);
    }
  };

  const handlePackageBook = async ({ package: pkg, sessionType, startDate, pricePerSession, totalPrice }, trainer) => {
    try {
      const trainerId = getTrainerId(trainer);
      const res = await fetch('http://localhost:5000/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
        body: JSON.stringify({
          trainerId,
          sessionDate: startDate,
          sessionTime: '09:00 AM',
          sessionType,
          price: totalPrice,
          notes: `Package: ${pkg.label} (${pkg.sessions} sessions, ${pkg.discount}% discount)`,
        }),
      });
      if (!res.ok) throw new Error();
      await fetchBookings();
      setPackageModal(null);
      alert(`✅ ${pkg.label} booked successfully!`);
    } catch {
      alert('Booking failed. Please try again.');
    }
  };

  // ── Fix: works whether trainer is object or plain ID ──
  const confirmedBookings = bookings.filter(b => b.status === 'confirmed' || b.status === 'completed');

  const uniqueTrainers = confirmedBookings.reduce((acc, booking) => {
    const id = getTrainerId(booking.trainer);
    if (id && !acc.find(t => getTrainerId(t.trainer) === id)) acc.push(booking);
    return acc;
  }, []);

  const pendingCount = bookings.filter(b => b.status === 'pending').length;

  return (
    <>
      {/* Package Modal */}
      {packageModal && (
        <PackageModal
          trainer={packageModal.trainer}
          basePrice={packageModal.basePrice}
          onClose={() => setPackageModal(null)}
          onBook={(details) => handlePackageBook(details, packageModal.trainer)}
        />
      )}

      <div className="flex flex-col gap-6">

        {/* Page Header with tabs */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">My Trainers</h2>
          <p className="text-gray-400 text-sm mt-0.5">View your trainers and all your booking requests.</p>

          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setSection('trainers')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition ${
                section === 'trainers'
                  ? 'bg-brandOrange text-white shadow-md shadow-brandOrange/20'
                  : 'bg-gray-100 text-gray-500 hover:text-gray-700'
              }`}
            >
              <UserCheck size={15} /> My Trainers
              {uniqueTrainers.length > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${section === 'trainers' ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'}`}>
                  {uniqueTrainers.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setSection('requests')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition ${
                section === 'requests'
                  ? 'bg-brandOrange text-white shadow-md shadow-brandOrange/20'
                  : 'bg-gray-100 text-gray-500 hover:text-gray-700'
              }`}
            >
              <Inbox size={15} /> Booking Requests
              {pendingCount > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${section === 'requests' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-600'}`}>
                  {pendingCount} pending
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-24">
            <Loader size={28} className="animate-spin text-brandOrange" />
          </div>
        )}

        {/* ── MY TRAINERS ── */}
        {!loading && section === 'trainers' && (
          <>
            {uniqueTrainers.length === 0 ? (
              <EmptyState
                icon={<UserCheck size={40} className="text-gray-300" />}
                title="No confirmed trainers yet"
                desc="Once a trainer accepts your booking, they'll appear here."
                action="Find a Trainer"
                onAction={() => setActiveTab('explore')}
              />
            ) : (
              <div className="grid md:grid-cols-2 gap-5">
                {uniqueTrainers.map((booking) => {
                  const trainerName  = getTrainerName(booking.trainer);
                  const trainerEmail = getTrainerEmail(booking.trainer);
                  const trainerId    = getTrainerId(booking.trainer);

                  const completedCount = bookings.filter(
                    b => getTrainerId(b.trainer) === trainerId && b.status === 'completed'
                  ).length;
                  const confirmedCount = bookings.filter(
                    b => getTrainerId(b.trainer) === trainerId && b.status === 'confirmed'
                  ).length;

                  return (
                    <div key={booking._id} className="bg-white rounded-2xl border border-gray-100 p-6 hover:border-gray-200 hover:shadow-sm transition">

                      {/* Trainer header */}
                      <div className="flex items-center gap-4 mb-5">
                        <div className="w-14 h-14 rounded-2xl bg-brandOrange/10 text-brandOrange flex items-center justify-center font-bold text-xl shrink-0">
                          {trainerName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-800 text-base">{trainerName}</h3>
                          <p className="text-xs text-gray-400">{trainerEmail}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <Star size={12} fill="#FF6700" className="text-brandOrange" />
                            <span className="text-xs font-bold text-gray-600">Active Trainer</span>
                          </div>
                        </div>
                        <span className="text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-200 px-2.5 py-1 rounded-full">
                          Confirmed
                        </span>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-3 mb-5">
                        <div className="bg-gray-50 rounded-xl p-3 text-center">
                          <p className="text-2xl font-bold text-gray-800">{completedCount}</p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mt-0.5">Sessions Done</p>
                        </div>
                        <div className="bg-orange-50 rounded-xl p-3 text-center">
                          <p className="text-2xl font-bold text-brandOrange">{confirmedCount}</p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mt-0.5">Upcoming</p>
                        </div>
                      </div>

                      {/* Next session */}
                      <div className="bg-gray-50 rounded-xl p-3 mb-4 flex items-center gap-3">
                        <Clock size={14} className="text-brandOrange shrink-0" />
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase">Next Session</p>
                          <p className="text-xs font-semibold text-gray-700">
                            {booking.sessionDate} at {booking.sessionTime} · {booking.sessionType}
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => setPackageModal({ trainer: booking.trainer, basePrice: booking.price })}
                          className="flex-1 flex items-center justify-center gap-2 bg-brandOrange text-white hover:bg-orange-600 py-2.5 rounded-xl text-xs font-bold transition shadow-md shadow-brandOrange/20"
                        >
                          <Package size={14} /> Book Package
                        </button>
                        <button
                          onClick={() => setActiveTab('messages')}
                          className="flex-1 flex items-center justify-center gap-2 bg-gray-100 text-gray-600 hover:bg-gray-200 py-2.5 rounded-xl text-xs font-bold transition"
                        >
                          Message
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ── BOOKING REQUESTS ── */}
        {!loading && section === 'requests' && (
          <>
            {bookings.length === 0 ? (
              <EmptyState
                icon={<Inbox size={40} className="text-gray-300" />}
                title="No booking requests yet"
                desc="When you send a booking request, it will appear here."
                action="Find a Trainer"
                onAction={() => setActiveTab('explore')}
              />
            ) : (
              <div className="flex flex-col gap-4">
                {bookings.map((booking) => {
                  const trainerName = getTrainerName(booking.trainer);
                  const style = statusStyles[booking.status] || statusStyles.pending;
                  const isPending   = booking.status === 'pending';
                  const isConfirmed = booking.status === 'confirmed';

                  return (
                    <div key={booking._id} className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-gray-200 transition">
                      <div className="flex flex-col md:flex-row md:items-center gap-4">

                        {/* Trainer info */}
                        <div className="flex items-center gap-3 flex-1">
                          <div className="relative">
                            <div className="w-11 h-11 rounded-xl bg-brandOrange/10 text-brandOrange flex items-center justify-center font-bold text-sm shrink-0">
                              {trainerName.charAt(0).toUpperCase()}
                            </div>
                            <span className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${style.dot}`} />
                          </div>
                          <div>
                            <p className="font-bold text-gray-800">{trainerName}</p>
                            <p className="text-xs text-gray-400">{getTrainerEmail(booking.trainer)}</p>
                          </div>
                        </div>

                        {/* Session details */}
                        <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                          <span className="flex items-center gap-1 bg-gray-50 px-2.5 py-1.5 rounded-lg">
                            <Calendar size={11} /> {booking.sessionDate}
                          </span>
                          <span className="flex items-center gap-1 bg-gray-50 px-2.5 py-1.5 rounded-lg">
                            <Clock size={11} /> {booking.sessionTime}
                          </span>
                          <span className="flex items-center gap-1 bg-gray-50 px-2.5 py-1.5 rounded-lg">
                            {booking.sessionType === 'Online' ? <Video size={11} /> : <MapPin size={11} />}
                            {booking.sessionType}
                          </span>
                          <span className="bg-gray-50 px-2.5 py-1.5 rounded-lg font-semibold text-gray-700">
                            Rs. {booking.price?.toLocaleString()}
                          </span>
                        </div>

                        {/* Status */}
                        <span className={`text-xs font-bold px-3 py-1.5 rounded-lg shrink-0 ${style.pill}`}>
                          {style.label}
                        </span>

                        {/* Cancel */}
                        {(isPending || isConfirmed) && (
                          <button
                            onClick={() => handleCancel(booking._id)}
                            disabled={cancellingId === booking._id}
                            className="flex items-center gap-1.5 text-xs font-bold text-red-400 hover:text-red-600 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-xl border border-red-100 transition disabled:opacity-50 shrink-0"
                          >
                            {cancellingId === booking._id ? <Loader size={12} className="animate-spin" /> : <XCircle size={13} />}
                            Cancel
                          </button>
                        )}
                      </div>

                      {/* Status message */}
                      <div className="mt-3 pt-3 border-t border-gray-50 flex items-center gap-2 flex-wrap">
                        {isPending   && <p className="text-xs text-amber-600 font-medium flex items-center gap-1.5"><AlertCircle size={12} /> Waiting for trainer to confirm</p>}
                        {isConfirmed && <p className="text-xs text-emerald-600 font-medium flex items-center gap-1.5"><CheckCircle size={12} /> Session confirmed by trainer!</p>}
                        {booking.status === 'rejected'  && <p className="text-xs text-red-500 font-medium flex items-center gap-1.5"><XCircle size={12} /> Request declined by trainer</p>}
                        {booking.status === 'completed' && <p className="text-xs text-blue-600 font-medium flex items-center gap-1.5"><CheckCircle size={12} /> Session completed</p>}
                        {booking.status === 'cancelled' && <p className="text-xs text-gray-400 font-medium flex items-center gap-1.5"><XCircle size={12} /> You cancelled this booking</p>}
                        {booking.notes && <span className="ml-auto text-xs text-gray-400 italic truncate max-w-xs">"{booking.notes}"</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
};

const EmptyState = ({ icon, title, desc, action, onAction }) => (
  <div className="flex flex-col items-center justify-center py-24 text-center">
    <div className="mb-4">{icon}</div>
    <p className="text-lg font-bold text-gray-500">{title}</p>
    <p className="text-sm text-gray-400 mt-1 mb-5">{desc}</p>
    <button onClick={onAction} className="bg-brandOrange text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-orange-600 transition shadow-lg shadow-brandOrange/20">
      {action}
    </button>
  </div>
);

export default MyTrainersView;