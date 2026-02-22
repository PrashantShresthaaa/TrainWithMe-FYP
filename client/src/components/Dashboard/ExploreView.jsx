import React, { useState } from 'react';
import { Search, MapPin, Star, Filter, ArrowLeft, CheckCircle, Flame, Mail, Phone, Calendar, Video, Clock, MessageSquare, Shield } from 'lucide-react';

const ExploreView = ({ setActiveTab }) => {
  const [selectedTrainer, setSelectedTrainer] = useState(null); // Controls View State
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Mock Data
  const trainers = [
    { id: 1, name: "Sita Gurung", type: "Yoga", rating: 4.9, reviews: 120, price: 1500, img: "https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=400", recommended: true, bio: "Certified Yoga Alliance instructor with 8 years of experience. I specialize in Hatha and Vinyasa flow, helping clients improve flexibility, reduce stress, and find mental clarity.", phone: "+977 9841******", email: "sita@trainwithme.np" },
    { id: 2, name: "Rohan Shrestha", type: "Gym", rating: 5.0, reviews: 85, price: 2000, img: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=400", recommended: false, bio: "Professional bodybuilder and strength coach. I help you build muscle and lose fat with science-based training programs.", phone: "+977 9803******", email: "rohan@trainwithme.np" },
    { id: 3, name: "Priya Karki", type: "HIIT", rating: 4.8, reviews: 200, price: 1200, img: "https://images.unsplash.com/photo-1616279967983-ec413476e824?q=80&w=400", recommended: true, bio: "High energy HIIT trainer. I will push you to your limits and help you achieve your cardio goals.", phone: "+977 9813******", email: "priya@trainwithme.np" },
    { id: 4, name: "Anish Magar", type: "Martial Arts", rating: 4.9, reviews: 60, price: 1800, img: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?q=80&w=400", recommended: false, bio: "Black belt in Karate and Kickboxing. Learn self-defense and discipline.", phone: "+977 9860******", email: "anish@trainwithme.np" },
  ];

  // Filtering
  const filteredTrainers = trainers.filter(trainer => {
    const matchesCategory = activeCategory === 'All' || trainer.type === activeCategory;
    const matchesSearch = trainer.name.toLowerCase().includes(searchTerm.toLowerCase()) || trainer.type.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // --- VIEW 1: TRAINER LIST ---
  if (!selectedTrainer) {
    return (
      <div className="space-y-8 animate-fadeIn pb-10">
        {/* Search Header */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-brandBlack">Find Your Trainer</h2>
              <p className="text-gray-500 text-sm">Browse certified professionals based on your goals.</p>
            </div>
            <span className="px-3 py-1 bg-orange-50 text-brandOrange text-xs font-bold rounded-full flex items-center gap-1">
                <Flame size={14} /> AI Recommendation On
            </span>
          </div>

          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
              <input 
                type="text" 
                placeholder="Search by name, category (e.g. Yoga)..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brandOrange focus:ring-2 focus:ring-brandOrange/10 transition"
              />
            </div>
            <button className="bg-brandBlack text-white px-6 rounded-xl font-bold hover:bg-gray-800 transition flex items-center gap-2">
              <Filter size={18} /> <span className="hidden md:inline">Filters</span>
            </button>
          </div>

          <div className="flex gap-3 mt-6 overflow-x-auto pb-2">
            {['All', 'Gym', 'Yoga', 'HIIT', 'Martial Arts', 'Zumba'].map(cat => (
              <button 
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-6 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${activeCategory === cat ? 'bg-brandOrange text-white shadow-lg shadow-orange-500/30' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Recommended Grid */}
        {activeCategory === 'All' && !searchTerm && (
          <div>
            <h3 className="text-lg font-bold text-brandBlack mb-4 flex items-center gap-2">Recommended for You</h3>
            <div className="grid md:grid-cols-2 gap-6">
              {trainers.filter(t => t.recommended).map(trainer => (
                <div key={trainer.id} className="bg-gradient-to-r from-brandBlack to-gray-800 p-1 rounded-2xl shadow-xl cursor-pointer hover:scale-[1.01] transition" onClick={() => setSelectedTrainer(trainer)}>
                  <div className="bg-[#1a1a1a] rounded-xl p-5 flex gap-5 items-center relative overflow-hidden h-full">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-brandOrange/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                    <img src={trainer.img} alt={trainer.name} className="w-24 h-24 rounded-xl object-cover border-2 border-brandOrange/50 z-10" />
                    <div className="z-10 flex-1">
                      <div className="flex justify-between items-start">
                          <div>
                              <span className="text-brandOrange text-xs font-bold uppercase tracking-wider">{trainer.type}</span>
                              <h4 className="text-white text-xl font-bold">{trainer.name}</h4>
                          </div>
                          <div className="bg-white/10 px-2 py-1 rounded text-white text-xs font-bold flex items-center gap-1"><Star size={12} fill="#FF6700" className="text-brandOrange"/> {trainer.rating}</div>
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                          <p className="text-gray-400 text-sm">{trainer.reviews} reviews</p>
                          <button className="bg-white text-black px-4 py-2 rounded-lg text-xs font-bold hover:bg-brandOrange hover:text-white transition">Book Now</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Trainers Grid */}
        <div>
          <h3 className="text-lg font-bold text-brandBlack mb-4">Browse All Trainers</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTrainers.map(trainer => (
              <div key={trainer.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 group cursor-pointer" onClick={() => setSelectedTrainer(trainer)}>
                <div className="h-48 overflow-hidden relative">
                  <img src={trainer.img} alt={trainer.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1 text-xs font-bold shadow-sm"><Star size={12} fill="#FF6700" className="text-brandOrange"/> {trainer.rating}</div>
                </div>
                <div className="p-5">
                  <div className="flex justify-between items-start mb-2">
                      <div><span className="text-xs font-bold text-brandOrange uppercase">{trainer.type}</span><h4 className="text-lg font-bold text-brandBlack">{trainer.name}</h4></div>
                      <p className="text-brandBlack font-bold">Rs. {trainer.price}<span className="text-xs text-gray-400 font-normal">/hr</span></p>
                  </div>
                  <div className="flex items-center gap-1 text-gray-500 text-xs mb-4"><MapPin size={14} /> Kathmandu, Nepal</div>
                  <div className="flex gap-2">
                      <button className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-50 transition">Profile</button>
                      <button className="flex-1 bg-brandBlack text-white py-2.5 rounded-xl text-sm font-bold hover:bg-brandOrange transition shadow-lg shadow-black/20">Book</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // --- VIEW 2: TRAINER PROFILE & BOOKING ---
  return (
    <div className="animate-fadeIn">
      {/* Back Button */}
      <button onClick={() => setSelectedTrainer(null)} className="flex items-center gap-2 text-gray-500 hover:text-brandOrange font-bold mb-6 transition">
        <ArrowLeft size={20} /> Back to Search
      </button>

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Left: Profile Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Header */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col sm:flex-row gap-6 items-start">
            <img src={selectedTrainer.img} alt={selectedTrainer.name} className="w-32 h-32 rounded-2xl object-cover border-4 border-gray-50" />
            <div className="flex-1">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-black text-brandBlack">{selectedTrainer.name}</h1>
                        <p className="text-brandOrange font-bold text-sm uppercase tracking-wide">{selectedTrainer.type} Specialist</p>
                    </div>
                    <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><CheckCircle size={14}/> Verified</div>
                </div>
                
                <div className="flex gap-4 mt-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1"><Star size={16} className="text-brandOrange" fill="#FF6700"/> <b>{selectedTrainer.rating}</b> ({selectedTrainer.reviews} reviews)</span>
                    <span className="flex items-center gap-1"><MapPin size={16}/> Kathmandu</span>
                </div>

                <div className="mt-6 flex gap-3">
                    <button onClick={() => setActiveTab('messages')} className="flex-1 bg-gray-100 text-brandBlack py-3 rounded-xl font-bold hover:bg-gray-200 transition flex items-center justify-center gap-2">
                        <MessageSquare size={18}/> Message
                    </button>
                    <button className="flex-1 border border-gray-200 text-gray-500 py-3 rounded-xl font-bold cursor-not-allowed flex items-center justify-center gap-2">
                        <Phone size={18}/> {selectedTrainer.phone}
                    </button>
                </div>
            </div>
          </div>

          {/* About Section */}
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
            <h3 className="text-xl font-bold text-brandBlack mb-4">About Me</h3>
            <p className="text-gray-600 leading-relaxed">{selectedTrainer.bio}</p>
            
            <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-xl">
                    <h4 className="font-bold text-brandBlack text-sm flex items-center gap-2"><Shield size={16} className="text-brandOrange"/> Certifications</h4>
                    <ul className="text-xs text-gray-600 mt-2 space-y-1 list-disc list-inside">
                        <li>Certified Personal Trainer (CPT)</li>
                        <li>First Aid & CPR Certified</li>
                    </ul>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                    <h4 className="font-bold text-brandBlack text-sm flex items-center gap-2"><Mail size={16} className="text-brandOrange"/> Contact</h4>
                    <p className="text-xs text-gray-600 mt-2">{selectedTrainer.email}</p>
                </div>
            </div>
          </div>
        </div>

        {/* Right: Booking Card */}
        <div className="lg:col-span-1">
            <BookingCard price={selectedTrainer.price} />
        </div>
      </div>
    </div>
  );
};

// --- Booking Component (Internal) ---
const BookingCard = ({ price }) => {
    const [status, setStatus] = useState('idle'); // idle, sending, sent
    const [mode, setMode] = useState('Online');
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedTime, setSelectedTime] = useState(null);

    const handleBook = () => {
        if (!selectedDate || !selectedTime) return;
        setStatus('sending');
        setTimeout(() => setStatus('sent'), 1500);
    };

    if (status === 'sent') {
        return (
            <div className="bg-white rounded-3xl p-8 border border-green-100 shadow-lg text-center animate-fadeIn">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle size={32} />
                </div>
                <h3 className="text-xl font-bold text-brandBlack">Request Sent!</h3>
                <p className="text-sm text-gray-500 mt-2">The trainer will review your request. You will be notified once accepted.</p>
                <div className="mt-6 bg-gray-50 p-4 rounded-xl text-left">
                    <p className="text-xs text-gray-400 uppercase font-bold">Status</p>
                    <p className="text-sm font-bold text-orange-500 flex items-center gap-2"><Clock size={14}/> Pending Approval</p>
                </div>
                <button onClick={() => setStatus('idle')} className="mt-6 text-sm font-bold text-brandBlack underline hover:text-brandOrange">Book Another Session</button>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-xl sticky top-24">
            <div className="flex justify-between items-end mb-6 border-b border-gray-100 pb-4">
                <div>
                    <p className="text-xs text-gray-400 font-bold uppercase">Price</p>
                    <h3 className="text-3xl font-black text-brandBlack">Rs. {price}<span className="text-sm font-medium text-gray-400">/hr</span></h3>
                </div>
            </div>

            {/* Mode Selection */}
            <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
                {['In-Person', 'Online'].map(m => (
                    <button key={m} onClick={() => setMode(m)} className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${mode === m ? 'bg-white text-brandBlack shadow-sm' : 'text-gray-500'}`}>
                        {m === 'Online' ? <span className="flex items-center justify-center gap-1"><Video size={14}/> Online</span> : <span className="flex items-center justify-center gap-1"><MapPin size={14}/> In-Person</span>}
                    </button>
                ))}
            </div>

            {/* Date Selection */}
            <div className="mb-6">
                <p className="text-sm font-bold text-brandBlack mb-3">Select Date</p>
                <div className="flex gap-2 overflow-x-auto pb-2">
                    {['Mon 24', 'Tue 25', 'Wed 26', 'Thu 27'].map((d, i) => (
                        <button key={i} onClick={() => setSelectedDate(d)} className={`min-w-[70px] p-3 rounded-xl border-2 flex flex-col items-center transition ${selectedDate === d ? 'border-brandOrange bg-orange-50 text-brandOrange' : 'border-gray-100 text-gray-500 hover:border-gray-300'}`}>
                            <span className="text-xs font-bold">{d.split(' ')[0]}</span>
                            <span className="text-lg font-black">{d.split(' ')[1]}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Time Selection */}
            <div className="mb-8">
                <p className="text-sm font-bold text-brandBlack mb-3">Available Time</p>
                <div className="grid grid-cols-3 gap-2">
                    {['07:00 AM', '09:00 AM', '04:00 PM', '06:00 PM'].map(t => (
                        <button key={t} onClick={() => setSelectedTime(t)} className={`py-2 text-xs font-bold rounded-lg border transition ${selectedTime === t ? 'bg-brandBlack text-white border-brandBlack' : 'border-gray-200 text-gray-600 hover:border-brandBlack'}`}>
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            <button 
                onClick={handleBook} 
                disabled={!selectedDate || !selectedTime || status === 'sending'}
                className="w-full bg-brandOrange text-white py-4 rounded-xl font-bold text-sm hover:bg-orange-600 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {status === 'sending' ? 'Sending Request...' : 'Send Booking Request'}
            </button>
            <p className="text-center text-xs text-gray-400 mt-4 flex items-center justify-center gap-1">
                <Shield size={12}/> Secure payment via eSewa/Khalti
            </p>
        </div>
    );
};

export default ExploreView;