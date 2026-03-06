import React, { useState, useEffect } from 'react';
import { Clock, TrendingUp, Activity, Flame, Calendar, ArrowRight, MoreHorizontal, Zap, Target, ChevronRight, Loader, AlertCircle, XCircle, Eye, CheckCircle, Star } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// ─── Status style map ───
const statusStyles = {
  pending:   { pill: 'bg-amber-50 text-amber-600 border border-amber-200',   dot: 'bg-amber-400',   label: 'Pending'   },
  confirmed: { pill: 'bg-emerald-50 text-emerald-600 border border-emerald-200', dot: 'bg-emerald-400', label: 'Confirmed' },
  rejected:  { pill: 'bg-red-50 text-red-500 border border-red-200',         dot: 'bg-red-400',     label: 'Rejected'  },
  cancelled: { pill: 'bg-gray-100 text-gray-500 border border-gray-200',     dot: 'bg-gray-400',    label: 'Cancelled' },
  completed: { pill: 'bg-blue-50 text-blue-600 border border-blue-200',      dot: 'bg-blue-400',    label: 'Completed' },
};

// ─────────────────────────────────────────────
// MY TRAINERS SECTION — fetches real bookings
// ─────────────────────────────────────────────
const MyTrainersSection = ({ setActiveTab }) => {
  const { getToken } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);

  const fetchBookings = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/bookings', {
        headers: { 'Authorization': `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setBookings(data);
    } catch {
      // silently fail — section just won't show
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBookings(); }, []);

  const handleCancel = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    setCancellingId(bookingId);
    try {
      const res = await fetch(`http://localhost:5000/api/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ status: 'cancelled' }),
      });
      if (!res.ok) throw new Error();
      // Update local state immediately
      setBookings(prev => prev.map(b => b._id === bookingId ? { ...b, status: 'cancelled' } : b));
    } catch {
      alert('Failed to cancel booking. Please try again.');
    } finally {
      setCancellingId(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="font-bold text-gray-800 text-sm mb-4">My Trainers</h3>
        <div className="flex items-center gap-2 text-gray-400 text-sm py-4">
          <Loader size={16} className="animate-spin text-brandOrange" /> Loading...
        </div>
      </div>
    );
  }

  // Only show active bookings (not cancelled)
  const activeBookings = bookings.filter(b => b.status !== 'cancelled');

  if (activeBookings.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-gray-800 text-sm">My Trainers</h3>
        </div>
        <div className="text-center py-6">
          <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <Star size={20} className="text-gray-300" />
          </div>
          <p className="text-sm font-semibold text-gray-500">No trainers yet</p>
          <p className="text-xs text-gray-400 mt-1 mb-4">Book your first session to get started</p>
          <button
            onClick={() => setActiveTab('explore')}
            className="text-xs font-bold text-brandOrange hover:underline"
          >
            Find a Trainer →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100">
      {/* Header */}
      <div className="flex justify-between items-center p-5 border-b border-gray-50">
        <h3 className="font-bold text-gray-800 text-sm">My Trainers</h3>
        <span className="text-xs font-bold text-gray-400">{activeBookings.length} booking{activeBookings.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Booking list */}
      <div className="divide-y divide-gray-50">
        {activeBookings.map((booking) => {
          const trainerName = booking.trainer?.name || 'Trainer';
          const trainerInitial = trainerName.charAt(0).toUpperCase();
          const style = statusStyles[booking.status] || statusStyles.pending;
          const isPending = booking.status === 'pending';
          const isConfirmed = booking.status === 'confirmed';

          return (
            <div key={booking._id} className="p-4 hover:bg-gray-50/50 transition group">
              {/* Top row: avatar + name + status */}
              <div className="flex items-center gap-3 mb-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-brandOrange/10 text-brandOrange flex items-center justify-center font-bold text-sm shrink-0">
                    {trainerInitial}
                  </div>
                  {/* Live status dot */}
                  <span className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${style.dot}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-800 truncate">{trainerName}</p>
                  <p className="text-xs text-gray-400 truncate">{booking.trainer?.email || ''}</p>
                </div>

                {/* Status pill */}
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 ${style.pill}`}>
                  {style.label}
                </span>
              </div>

              {/* Session details row */}
              <div className="flex flex-wrap gap-2 mb-3 ml-13">
                <span className="flex items-center gap-1 text-[11px] text-gray-500 bg-gray-50 px-2.5 py-1 rounded-lg">
                  <Calendar size={10} /> {booking.sessionDate}
                </span>
                <span className="flex items-center gap-1 text-[11px] text-gray-500 bg-gray-50 px-2.5 py-1 rounded-lg">
                  <Clock size={10} /> {booking.sessionTime}
                </span>
                <span className="text-[11px] text-gray-500 bg-gray-50 px-2.5 py-1 rounded-lg">
                  {booking.sessionType}
                </span>
                <span className="text-[11px] font-semibold text-gray-700 bg-gray-50 px-2.5 py-1 rounded-lg">
                  Rs. {booking.price}
                </span>
              </div>

              {/* Status message */}
              {isPending && (
                <p className="text-[11px] text-amber-600 font-medium ml-1 mb-3 flex items-center gap-1">
                  <AlertCircle size={11} /> Waiting for trainer to confirm your request
                </p>
              )}
              {isConfirmed && (
                <p className="text-[11px] text-emerald-600 font-medium ml-1 mb-3 flex items-center gap-1">
                  <CheckCircle size={11} /> Your session is confirmed!
                </p>
              )}
              {booking.status === 'rejected' && (
                <p className="text-[11px] text-red-500 font-medium ml-1 mb-3 flex items-center gap-1">
                  <XCircle size={11} /> Trainer declined this request
                </p>
              )}

              {/* Action buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('explore')}
                  className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500 hover:text-brandOrange bg-gray-50 hover:bg-orange-50 px-3 py-1.5 rounded-lg transition border border-gray-100 hover:border-brandOrange/20"
                >
                  <Eye size={12} /> View Trainer
                </button>

                {/* Cancel only available for pending or confirmed bookings */}
                {(isPending || isConfirmed) && (
                  <button
                    onClick={() => handleCancel(booking._id)}
                    disabled={cancellingId === booking._id}
                    className="flex items-center gap-1.5 text-[11px] font-bold text-red-400 hover:text-red-600 bg-red-50/50 hover:bg-red-50 px-3 py-1.5 rounded-lg transition border border-red-100 disabled:opacity-50"
                  >
                    {cancellingId === booking._id
                      ? <Loader size={11} className="animate-spin" />
                      : <XCircle size={12} />
                    }
                    Cancel
                  </button>
                )}
              </div>

              {/* Notes if present */}
              {booking.notes && (
                <div className="mt-3 pt-3 border-t border-gray-50">
                  <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Your Notes</p>
                  <p className="text-xs text-gray-500 italic">"{booking.notes}"</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-50">
        <button
          onClick={() => setActiveTab('explore')}
          className="w-full text-xs font-bold text-brandOrange hover:bg-orange-50 py-2 rounded-xl transition"
        >
          + Book Another Session
        </button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// MAIN DASHBOARD HOME
// ─────────────────────────────────────────────
const DashboardHome = ({ setActiveTab, userName }) => {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

      {/* ─── LEFT COLUMN (spans 2) ─── */}
      <div className="xl:col-span-2 flex flex-col gap-6">

        {/* Hero Banner */}
        <div className="relative bg-[#0E0E10] rounded-2xl p-8 md:p-10 overflow-hidden">
          <div className="absolute top-0 right-0 w-72 h-72 bg-brandOrange/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 left-1/2 w-48 h-48 bg-orange-500/5 rounded-full blur-[80px]" />
          <div className="absolute top-6 right-8 w-20 h-20 border border-white/[0.04] rounded-full" />
          <div className="absolute bottom-8 right-24 w-10 h-10 border border-brandOrange/10 rounded-full" />

          <div className="relative z-10 max-w-lg">
            <div className="inline-flex items-center gap-2 bg-brandOrange/15 text-brandOrange text-xs font-bold px-3 py-1.5 rounded-full mb-4">
              <Zap size={12} /> 3 sessions this week
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3 leading-tight">
              Keep pushing, <span className="text-brandOrange">{userName || 'there'}!</span>
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              You're just one session away from hitting your weekly target. Book now and earn your consistency badge.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setActiveTab('explore')}
                className="bg-brandOrange hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-bold text-sm transition shadow-lg shadow-brandOrange/25 flex items-center gap-2"
              >
                Book Next Session <ArrowRight size={16} />
              </button>
              <button
                onClick={() => setActiveTab('progress')}
                className="bg-white/[0.06] hover:bg-white/[0.1] text-white px-6 py-3 rounded-xl font-semibold text-sm transition border border-white/[0.06]"
              >
                View Progress
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: <Activity size={20}/>, label: "Total Workouts", value: "12", color: "text-blue-500", bg: "bg-blue-50" },
            { icon: <Flame size={20}/>, label: "Calories Burned", value: "12.5k", color: "text-brandOrange", bg: "bg-orange-50" },
            { icon: <Clock size={20}/>, label: "Hours Trained", value: "18.5", color: "text-emerald-500", bg: "bg-emerald-50" },
            { icon: <Calendar size={20}/>, label: "Sessions Left", value: "2", color: "text-amber-500", bg: "bg-amber-50", highlight: true },
          ].map((stat, i) => (
            <div
              key={i}
              className={`p-5 rounded-2xl border transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md cursor-default
                ${stat.highlight
                  ? 'bg-gradient-to-br from-brandOrange to-orange-500 text-white border-brandOrange shadow-lg shadow-brandOrange/20'
                  : 'bg-white border-gray-100 text-gray-800'
                }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3
                ${stat.highlight ? 'bg-white/20' : `${stat.bg} ${stat.color}`}`}>
                {stat.icon}
              </div>
              <h3 className="text-2xl font-bold tracking-tight">{stat.value}</h3>
              <p className={`text-[11px] font-semibold uppercase tracking-wider mt-1 ${stat.highlight ? 'text-white/70' : 'text-gray-400'}`}>
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* Pulse Bar */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 flex flex-col md:flex-row items-stretch gap-4">
          {[
            { icon: <Clock size={18}/>, color: "bg-orange-50 text-brandOrange", title: "Next Session", detail: "5:00 PM - Yoga Flow" },
            { icon: <Flame size={18}/>, color: "bg-blue-50 text-blue-500", title: "Weekly Streak", detail: "3 Days active" },
            { icon: <Target size={18}/>, color: "bg-emerald-50 text-emerald-500", title: "Weight Goal", detail: "72kg / 70kg target" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 flex-1 p-3 rounded-xl hover:bg-gray-50 transition cursor-default">
              <div className={`p-2.5 rounded-xl ${item.color}`}>{item.icon}</div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{item.title}</p>
                <p className="text-sm font-semibold text-gray-800">{item.detail}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Upcoming Sessions */}
        <div className="bg-white rounded-2xl border border-gray-100">
          <div className="flex justify-between items-center p-5 border-b border-gray-50">
            <h3 className="font-bold text-gray-800 text-sm">Upcoming Sessions</h3>
            <button
              onClick={() => setActiveTab('schedule')}
              className="text-brandOrange text-xs font-bold hover:underline flex items-center gap-1"
            >
              View All <ChevronRight size={14}/>
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {[
              { title: "Yoga Flow", trainer: "Sita Gurung", time: "Today, 5:00 PM", type: "Online", tag: "bg-orange-50 text-brandOrange" },
              { title: "HIIT Cardio", trainer: "Priya Karki", time: "Tomorrow, 7:00 AM", type: "In-Person", tag: "bg-blue-50 text-blue-600" },
              { title: "Strength Training", trainer: "Rohan S.", time: "Wed, 4:00 PM", type: "In-Person", tag: "bg-emerald-50 text-emerald-600" },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-4 p-4 hover:bg-gray-50/50 transition group cursor-pointer">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold ${s.tag}`}>
                  {s.title.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 group-hover:text-brandOrange transition">{s.title}</p>
                  <p className="text-xs text-gray-400">with {s.trainer}</p>
                </div>
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-semibold text-gray-700">{s.time}</p>
                  <p className="text-[10px] text-gray-400">{s.type}</p>
                </div>
                <ChevronRight size={16} className="text-gray-300 group-hover:text-brandOrange transition" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── RIGHT COLUMN ─── */}
      <div className="xl:col-span-1 flex flex-col gap-6">

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="font-bold text-gray-800 text-sm mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: <Calendar size={18}/>, label: "Book", color: "bg-orange-50 text-brandOrange hover:bg-orange-100", tab: "explore" },
              { icon: <TrendingUp size={18}/>, label: "Progress", color: "bg-blue-50 text-blue-500 hover:bg-blue-100", tab: "progress" },
            ].map((action, i) => (
              <button
                key={i}
                onClick={() => setActiveTab(action.tab)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl transition font-semibold text-xs ${action.color}`}
              >
                {action.icon}
                {action.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── MY TRAINERS — real data ── */}
        <MyTrainersSection setActiveTab={setActiveTab} />

        {/* Recent Activity */}
        <div className="bg-white border border-gray-100 rounded-2xl flex flex-col">
          <div className="p-5 border-b border-gray-50 flex justify-between items-center">
            <h3 className="font-bold text-gray-800 text-sm">Recent Activity</h3>
            <button className="text-gray-300 hover:text-gray-500"><MoreHorizontal size={16}/></button>
          </div>
          <div>
            {[
              { title: "Morning Yoga", detail: "Sita G. - 2 days ago", icon: "bg-orange-50 text-brandOrange", dot: "bg-brandOrange" },
              { title: "Cardio Blast", detail: "Priya K. - 3 days ago", icon: "bg-blue-50 text-blue-500", dot: "bg-blue-500" },
              { title: "Plan Renewed", detail: "System - 1 week ago", icon: "bg-emerald-50 text-emerald-500", dot: "bg-emerald-500" },
              { title: "Weight Updated", detail: "72kg logged - 1 week ago", icon: "bg-amber-50 text-amber-500", dot: "bg-amber-500" },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4 p-4 hover:bg-gray-50/50 transition group">
                <div className="relative mt-0.5">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold ${item.icon}`}>
                    <Activity size={16} />
                  </div>
                  <span className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${item.dot}`} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700 group-hover:text-gray-900 transition">{item.title}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full py-3.5 text-xs font-bold text-gray-400 hover:text-brandOrange hover:bg-gray-50 border-t border-gray-50 transition rounded-b-2xl">
            VIEW ALL ACTIVITY
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;