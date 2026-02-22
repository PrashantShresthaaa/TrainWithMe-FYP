import React from 'react';
import { Star, MapPin, Award, Clock, Calendar, ShieldCheck, ArrowLeft, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TrainerDetails = () => {
  const navigate = useNavigate();

  // Mock Data (Later this comes from Backend)
  const trainer = {
    name: "Sita Gurung",
    specialty: "Yoga & Pilates Specialist",
    rating: 4.9,
    reviews: 124,
    location: "Kathmandu",
    bio: "Certified Yoga Alliance instructor with 8 years of experience. I specialize in Hatha and Vinyasa flow, helping clients improve flexibility, reduce stress, and find mental clarity. My sessions are tailored to your pace and goals.",
    experience: "8 Years",
    certifications: ["RYT-200 Yoga Alliance", "Pilates Level 1", "Reiki Practitioner"],
    price: "Rs. 1,500",
    image: "https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=800&auto=format&fit=crop",
    tags: ["Weight Loss", "Flexibility", "Mindfulness"]
  };

  return (
    <div className="min-h-screen bg-white font-sans text-brandGray pb-20">
      
      {/* --- Header / Navigation --- */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition">
          <ArrowLeft size={24} className="text-brandBlack"/>
        </button>
        <span className="font-bold text-lg">Trainer Profile</span>
      </div>

      <div className="max-w-4xl mx-auto">
        
        {/* --- Hero Section --- */}
        <div className="relative h-[400px] md:h-[500px]">
          <img src={trainer.image} alt={trainer.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
          
          <div className="absolute bottom-0 left-0 w-full p-6 md:p-10 text-white">
            <div className="flex gap-2 mb-3">
              <span className="bg-brandOrange text-white px-3 py-1 rounded text-xs font-bold uppercase">Verified Trainer</span>
              <div className="flex items-center gap-1 bg-black/50 px-3 py-1 rounded backdrop-blur-sm">
                <Star size={14} className="text-brandOrange" fill="#FF6700"/>
                <span className="text-xs font-bold">{trainer.rating} ({trainer.reviews} Reviews)</span>
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-2">{trainer.name}</h1>
            <p className="text-gray-200 text-lg flex items-center gap-2">
              <MapPin size={18} /> {trainer.location} • {trainer.specialty}
            </p>
          </div>
        </div>

        <div className="px-6 py-10 grid md:grid-cols-3 gap-10">
          
          {/* --- Left Column: Details --- */}
          <div className="md:col-span-2 space-y-10">
            
            {/* About */}
            <section>
              <h2 className="text-2xl font-bold text-brandBlack mb-4">About Me</h2>
              <p className="text-gray-600 leading-relaxed text-lg">{trainer.bio}</p>
              
              <div className="flex gap-4 mt-6">
                <div className="bg-gray-50 p-4 rounded-xl flex items-center gap-3 border border-gray-100">
                  <div className="bg-orange-100 p-2 rounded-full text-brandOrange"><Award size={24}/></div>
                  <div>
                    <p className="text-xs text-gray-500 font-bold uppercase">Experience</p>
                    <p className="font-bold text-brandBlack">{trainer.experience}</p>
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl flex items-center gap-3 border border-gray-100">
                  <div className="bg-orange-100 p-2 rounded-full text-brandOrange"><ShieldCheck size={24}/></div>
                  <div>
                    <p className="text-xs text-gray-500 font-bold uppercase">Certifications</p>
                    <p className="font-bold text-brandBlack">{trainer.certifications.length} Verified</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Specialties */}
            <section>
              <h2 className="text-2xl font-bold text-brandBlack mb-4">What I Teach</h2>
              <div className="flex flex-wrap gap-3">
                {trainer.tags.map(tag => (
                  <span key={tag} className="px-4 py-2 bg-gray-100 rounded-lg text-gray-700 font-medium hover:bg-gray-200 transition">
                    {tag}
                  </span>
                ))}
              </div>
            </section>

            {/* Certifications List */}
            <section>
              <h2 className="text-2xl font-bold text-brandBlack mb-4">Credentials</h2>
              <ul className="space-y-3">
                {trainer.certifications.map((cert, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-gray-700">
                    <CheckCircle className="text-green-500" size={20} />
                    {cert}
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {/* --- Right Column: Booking Card --- */}
          <div className="md:col-span-1">
            <div className="sticky top-24 bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
              <div className="flex justify-between items-end mb-6">
                <div>
                  <p className="text-gray-500 text-sm">Price per session</p>
                  <p className="text-3xl font-bold text-brandBlack">{trainer.price}</p>
                </div>
                <div className="text-brandOrange font-bold text-sm bg-orange-50 px-2 py-1 rounded">
                  Available Today
                </div>
              </div>

              {/* Date Picker Placeholder */}
              <div className="mb-6">
                <label className="text-sm font-bold text-brandBlack mb-2 block">Select Date</label>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {['Mon 18', 'Tue 19', 'Wed 20', 'Thu 21'].map((date, i) => (
                    <button key={date} className={`min-w-[70px] p-3 rounded-lg border-2 flex flex-col items-center text-sm font-bold transition
                      ${i === 0 ? 'border-brandOrange bg-orange-50 text-brandOrange' : 'border-gray-100 text-gray-400 hover:border-gray-300'}`}>
                      <span>{date.split(' ')[0]}</span>
                      <span className="text-lg">{date.split(' ')[1]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Slots Placeholder */}
              <div className="mb-8">
                <label className="text-sm font-bold text-brandBlack mb-2 block">Select Time</label>
                <div className="grid grid-cols-2 gap-2">
                  {['07:00 AM', '09:00 AM', '04:00 PM', '06:00 PM'].map((time, i) => (
                    <button key={time} className={`py-2 rounded border text-sm font-medium transition
                      ${i === 2 ? 'bg-brandBlack text-white border-brandBlack' : 'border-gray-200 hover:border-brandBlack text-gray-700'}`}>
                      {time}
                    </button>
                  ))}
                </div>
              </div>

              <button 
               onClick={() => navigate('/dashboard')}
               className="w-full bg-brandOrange text-white font-bold py-4 rounded-xl hover:bg-orange-600 transition shadow-lg flex justify-center items-center gap-2">
                Book Session <Calendar size={18} />
              </button>
              
              <p className="text-center text-xs text-gray-400 mt-4">
                Free cancellation up to 24 hours before.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default TrainerDetails;