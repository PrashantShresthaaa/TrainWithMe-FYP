import React, { useState, useEffect } from 'react';
import { Loader, AlertCircle, User, Calendar, Video, MapPin, CheckCircle, Clock, Package } from 'lucide-react';

const getAuth = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  return user?.token ? `Bearer ${user.token}` : null;
};

const statusStyles = {
  pending:   { pill: 'bg-amber-50 text-amber-600 border border-amber-200',       label: 'Pending'   },
  confirmed: { pill: 'bg-emerald-50 text-emerald-600 border border-emerald-200', label: 'Confirmed' },
  rejected:  { pill: 'bg-red-50 text-red-500 border border-red-200',             label: 'Rejected'  },
  cancelled: { pill: 'bg-gray-100 text-gray-500 border border-gray-200',         label: 'Cancelled' },
  completed: { pill: 'bg-blue-50 text-blue-600 border border-blue-200',          label: 'Completed' },
};

const TrainerClients = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('active'); // 'active' | 'all'

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const token = getAuth();
        if (!token) return;
        const res = await fetch('http://localhost:5000/api/bookings', {
          headers: { Authorization: token },
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        setBookings(data);
      } catch {
        // fail silently
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

  // Deduplicate clients — one card per unique client
  const allBookings = filter === 'active'
    ? bookings.filter(b => b.status === 'confirmed' || b.status === 'pending')
    : bookings;

  // Group bookings by client ID
  const clientMap = allBookings.reduce((acc, booking) => {
    const clientId = booking.client?._id || booking.client;
    if (!clientId) return acc;
    const id = clientId.toString();
    if (!acc[id]) {
      acc[id] = { client: booking.client, bookings: [] };
    }
    acc[id].bookings.push(booking);
    return acc;
  }, {});

  const clients = Object.values(clientMap);

  const totalConfirmed = bookings.filter(b => b.status === 'confirmed').length;
  const totalPending   = bookings.filter(b => b.status === 'pending').length;
  const totalCompleted = bookings.filter(b => b.status === 'completed').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader size={28} className="animate-spin text-brandOrange" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900">My Clients</h2>
        <p className="text-gray-400 text-sm mt-0.5">Clients who have booked sessions with you.</p>

        {/* Stats row */}
        <div className="flex gap-4 mt-4">
          <div className="flex-1 bg-orange-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-brandOrange">{clients.length}</p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mt-0.5">Total Clients</p>
          </div>
          <div className="flex-1 bg-emerald-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-emerald-600">{totalConfirmed}</p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mt-0.5">Confirmed</p>
          </div>
          <div className="flex-1 bg-amber-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-amber-600">{totalPending}</p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mt-0.5">Pending</p>
          </div>
          <div className="flex-1 bg-blue-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-blue-600">{totalCompleted}</p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mt-0.5">Completed</p>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mt-4">
          {[
            { id: 'active', label: 'Active Clients' },
            { id: 'all',    label: 'All Clients' },
          ].map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                filter === f.id
                  ? 'bg-brandOrange text-white shadow-md shadow-brandOrange/20'
                  : 'bg-gray-100 text-gray-500 hover:text-gray-700'
              }`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Client list */}
      {clients.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <User size={40} className="text-gray-200 mb-3" />
          <p className="text-lg font-bold text-gray-500">No clients yet</p>
          <p className="text-sm text-gray-400 mt-1">
            {filter === 'active' ? 'No active bookings at the moment.' : 'You have no bookings yet.'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {clients.map(({ client, bookings: clientBookings }) => {
            const clientName  = client?.name  || 'Client';
            const clientEmail = client?.email || '';
            const latestBooking = clientBookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
            const confirmedCount = clientBookings.filter(b => b.status === 'confirmed').length;
            const completedCount = clientBookings.filter(b => b.status === 'completed').length;
            const isPackage = latestBooking?.notes?.startsWith('Package:');

            return (
              <div key={client?._id || clientName} className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-gray-200 transition">
                <div className="flex flex-col md:flex-row md:items-center gap-4">

                  {/* Client info */}
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-12 h-12 rounded-xl bg-brandOrange/10 text-brandOrange flex items-center justify-center font-bold text-lg shrink-0">
                      {clientName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">{clientName}</p>
                      <p className="text-xs text-gray-400">{clientEmail}</p>
                      <div className="flex items-center gap-3 mt-1 text-[10px] font-bold text-gray-400">
                        <span className="text-emerald-600">{confirmedCount} upcoming</span>
                        <span>·</span>
                        <span className="text-blue-600">{completedCount} completed</span>
                        <span>·</span>
                        <span>{clientBookings.length} total booking{clientBookings.length !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  </div>

                  {/* Latest booking info */}
                  <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1 bg-gray-50 px-2.5 py-1.5 rounded-lg">
                      <Calendar size={11} /> {latestBooking?.sessionDate}
                    </span>
                    <span className="flex items-center gap-1 bg-gray-50 px-2.5 py-1.5 rounded-lg">
                      <Clock size={11} /> {latestBooking?.sessionTime}
                    </span>
                    <span className="flex items-center gap-1 bg-gray-50 px-2.5 py-1.5 rounded-lg">
                      {latestBooking?.sessionType === 'Online' ? <Video size={11}/> : <MapPin size={11}/>}
                      {latestBooking?.sessionType}
                    </span>
                    {isPackage && (
                      <span className="flex items-center gap-1 bg-orange-50 text-brandOrange px-2.5 py-1.5 rounded-lg font-bold">
                        <Package size={11}/> Package
                      </span>
                    )}
                  </div>

                  {/* Status of latest booking */}
                  <span className={`text-xs font-bold px-3 py-1.5 rounded-lg shrink-0 ${(statusStyles[latestBooking?.status] || statusStyles.pending).pill}`}>
                    {(statusStyles[latestBooking?.status] || statusStyles.pending).label}
                  </span>
                </div>

                {/* All bookings from this client (expandable) */}
                {clientBookings.length > 1 && (
                  <div className="mt-4 pt-4 border-t border-gray-50">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">All Bookings ({clientBookings.length})</p>
                    <div className="flex flex-col gap-2">
                      {clientBookings.map(b => {
                        const style = statusStyles[b.status] || statusStyles.pending;
                        return (
                          <div key={b._id} className="flex items-center justify-between text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                            <span>{b.sessionDate} at {b.sessionTime} · {b.sessionType}</span>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-700">Rs. {b.price?.toLocaleString()}</span>
                              <span className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${style.pill}`}>{style.label}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Notes if present */}
                {latestBooking?.notes && (
                  <div className="mt-3 pt-3 border-t border-gray-50">
                    <p className="text-xs text-gray-400 italic">"{latestBooking.notes}"</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TrainerClients;