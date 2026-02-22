import React, { useState } from 'react';
import { ArrowRight, ArrowLeft, Check, Dumbbell, Heart, Video, MapPin, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Onboarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [preferences, setPreferences] = useState({
    goal: '',
    category: '',
    type: '',
    gender: '',
  });

  const totalSteps = 4;

  const handleSelect = (key, value) => {
    setPreferences({ ...preferences, [key]: value });
  };

  const nextStep = () => {
    if (step < totalSteps + 1) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  // --- Mock Recommended Trainers Data ---
  const recommendedTrainers = [
    {
      id: 1,
      name: "Sita Gurung",
      specialty: "Yoga & Pilates",
      match: "98%",
      image: "https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=800&auto=format&fit=crop",
      price: "Rs. 1500/session"
    },
    {
      id: 2,
      name: "Ravi Thapa",
      specialty: "Yoga Specialist",
      match: "85%",
      image: "https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?q=80&w=800&auto=format&fit=crop",
      price: "Rs. 1200/session"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-6 text-brandGray font-sans">
      
      {/* Progress Bar */}
      {step <= totalSteps && (
        <div className="w-full max-w-xl mb-8">
          <div className="flex justify-between text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">
            <span>Start</span>
            <span>Preferences</span>
            <span>Finish</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-brandOrange transition-all duration-500 ease-out" 
              style={{ width: `${(step / totalSteps) * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* --- STEP 1: GOAL --- */}
      {step === 1 && (
        <div className="w-full max-w-2xl bg-white p-8 md:p-12 rounded-2xl shadow-xl animate-fadeIn">
          <h2 className="text-3xl font-bold text-brandBlack mb-2">What is your primary goal?</h2>
          <p className="text-gray-500 mb-8">We'll find trainers who specialize in your specific needs.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {['Weight Loss', 'Build Muscle', 'Flexibility & Balance', 'Learn a Skill (Martial Arts/Dance)'].map((option) => (
              <button 
                key={option}
                onClick={() => handleSelect('goal', option)}
                className={`p-6 border-2 rounded-xl text-left transition-all flex items-center justify-between group
                  ${preferences.goal === option ? 'border-brandOrange bg-orange-50' : 'border-gray-100 hover:border-orange-200'}`}
              >
                <span className={`font-bold ${preferences.goal === option ? 'text-brandOrange' : 'text-gray-700'}`}>{option}</span>
                {preferences.goal === option && <Check className="text-brandOrange" size={20}/>}
              </button>
            ))}
          </div>
          <div className="flex justify-end">
            <button onClick={nextStep} disabled={!preferences.goal} className="bg-brandBlack text-white px-8 py-3 rounded-lg font-bold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
              Next Step <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* --- STEP 2: CATEGORY --- */}
      {step === 2 && (
        <div className="w-full max-w-2xl bg-white p-8 md:p-12 rounded-2xl shadow-xl animate-fadeIn">
          <h2 className="text-3xl font-bold text-brandBlack mb-2">Which discipline interests you?</h2>
          <p className="text-gray-500 mb-8">Select the type of training you are looking for.</p>
          
          <div className="grid grid-cols-2 gap-4 mb-8">
            {[
              { name: 'Gym / Fitness', icon: <Dumbbell /> },
              { name: 'Yoga', icon: <Heart /> },
              { name: 'Martial Arts', icon: <Users /> },
              { name: 'Dance', icon: <Users /> }
            ].map((item) => (
              <button 
                key={item.name}
                onClick={() => handleSelect('category', item.name)}
                className={`p-6 border-2 rounded-xl flex flex-col items-center justify-center gap-3 transition-all
                  ${preferences.category === item.name ? 'border-brandOrange bg-orange-50' : 'border-gray-100 hover:border-orange-200'}`}
              >
                <div className={`${preferences.category === item.name ? 'text-brandOrange' : 'text-gray-400'}`}>
                  {item.icon}
                </div>
                <span className={`font-bold ${preferences.category === item.name ? 'text-brandOrange' : 'text-gray-700'}`}>{item.name}</span>
              </button>
            ))}
          </div>
          <div className="flex justify-between">
            <button onClick={prevStep} className="text-gray-500 font-bold hover:text-black">Back</button>
            <button onClick={nextStep} disabled={!preferences.category} className="bg-brandBlack text-white px-8 py-3 rounded-lg font-bold hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2">
              Next Step <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* --- STEP 3: PREFERENCES (Online/Gender) --- */}
      {step === 3 && (
        <div className="w-full max-w-2xl bg-white p-8 md:p-12 rounded-2xl shadow-xl animate-fadeIn">
          <h2 className="text-3xl font-bold text-brandBlack mb-2">Final Details</h2>
          <p className="text-gray-500 mb-8">Help us narrow down the perfect match.</p>
          
          <div className="space-y-6 mb-8">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">Training Mode</label>
              <div className="grid grid-cols-2 gap-4">
                {['In-Person', 'Online (Video Call)'].map((opt) => (
                   <button key={opt} onClick={() => handleSelect('type', opt)} className={`p-4 border-2 rounded-lg font-bold text-sm ${preferences.type === opt ? 'border-brandOrange text-brandOrange bg-orange-50' : 'border-gray-200 text-gray-600'}`}>
                     {opt}
                   </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">Trainer Gender Preference</label>
              <div className="grid grid-cols-3 gap-4">
                {['No Preference', 'Male', 'Female'].map((opt) => (
                   <button key={opt} onClick={() => handleSelect('gender', opt)} className={`p-4 border-2 rounded-lg font-bold text-sm ${preferences.gender === opt ? 'border-brandOrange text-brandOrange bg-orange-50' : 'border-gray-200 text-gray-600'}`}>
                     {opt}
                   </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <button onClick={prevStep} className="text-gray-500 font-bold hover:text-black">Back</button>
            <button onClick={nextStep} disabled={!preferences.type || !preferences.gender} className="bg-brandOrange text-white px-8 py-3 rounded-lg font-bold hover:bg-orange-600 disabled:opacity-50 flex items-center gap-2">
              See My Matches <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* --- STEP 4: RESULTS (The "Marketplace" view) --- */}
      {(step === 5 || step > totalSteps - 1) && (
        <div className="w-full max-w-5xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-brandBlack mb-2">We found the perfect trainers for you!</h2>
            <p className="text-gray-600">Based on your goal to <span className="font-bold text-brandOrange">{preferences.goal}</span> in <span className="font-bold text-brandOrange">{preferences.category}</span>.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {recommendedTrainers.map((trainer) => (
              <div key={trainer.id} className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 flex flex-col md:flex-row gap-6 hover:shadow-xl transition">
                <img src={trainer.image} alt={trainer.name} className="w-full md:w-40 h-40 object-cover rounded-xl" />
                
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-xl font-bold text-brandBlack">{trainer.name}</h3>
                        <p className="text-sm text-gray-500">{trainer.specialty}</p>
                      </div>
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
                        {trainer.match} Match
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                       <span className="flex items-center gap-1"><MapPin size={14}/> Kathmandu</span>
                       <span className="flex items-center gap-1"><Video size={14}/> {preferences.type}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4 border-t pt-4 border-gray-100">
                    <span className="font-bold text-brandBlack">{trainer.price}</span>
                    <button 
                      onClick={() => navigate(`/trainer/${trainer.id}`)}
                      className="bg-brandBlack text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-brandOrange transition">
                      Book Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-8 text-center flex flex-col gap-2">
             <button onClick={() => navigate('/dashboard')} className="text-brandOrange font-bold text-sm">
               Go to Dashboard (Skip)
             </button>
             <button onClick={() => setStep(1)} className="text-gray-500 underline text-xs">Start Over</button>
          </div>
        </div>
      )}

    </div>
  );
};

export default Onboarding;