import React, { useState, useEffect, useRef } from 'react';
import { Loader, User, Calendar, Video, MapPin, Clock, Package, Phone, PhoneOff, CheckCircle, XCircle } from 'lucide-react';
import { io } from 'socket.io-client';

const API = 'http://localhost:5000';

const statusStyles = {
  pending:   { pill: 'bg-amber-50 text-amber-600 border border-amber-200',       label: 'Pending'   },
  confirmed: { pill: 'bg-emerald-50 text-emerald-600 border border-emerald-200', label: 'Confirmed' },
  rejected:  { pill: 'bg-red-50 text-red-500 border border-red-200',             label: 'Rejected'  },
  cancelled: { pill: 'bg-gray-100 text-gray-500 border border-gray-200',         label: 'Cancelled' },
  completed: { pill: 'bg-blue-50 text-blue-600 border border-blue-200',          label: 'Completed' },
};

const sessionStatusStyles = {
  scheduled: 'bg-amber-50 text-amber-600 border border-amber-200',
  live:      'bg-green-50 text-green-600 border border-green-200',
  completed: 'bg-blue-50 text-blue-600 border border-blue-200',
  missed:    'bg-red-50 text-red-500 border border-red-200',
};

export default function TrainerClients() {
  const [bookings,     setBookings]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [filter,       setFilter]       = useState('active');
  const [sessions,     setSessions]     = useState({});
  const [incomingCall, setIncomingCall] = useState(null);
  const [callDeclined, setCallDeclined] = useState(null);

  const socketRef   = useRef(null);
  const ringtoneRef = useRef(null);
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const authHeader  = { 'Content-Type': 'application/json', Authorization: `Bearer ${currentUser?.token}` };

  const playRingtone = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const ring = () => {
        const osc = ctx.createOscillator(); const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = 480; osc.type = 'sine';
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
        osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.8);
      };
      ring();
      ringtoneRef.current = { ctx, interval: setInterval(ring, 1500) };
    } catch {}
  };

  const stopRingtone = () => {
    if (!ringtoneRef.current) return;
    clearInterval(ringtoneRef.current.interval);
    try { ringtoneRef.current.ctx.close(); } catch {}
    ringtoneRef.current = null;
  };

  const openCallTab = (roomId, remoteUser, isInitiator, isOfficialSession) => {
    const cu = JSON.parse(localStorage.getItem('user') || '{}');
    const p = new URLSearchParams({
      roomId, remoteUserId: remoteUser._id, remoteUserName: remoteUser.name,
      isInitiator: isInitiator ? '1' : '0', isOfficialSession: isOfficialSession ? '1' : '0',
      currentUserId: cu._id, currentUserName: cu.name, token: cu.token,
    });
    window.open(`/call?${p.toString()}`, '_blank', 'width=960,height=680,noopener');
  };

  const fetchBookings = async () => {
    try {
      const res = await fetch(`${API}/api/bookings`, { headers: authHeader });
      if (res.ok) setBookings(await res.json());
    } catch {}
    setLoading(false);
  };

  const loadSession = async (bookingId) => {
    if (sessions[bookingId] !== undefined) return;
    setSessions(prev => ({ ...prev, [bookingId]: 'loading' }));
    try {
      const res = await fetch(`${API}/api/sessions/booking/${bookingId}`, { headers: authHeader });
      const data = res.ok ? await res.json() : null;
      setSessions(prev => ({ ...prev, [bookingId]: data }));
    } catch {
      setSessions(prev => ({ ...prev, [bookingId]: null }));
    }
  };

  const startOfficialSession = async (booking) => {
    let sess = sessions[booking._id];
    if (!sess || sess === 'loading') {
      try {
        const res = await fetch(`${API}/api/sessions/booking/${booking._id}`, { headers: authHeader });
        sess = await res.json();
        setSessions(prev => ({ ...prev, [booking._id]: sess }));
      } catch { return; }
    }
    const client = booking.client;
    socketRef.current?.emit('call:initiate', {
      toUserId: client._id || client, fromUserId: currentUser._id,
      fromUserName: currentUser.name, roomId: sess.roomId, isOfficialSession: true,
    });
    openCallTab(sess.roomId, { _id: client._id || client, name: client.name || 'Client' }, true, true);
  };

  const acceptCall = () => {
    if (!incomingCall) return;
    stopRingtone();
    socketRef.current?.emit('call:accepted', {
      toUserId: incomingCall.fromUserId, roomId: incomingCall.roomId,
      remoteUserId: currentUser._id, remoteUserName: currentUser.name,
      isOfficialSession: incomingCall.isOfficialSession,
    });
    openCallTab(incomingCall.roomId, { _id: incomingCall.fromUserId, name: incomingCall.fromUserName }, false, incomingCall.isOfficialSession);
    setIncomingCall(null);
  };

  const declineCall = () => {
    if (!incomingCall) return;
    stopRingtone();
    socketRef.current?.emit('call:declined', {
      toUserId: incomingCall.fromUserId, roomId: incomingCall.roomId, fromUserName: currentUser.name,
    });
    setIncomingCall(null);
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
    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    bookings.filter(b => b.sessionType === 'Online' && b.status === 'confirmed')
      .forEach(b => loadSession(b._id));
  }, [bookings]);

  const allBookings = filter === 'active'
    ? bookings.filter(b => b.status === 'confirmed' || b.status === 'pending')
    : bookings;

  const clientMap = allBookings.reduce((acc, b) => {
    const cid = (b.client?._id || b.client || '').toString();
    if (!cid) return acc;
    if (!acc[cid]) acc[cid] = { client: b.client, bookings: [] };
    acc[cid].bookings.push(b);
    return acc;
  }, {});
  const clients = Object.values(clientMap);

  const totalConfirmed = bookings.filter(b => b.status === 'confirmed').length;
  const totalPending   = bookings.filter(b => b.status === 'pending').length;
  const totalCompleted = bookings.filter(b => b.status === 'completed').length;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader size={28} className="animate-spin text-brandOrange" />
    </div>
  );

  return (
    <div className="flex flex-col gap-6">

      <div className="bg-white p-5 rounded-2xl border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900">My Clients</h2>
        <p className="text-gray-400 text-sm mt-0.5">Clients who have booked sessions with you.</p>
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
        <div className="flex gap-2 mt-4">
          {[{ id: 'active', label: 'Active Clients' }, { id: 'all', label: 'All Clients' }].map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${filter === f.id ? 'bg-brandOrange text-white shadow-md shadow-brandOrange/20' : 'bg-gray-100 text-gray-500 hover:text-gray-700'}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {clients.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <User size={40} className="text-gray-200 mb-3" />
          <p className="text-lg font-bold text-gray-500">No clients yet</p>
          <p className="text-sm text-gray-400 mt-1">{filter === 'active' ? 'No active bookings.' : 'No bookings yet.'}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {clients.map(({ client, bookings: cb }) => {
            const clientName    = client?.name  || 'Client';
            const clientEmail   = client?.email || '';
            const latest        = cb.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
            const confirmedCount = cb.filter(b => b.status === 'confirmed').length;
            const completedCount = cb.filter(b => b.status === 'completed').length;
            const isPackage      = latest?.notes?.startsWith('Package:');
            const onlineReady    = cb.filter(b => b.sessionType === 'Online' && b.status === 'confirmed');

            return (
              <div key={client?._id || clientName} className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-gray-200 transition">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
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
                        <span>{cb.length} total booking{cb.length !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1 bg-gray-50 px-2.5 py-1.5 rounded-lg">
                      <Calendar size={11} /> {latest?.sessionDate}
                    </span>
                    <span className="flex items-center gap-1 bg-gray-50 px-2.5 py-1.5 rounded-lg">
                      <Clock size={11} /> {latest?.sessionTime}
                    </span>
                    <span className="flex items-center gap-1 bg-gray-50 px-2.5 py-1.5 rounded-lg">
                      {latest?.sessionType === 'Online' ? <Video size={11}/> : <MapPin size={11}/>}
                      {latest?.sessionType}
                    </span>
                    {isPackage && (
                      <span className="flex items-center gap-1 bg-orange-50 text-brandOrange px-2.5 py-1.5 rounded-lg font-bold">
                        <Package size={11}/> Package
                      </span>
                    )}
                  </div>

                  <span className={`text-xs font-bold px-3 py-1.5 rounded-lg shrink-0 ${(statusStyles[latest?.status] || statusStyles.pending).pill}`}>
                    {(statusStyles[latest?.status] || statusStyles.pending).label}
                  </span>
                </div>

                {onlineReady.map(booking => {
                  const sess = sessions[booking._id];
                  return (
                    <div key={booking._id} className="mt-4 bg-blue-50 border border-blue-100 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-bold text-blue-700 flex items-center gap-1.5">
                          <Video size={12} /> Online Session
                          <span className="font-normal text-blue-500 ml-1">{booking.sessionDate} · {booking.sessionTime}</span>
                        </p>
                        {sess && sess !== 'loading' && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${sessionStatusStyles[sess.sessionStatus] || ''}`}>
                            {sess.sessionStatus}
                          </span>
                        )}
                      </div>
                      {(!sess || sess === 'loading' || sess?.sessionStatus === 'scheduled') && (
                        <button onClick={() => startOfficialSession(booking)} disabled={sess === 'loading'}
                          className="w-full py-2 bg-brandOrange text-white text-xs font-bold rounded-lg hover:bg-orange-600 transition flex items-center justify-center gap-2 disabled:opacity-50">
                          <Video size={13} /> Start Session
                        </button>
                      )}
                      {sess?.sessionStatus === 'live' && (
                        <button onClick={() => startOfficialSession(booking)}
                          className="w-full py-2 bg-green-500 text-white text-xs font-bold rounded-lg animate-pulse flex items-center justify-center gap-2">
                          <Video size={13} /> Rejoin Live Session
                        </button>
                      )}
                      {sess?.sessionStatus === 'completed' && (
                        <p className="text-xs text-blue-600 font-semibold flex items-center gap-1.5">
                          <CheckCircle size={12} /> Completed{sess.durationMinutes ? ` · ${sess.durationMinutes} min` : ''}
                          {' · '}Client {sess.clientAttended ? 'attended' : 'missed'}
                        </p>
                      )}
                      {sess?.sessionStatus === 'missed' && (
                        <p className="text-xs text-red-500 font-semibold flex items-center gap-1.5">
                          <XCircle size={12} /> Session missed
                        </p>
                      )}
                    </div>
                  );
                })}

                {cb.length > 1 && (
                  <div className="mt-4 pt-4 border-t border-gray-50">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">All Bookings ({cb.length})</p>
                    <div className="flex flex-col gap-2">
                      {cb.map(b => {
                        const s = statusStyles[b.status] || statusStyles.pending;
                        return (
                          <div key={b._id} className="flex items-center justify-between text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                            <span>{b.sessionDate} at {b.sessionTime} · {b.sessionType}</span>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-700">Rs. {b.price?.toLocaleString()}</span>
                              <span className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${s.pill}`}>{s.label}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {latest?.notes && (
                  <div className="mt-3 pt-3 border-t border-gray-50">
                    <p className="text-xs text-gray-400 italic">"{latest.notes}"</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {callDeclined && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3">
          <PhoneOff size={18} className="text-red-400 shrink-0" />
          <p className="text-sm font-semibold">{callDeclined.name} declined the call</p>
        </div>
      )}

      {incomingCall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={e => e.stopPropagation()}>
          <div className="bg-gray-900 rounded-3xl p-8 shadow-2xl text-center max-w-sm w-full mx-4 border border-gray-700">
            <div className="relative w-24 h-24 mx-auto mb-5">
              <div className="absolute inset-0 rounded-full bg-brandOrange/20 animate-ping" />
              <div className="absolute inset-2 rounded-full bg-brandOrange/30 animate-ping" style={{ animationDelay: '0.2s' }} />
              <div className="relative w-24 h-24 rounded-full bg-brandOrange flex items-center justify-center">
                <Phone size={32} className="text-white" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-white mb-1">Incoming Call</h3>
            <p className="text-gray-400 text-sm mb-2">{incomingCall.fromUserName} is calling</p>
            {incomingCall.isOfficialSession && (
              <span className="inline-block mb-4 text-xs font-bold bg-green-500/20 text-green-400 px-3 py-1 rounded-full border border-green-500/30">
                Official Session Call
              </span>
            )}
            <p className="text-gray-500 text-xs mb-5">You must accept or decline to continue</p>
            <div className="flex gap-3">
              <button onClick={declineCall} className="flex-1 py-4 rounded-2xl bg-red-500/20 text-red-400 font-bold hover:bg-red-500/30 border border-red-500/30 transition flex items-center justify-center gap-2">
                <PhoneOff size={20} /> Decline
              </button>
              <button onClick={acceptCall} className="flex-1 py-4 rounded-2xl bg-green-500 text-white font-bold hover:bg-green-600 transition flex items-center justify-center gap-2">
                <Phone size={20} /> Accept
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}