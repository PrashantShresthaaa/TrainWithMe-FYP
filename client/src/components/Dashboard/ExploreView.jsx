import React, { useState, useEffect } from 'react';
import { Search, MapPin, Star, Filter, ArrowLeft, CheckCircle, Flame, Mail, Video, Clock, MessageSquare, Shield, AlertCircle, Loader, Package, Zap, Calendar, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// ─────────────────────────────────────────────
// MINI CALENDAR COMPONENT
// availableDayNames: ["Mon","Wed",...] — only these days clickable (pass [] for no restriction)
// selectedIso: "2026-03-10" or null
// onChange: (isoString, dayName) => void
// ─────────────────────────────────────────────
const DAY_SHORT  = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const DAY_HEADER = ['Su','Mo','Tu','We','Th','Fr','Sa'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const MiniCalendar = ({ availableDayNames = [], selectedIso, onChange }) => {
  const todayRef = new Date();
  todayRef.setHours(0,0,0,0);

  const [viewYear,  setViewYear]  = useState(todayRef.getFullYear());
  const [viewMonth, setViewMonth] = useState(todayRef.getMonth());

  const daysInMonth    = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOffset = new Date(viewYear, viewMonth, 1).getDay();

  const goPrev = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y=>y-1); } else setViewMonth(m=>m-1); };
  const goNext = () => { if (viewMonth === 11) { setViewMonth(0);  setViewYear(y=>y+1); } else setViewMonth(m=>m+1); };

  const handleClick = (day) => {
    const clicked = new Date(viewYear, viewMonth, day);
    clicked.setHours(0,0,0,0);
    if (clicked <= todayRef) return;
    const dayName = DAY_SHORT[clicked.getDay()];
    if (availableDayNames.length > 0 && !availableDayNames.includes(dayName)) return;
    const iso = `${viewYear}-${String(viewMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    onChange(iso, dayName);
  };

  const isoOf = (day) => `${viewYear}-${String(viewMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;

  const isDisabled = (day) => {
    const d = new Date(viewYear, viewMonth, day);
    d.setHours(0,0,0,0);
    if (d <= todayRef) return true;
    const dayName = DAY_SHORT[d.getDay()];
    if (availableDayNames.length > 0 && !availableDayNames.includes(dayName)) return true;
    return false;
  };

  const isToday = (day) => new Date(viewYear, viewMonth, day).toDateString() === new Date().toDateString();

  // Build cells: nulls for offset, then day numbers
  const cells = [...Array(firstDayOffset).fill(null), ...Array.from({length: daysInMonth}, (_,i)=>i+1)];

  return (
    <div className="bg-gray-50 border border-gray-100 rounded-2xl p-3">
      {/* Month nav */}
      <div className="flex items-center justify-between mb-2">
        <button onClick={goPrev} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-200 transition text-gray-500">
          <ChevronLeft size={15}/>
        </button>
        <span className="text-xs font-bold text-gray-700">{MONTHS[viewMonth]} {viewYear}</span>
        <button onClick={goNext} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-200 transition text-gray-500">
          <ChevronRight size={15}/>
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_HEADER.map(d => (
          <div key={d} className="text-center text-[10px] font-bold text-gray-400 py-0.5">{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`}/>;
          const disabled  = isDisabled(day);
          const selected  = isoOf(day) === selectedIso;
          const todayMark = isToday(day);
          return (
            <button
              key={day}
              onClick={() => !disabled && handleClick(day)}
              className={`h-7 w-full rounded-lg text-[11px] font-semibold transition-all
                ${selected  ? 'bg-brandOrange text-white shadow-sm' : ''}
                ${!selected && !disabled ? 'hover:bg-orange-100 hover:text-brandOrange text-gray-700 cursor-pointer' : ''}
                ${disabled  ? 'text-gray-300 cursor-not-allowed' : ''}
                ${todayMark && !selected ? 'ring-1 ring-brandOrange text-brandOrange' : ''}
              `}
            >
              {day}
            </button>
          );
        })}
      </div>

      {/* Available days legend */}
      {availableDayNames.length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-200 flex flex-wrap gap-1 items-center">
          <span className="text-[10px] text-gray-400 font-medium">Available:</span>
          {availableDayNames.map(d => (
            <span key={d} className="text-[10px] font-bold text-brandOrange bg-orange-50 px-1.5 py-0.5 rounded">{d}</span>
          ))}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
// MAIN EXPLORE VIEW
// ─────────────────────────────────────────────
const ExploreView = ({ setActiveTab, openMessagesWithTrainer }) => {
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [trainers, setTrainers] = useState([]);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  useEffect(() => {
    const loadTrainers = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/trainers');
        if (!res.ok) throw new Error('Could not load trainers');
        const data = await res.json();
        setTrainers(data);
      } catch (err) {
        setFetchError('Failed to load trainers. Please try again.');
      } finally {
        setFetchLoading(false);
      }
    };
    loadTrainers();
  }, []);

  const filteredTrainers = trainers.filter(trainer => {
    const matchesCategory = activeCategory === 'All' || trainer.specialty === activeCategory;
    const matchesSearch =
      trainer.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trainer.specialty?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (fetchLoading) return (
    <div className="flex items-center justify-center h-96">
      <div className="flex flex-col items-center gap-3">
        <Loader size={32} className="animate-spin text-brandOrange"/>
        <p className="text-sm font-semibold text-gray-400">Loading trainers...</p>
      </div>
    </div>
  );

  if (fetchError) return (
    <div className="flex items-center justify-center h-96">
      <div className="flex flex-col items-center gap-3 text-red-500">
        <AlertCircle size={32}/>
        <p className="text-sm font-semibold">{fetchError}</p>
        <button onClick={() => window.location.reload()} className="mt-2 text-xs font-bold text-brandOrange underline">Retry</button>
      </div>
    </div>
  );

  if (!selectedTrainer) {
    return (
      <div className="space-y-8 animate-fadeIn pb-10">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-brandBlack">Find Your Trainer</h2>
              <p className="text-gray-500 text-sm">Browse certified professionals based on your goals.</p>
            </div>
            <span className="px-3 py-1 bg-orange-50 text-brandOrange text-xs font-bold rounded-full flex items-center gap-1">
              <Flame size={14}/> {trainers.length} Trainers Available
            </span>
          </div>
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-3.5 text-gray-400" size={20}/>
              <input type="text" placeholder="Search by name or specialty..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brandOrange focus:ring-2 focus:ring-brandOrange/10 transition"/>
            </div>
            <button className="bg-brandBlack text-white px-6 rounded-xl font-bold hover:bg-gray-800 transition flex items-center gap-2">
              <Filter size={18}/> <span className="hidden md:inline">Filters</span>
            </button>
          </div>
          <div className="flex gap-3 mt-6 overflow-x-auto pb-2">
            {['All','Gym','Yoga','HIIT','Martial Arts','Zumba'].map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                className={`px-6 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${activeCategory === cat ? 'bg-brandOrange text-white shadow-lg shadow-orange-500/30' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold text-brandBlack mb-4">
            {searchTerm || activeCategory !== 'All' ? `Results (${filteredTrainers.length})` : 'All Trainers'}
          </h3>
          {filteredTrainers.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <p className="text-lg font-bold">No trainers found</p>
              <p className="text-sm mt-1">Try a different search or category</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTrainers.map(trainer => {
                const hasPackages = trainer.packages?.filter(p => p.isActive !== false).length > 0;
                const cheapestPkg = hasPackages ? trainer.packages.filter(p => p.isActive !== false).sort((a,b) => a.price-b.price)[0] : null;
                return (
                  <div key={trainer._id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 group cursor-pointer" onClick={() => setSelectedTrainer(trainer)}>
                    <div className="h-48 overflow-hidden relative bg-gray-100">
                      <img src={trainer.profileImage || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=400'} alt={trainer.user?.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"/>
                      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1 text-xs font-bold shadow-sm">
                        <Star size={12} fill="#FF6700" className="text-brandOrange"/> {trainer.rating || '5.0'}
                      </div>
                      {hasPackages && (
                        <div className="absolute bottom-3 left-3 bg-brandOrange text-white text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1">
                          <Package size={10}/> Packages Available
                        </div>
                      )}
                    </div>
                    <div className="p-5">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="text-xs font-bold text-brandOrange uppercase">{trainer.specialty}</span>
                          <h4 className="text-lg font-bold text-brandBlack">{trainer.user?.name || 'Trainer'}</h4>
                        </div>
                        <div className="text-right">
                          <p className="text-brandBlack font-bold">Rs. {trainer.price}<span className="text-xs text-gray-400 font-normal">/hr</span></p>
                          {cheapestPkg && <p className="text-[10px] text-green-600 font-bold">Pkg from Rs. {cheapestPkg.price?.toLocaleString()}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-gray-500 text-xs mb-4"><MapPin size={14}/> {trainer.location || 'Kathmandu, Nepal'}</div>
                      <div className="flex gap-2">
                        <button className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-50 transition">Profile</button>
                        <button className="flex-1 bg-brandBlack text-white py-2.5 rounded-xl text-sm font-bold hover:bg-brandOrange transition">Book</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Trainer Profile View ──
  return (
    <div className="animate-fadeIn">
      <button onClick={() => setSelectedTrainer(null)} className="flex items-center gap-2 text-gray-500 hover:text-brandOrange font-bold mb-6 transition">
        <ArrowLeft size={20}/> Back to Search
      </button>
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Profile header */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col sm:flex-row gap-6 items-start">
            <img src={selectedTrainer.profileImage || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=400'} alt={selectedTrainer.user?.name}
              className="w-32 h-32 rounded-2xl object-cover border-4 border-gray-50"/>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-black text-brandBlack">{selectedTrainer.user?.name || 'Trainer'}</h1>
                  <p className="text-brandOrange font-bold text-sm uppercase tracking-wide">{selectedTrainer.specialty} Specialist</p>
                </div>
                <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                  <CheckCircle size={14}/> Verified
                </div>
              </div>
              <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-600">
                <span className="flex items-center gap-1"><Star size={16} className="text-brandOrange" fill="#FF6700"/><b>{selectedTrainer.rating || '5.0'}</b></span>
                <span className="flex items-center gap-1"><MapPin size={16}/> {selectedTrainer.location || 'Kathmandu'}</span>
                {selectedTrainer.languages?.length > 0 && (
                  <span className="flex items-center gap-1"><Globe size={16}/> {selectedTrainer.languages.join(', ')}</span>
                )}
              </div>
              {selectedTrainer.certifications?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {selectedTrainer.certifications.map((c,i) => (
                    <span key={i} className="bg-orange-50 text-brandOrange text-xs font-bold px-2.5 py-1 rounded-lg border border-orange-100">{c}</span>
                  ))}
                </div>
              )}
              <div className="mt-5">
                <button
                  onClick={() => {
                    if (openMessagesWithTrainer) {
                      openMessagesWithTrainer({
                        _id:  selectedTrainer.user._id,
                        name: selectedTrainer.user.name,
                        role: 'trainer',
                      });
                    } else {
                      setActiveTab('messages');
                    }
                  }}
                  className="bg-gray-100 text-brandBlack px-6 py-3 rounded-xl font-bold hover:bg-gray-200 transition flex items-center gap-2">
                  <MessageSquare size={18}/> Message
                </button>
              </div>
            </div>
          </div>

          {/* About */}
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
            <h3 className="text-xl font-bold text-brandBlack mb-4">About Me</h3>
            <p className="text-gray-600 leading-relaxed">{selectedTrainer.bio || 'No bio provided yet.'}</p>
            <div className="mt-8 grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-xl">
                <h4 className="font-bold text-brandBlack text-sm flex items-center gap-2"><Shield size={16} className="text-brandOrange"/> Experience</h4>
                <p className="text-xs text-gray-600 mt-2">{selectedTrainer.experience} years</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <h4 className="font-bold text-brandBlack text-sm flex items-center gap-2"><Mail size={16} className="text-brandOrange"/> Contact</h4>
                <p className="text-xs text-gray-600 mt-2">{selectedTrainer.user?.email || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <BookingCard trainer={selectedTrainer}/>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// BOOKING CARD
// ─────────────────────────────────────────────
const BookingCard = ({ trainer }) => {
  const { getToken } = useAuth();
  const [bookingMode, setBookingMode] = useState('single');

  const timeSlots = trainer.timeSlots || [];
  const availableDayNames = [...new Set(timeSlots.map(s => s.split(' ')[0]))];

  // ── Single session state ──
  const [status,          setStatus]          = useState('idle');
  const [errorMsg,        setErrorMsg]        = useState('');
  const [sessionType,     setSessionType]     = useState('Online');
  const [selectedIso,     setSelectedIso]     = useState(null);   // "2026-03-10"
  const [selectedDayName, setSelectedDayName] = useState(null);   // "Mon"
  const [selectedTime,    setSelectedTime]    = useState(null);   // "7:00 AM"
  const [notes,           setNotes]           = useState('');

  const timesForDay = selectedDayName
    ? timeSlots.filter(s => s.startsWith(selectedDayName + ' ')).map(s => s.replace(`${selectedDayName} `,''))
    : [];

  const handleDateChange = (iso, dayName) => {
    setSelectedIso(iso);
    setSelectedDayName(dayName);
    setSelectedTime(null);
  };

  const selectedDateLabel = selectedIso
    ? new Date(selectedIso + 'T00:00:00').toLocaleDateString('en-US', { weekday:'long', month:'short', day:'numeric' })
    : null;

  // ── Package state ──
  const activePackages = (trainer.packages || []).filter(p => p.isActive !== false);
  const [selectedPkgId,  setSelectedPkgId]  = useState(activePackages[0]?._id || null);
  const [pkgSessionType, setPkgSessionType] = useState('In-Person');
  const [pkgIso,         setPkgIso]         = useState(null);
  const [pkgStatus,      setPkgStatus]      = useState('idle');
  const [pkgError,       setPkgError]       = useState('');
  const selectedPkg = activePackages.find(p => p._id === selectedPkgId);

  const pkgDateLabel = pkgIso
    ? new Date(pkgIso + 'T00:00:00').toLocaleDateString('en-US', { weekday:'long', month:'short', day:'numeric' })
    : null;

  // ── Book single session ──
  const handleBook = async () => {
    if (!selectedIso || !selectedTime) return;
    setStatus('loading'); setErrorMsg('');
    const token = getToken();
    if (!token) { setErrorMsg('You must be logged in.'); setStatus('error'); return; }
    try {
      const res = await fetch('http://localhost:5000/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type':'application/json', 'Authorization':`Bearer ${token}` },
        body: JSON.stringify({ trainerId: trainer.user._id, sessionDate: selectedIso, sessionTime: selectedTime, sessionType, price: trainer.price, notes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Something went wrong');
      setStatus('success');
    } catch (err) { setErrorMsg(err.message); setStatus('error'); }
  };

  // ── Book package ──
  const handlePackageBook = async () => {
    if (!pkgIso)       { setPkgError('Please select a start date'); return; }
    if (!selectedPkg)  { setPkgError('Please select a package');    return; }
    setPkgStatus('loading'); setPkgError('');
    const token = getToken();
    if (!token) { setPkgError('You must be logged in.'); setPkgStatus('error'); return; }
    try {
      const res = await fetch('http://localhost:5000/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type':'application/json', 'Authorization':`Bearer ${token}` },
        body: JSON.stringify({
          trainerId: trainer.user._id,
          sessionDate: pkgIso,
          sessionTime: '09:00 AM',
          sessionType: pkgSessionType,
          price: selectedPkg.price,
          notes: `Package: ${selectedPkg.name} — ${selectedPkg.sessions} sessions${selectedPkg.discount > 0 ? ` (${selectedPkg.discount}% discount)` : ''}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Something went wrong');
      setPkgStatus('success');
    } catch (err) { setPkgError(err.message); setPkgStatus('error'); }
  };

  // ── Success states ──
  if (bookingMode === 'single' && status === 'success') return (
    <div className="bg-white rounded-3xl p-8 border border-green-100 shadow-lg text-center">
      <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle size={32}/></div>
      <h3 className="text-xl font-bold text-brandBlack">Request Sent!</h3>
      <p className="text-sm text-gray-500 mt-2">{trainer.user?.name} will confirm shortly.</p>
      <div className="mt-6 bg-gray-50 p-4 rounded-xl text-left space-y-2">
        <p className="text-xs text-gray-400 uppercase font-bold">Booking Summary</p>
        <p className="text-sm font-semibold text-gray-700">{selectedDateLabel} · {selectedTime}</p>
        <p className="text-sm text-gray-500">{sessionType} · Rs. {trainer.price}/hr</p>
        <p className="text-sm font-bold text-brandOrange flex items-center gap-2 mt-2"><Clock size={14}/> Pending Approval</p>
      </div>
      <button onClick={() => { setStatus('idle'); setSelectedIso(null); setSelectedDayName(null); setSelectedTime(null); setNotes(''); }}
        className="mt-6 text-sm font-bold text-brandBlack underline hover:text-brandOrange transition">Book Another Session</button>
    </div>
  );

  if (bookingMode === 'package' && pkgStatus === 'success') return (
    <div className="bg-white rounded-3xl p-8 border border-green-100 shadow-lg text-center">
      <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle size={32}/></div>
      <h3 className="text-xl font-bold text-brandBlack">Package Booked!</h3>
      <p className="text-sm text-gray-500 mt-2">{trainer.user?.name} will confirm your {selectedPkg?.name}.</p>
      <div className="mt-6 bg-gray-50 p-4 rounded-xl text-left space-y-2">
        <p className="text-xs text-gray-400 uppercase font-bold">Package Summary</p>
        <p className="text-sm font-semibold text-gray-700">{selectedPkg?.name} — {selectedPkg?.sessions} sessions</p>
        <p className="text-sm text-gray-500">Starting {pkgDateLabel} · {pkgSessionType}</p>
        <p className="text-sm font-bold text-brandOrange">Rs. {selectedPkg?.price?.toLocaleString()} total</p>
      </div>
      <button onClick={() => { setPkgStatus('idle'); setPkgIso(null); }} className="mt-6 text-sm font-bold text-brandBlack underline hover:text-brandOrange transition">Book Another</button>
    </div>
  );

  return (
    <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-xl sticky top-24">

      {/* Price */}
      <div className="flex justify-between items-end mb-5 border-b border-gray-100 pb-4">
        <div>
          <p className="text-xs text-gray-400 font-bold uppercase">Rate</p>
          <h3 className="text-3xl font-black text-brandBlack">Rs. {trainer.price}<span className="text-sm font-medium text-gray-400">/hr</span></h3>
        </div>
        {activePackages.length > 0 && (
          <p className="text-xs text-green-600 font-bold">{activePackages.length} package{activePackages.length > 1 ? 's' : ''} available</p>
        )}
      </div>

      {/* Mode tabs */}
      <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
        <button onClick={() => setBookingMode('single')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${bookingMode === 'single' ? 'bg-white text-brandBlack shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          <Clock size={13}/> Single Session
        </button>
        <button onClick={() => setBookingMode('package')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${bookingMode === 'package' ? 'bg-brandOrange text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          disabled={activePackages.length === 0}>
          <Package size={13}/> Book Package
          {activePackages.length === 0 && <span className="text-[9px] opacity-60">(none set)</span>}
        </button>
      </div>

      {/* ════ SINGLE SESSION ════ */}
      {bookingMode === 'single' && (
        <>
          {/* Session type */}
          <div className="flex bg-gray-100 p-1 rounded-xl mb-5">
            {['In-Person','Online'].map(m => (
              <button key={m} onClick={() => setSessionType(m)}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${sessionType === m ? 'bg-white text-brandBlack shadow-sm' : 'text-gray-500'}`}>
                {m === 'Online'
                  ? <span className="flex items-center justify-center gap-1"><Video size={13}/> Online</span>
                  : <span className="flex items-center justify-center gap-1"><MapPin size={13}/> In-Person</span>}
              </button>
            ))}
          </div>

          {timeSlots.length === 0 && (
            <div className="mb-4 bg-amber-50 border border-amber-100 rounded-xl p-3 flex items-center gap-2 text-xs text-amber-600 font-medium">
              <Info size={14}/> This trainer hasn't set their availability yet.
            </div>
          )}

          {/* Calendar */}
          <div className="mb-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <Calendar size={12}/> Select Date
            </p>
            <MiniCalendar
              availableDayNames={availableDayNames}
              selectedIso={selectedIso}
              onChange={handleDateChange}
            />
          </div>

          {/* Time slots — appear after date selected */}
          {selectedIso && (
            <div className="mb-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                Available Times
                <span className="font-normal normal-case text-gray-400 ml-1">— {selectedDateLabel}</span>
              </p>
              {timesForDay.length === 0 ? (
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-600 font-medium">
                  No slots set for {selectedDayName}s. Pick another date.
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {timesForDay.map(time => (
                    <button key={time} onClick={() => setSelectedTime(time)}
                      className={`py-2 text-xs font-bold rounded-lg border transition
                        ${selectedTime === time ? 'bg-brandBlack text-white border-brandBlack' : 'border-gray-200 text-gray-600 hover:border-brandBlack hover:bg-gray-50'}`}>
                      {time}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Confirmation pill */}
          {selectedIso && selectedTime && (
            <div className="mb-4 bg-orange-50 border border-orange-100 rounded-xl px-4 py-2.5 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase">Selected</p>
                <p className="text-xs font-bold text-brandOrange">{selectedDateLabel} · {selectedTime}</p>
              </div>
              <CheckCircle size={16} className="text-brandOrange"/>
            </div>
          )}

          {/* Notes */}
          <div className="mb-5">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
              Notes <span className="text-gray-400 font-normal normal-case">(optional)</span>
            </p>
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="E.g. I want to focus on flexibility..." rows={3} maxLength={500}
              className="w-full px-4 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brandOrange focus:ring-2 focus:ring-brandOrange/10 transition resize-none"/>
          </div>

          {status === 'error' && (
            <div className="mb-4 flex items-start gap-2 bg-red-50 border border-red-100 text-red-600 text-xs font-semibold px-4 py-3 rounded-xl">
              <AlertCircle size={14} className="mt-0.5 shrink-0"/> {errorMsg}
            </div>
          )}

          <button onClick={handleBook} disabled={!selectedIso || !selectedTime || status === 'loading'}
            className="w-full bg-brandOrange text-white py-4 rounded-xl font-bold text-sm hover:bg-orange-600 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
            {status === 'loading'
              ? <span className="flex items-center justify-center gap-2"><Loader size={16} className="animate-spin"/> Sending...</span>
              : 'Send Booking Request'}
          </button>
        </>
      )}

      {/* ════ PACKAGES ════ */}
      {bookingMode === 'package' && (
        <>
          {activePackages.length === 0 ? (
            <div className="py-8 text-center text-gray-400">
              <Package size={32} className="mx-auto mb-2 text-gray-200"/>
              <p className="text-sm font-bold text-gray-500">No packages available</p>
              <p className="text-xs mt-1">This trainer hasn't set up packages yet.</p>
            </div>
          ) : (
            <>
              {/* Package list */}
              <div className="mb-5">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Choose Package</p>
                <div className="flex flex-col gap-2">
                  {activePackages.map(p => (
                    <button key={p._id} onClick={() => setSelectedPkgId(p._id)}
                      className={`relative text-left p-3 rounded-xl border-2 transition-all ${selectedPkgId === p._id ? 'border-brandOrange bg-orange-50' : 'border-gray-100 hover:border-gray-200'}`}>
                      {p.discount > 0 && (
                        <span className="absolute -top-2 -right-2 bg-brandOrange text-white text-[9px] font-bold px-2 py-0.5 rounded-full">{p.discount}% off</span>
                      )}
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-bold text-sm text-gray-800">{p.name}</p>
                          <p className="text-xs text-gray-400">{p.sessions} sessions</p>
                          {p.description && <p className="text-xs text-gray-400 italic mt-0.5">{p.description}</p>}
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-brandOrange">Rs. {p.price?.toLocaleString()}</p>
                          <p className="text-[10px] text-gray-400">Rs. {Math.round(p.price/p.sessions)}/session</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Session type */}
              <div className="flex bg-gray-100 p-1 rounded-xl mb-5">
                {['In-Person','Online'].map(m => (
                  <button key={m} onClick={() => setPkgSessionType(m)}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${pkgSessionType === m ? 'bg-white text-brandBlack shadow-sm' : 'text-gray-500'}`}>
                    {m === 'Online'
                      ? <span className="flex items-center justify-center gap-1"><Video size={13}/> Online</span>
                      : <span className="flex items-center justify-center gap-1"><MapPin size={13}/> In-Person</span>}
                  </button>
                ))}
              </div>

              {/* Calendar for start date — no day restriction for packages */}
              <div className="mb-4">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Calendar size={12}/> Start Date
                </p>
                <MiniCalendar
                  availableDayNames={[]}
                  selectedIso={pkgIso}
                  onChange={(iso) => setPkgIso(iso)}
                />
                {pkgDateLabel && (
                  <div className="mt-2 bg-orange-50 border border-orange-100 rounded-xl px-3 py-2 flex items-center justify-between">
                    <p className="text-xs font-bold text-brandOrange">{pkgDateLabel}</p>
                    <CheckCircle size={14} className="text-brandOrange"/>
                  </div>
                )}
              </div>

              {/* Price summary */}
              {selectedPkg && (
                <div className="bg-gray-50 rounded-xl p-3 mb-5">
                  <div className="flex justify-between font-bold text-sm">
                    <span>{selectedPkg.name}</span>
                    <span className="text-brandOrange">Rs. {selectedPkg.price?.toLocaleString()}</span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">{selectedPkg.sessions} sessions · Rs. {Math.round(selectedPkg.price/selectedPkg.sessions)}/session</p>
                </div>
              )}

              {pkgStatus === 'error' && (
                <div className="mb-4 flex items-start gap-2 bg-red-50 border border-red-100 text-red-600 text-xs font-semibold px-4 py-3 rounded-xl">
                  <AlertCircle size={14} className="mt-0.5 shrink-0"/> {pkgError}
                </div>
              )}

              <button onClick={handlePackageBook} disabled={pkgStatus === 'loading' || !selectedPkg}
                className="w-full bg-brandOrange text-white py-4 rounded-xl font-bold text-sm hover:bg-orange-600 transition shadow-lg shadow-brandOrange/20 disabled:opacity-50 flex items-center justify-center gap-2">
                {pkgStatus === 'loading'
                  ? <><Loader size={16} className="animate-spin"/> Booking...</>
                  : <><Zap size={16}/> Book {selectedPkg?.name} — Rs. {selectedPkg?.price?.toLocaleString()}</>}
              </button>
            </>
          )}
        </>
      )}

      <p className="text-center text-xs text-gray-400 mt-4 flex items-center justify-center gap-1">
        <Shield size={12}/> Secure payment via eSewa/Khalti
      </p>
    </div>
  );
};

// Globe icon (inline to avoid import issues)
const Globe = ({ size, className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
);

export default ExploreView;