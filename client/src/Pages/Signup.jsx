import React, { useState } from 'react';
import { Mail, Lock, User, ArrowRight, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; // We need this to make API calls

// You will need to install axios if you haven't already!

const Signup = () => {
  const navigate = useNavigate();
  
  // State to hold form data
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'client', // Default role
  });

  const { name, email, password, role } = formData;
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Function to update state on input change
  const onChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };

  // Function to handle form submission
  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // **IMPORTANT: The API URL is your backend server's address!**
    const API_URL = 'http://localhost:5000/api/users';

    try {
      // Send data to the backend
      const response = await axios.post(API_URL, {
        name,
        email,
        password,
        role,
      });

      if (response.data) {
        console.log('Registration Successful!', response.data);
        
        // --- NEW LOGIC: Redirect based on Role ---
        if (role === 'trainer') {
            navigate('/trainer-dashboard'); // Trainers go here
        } else {
            navigate('/get-started'); // Clients go to Quiz
        }
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Registration failed. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
        
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-brandBlack mb-2">Create Account</h1>
          <p className="text-gray-500 text-sm">Join TrainWithMe today.</p>
          {error && <p className="text-red-500 text-sm mt-3 font-medium border border-red-200 p-2 rounded-lg">{error}</p>}
        </div>

        {/* Role Toggle */}
        <div className="bg-gray-100 p-1 rounded-xl flex mb-8">
          <button 
            onClick={() => setFormData({ ...formData, role: 'client' })}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${role === 'client' ? 'bg-white text-brandBlack shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Join as Client
          </button>
          <button 
            onClick={() => setFormData({ ...formData, role: 'trainer' })}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${role === 'trainer' ? 'bg-brandOrange text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Join as Trainer
          </button>
        </div>

        <form className="space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-3 text-gray-400" size={18} />
              <input type="text" name="name" value={name} onChange={onChange} required className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg outline-none focus:border-brandOrange" placeholder="John Doe" />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
              <input type="email" name="email" value={email} onChange={onChange} required className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg outline-none focus:border-brandOrange" placeholder="john@example.com" />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
              <input type="password" name="password" value={password} onChange={onChange} required className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg outline-none focus:border-brandOrange" placeholder="••••••••" />
            </div>
          </div>

          {role === 'trainer' && (
            <div className="bg-orange-50 p-3 rounded-lg flex gap-3 items-start">
              <CheckCircle className="text-brandOrange mt-0.5" size={16} />
              <p className="text-xs text-gray-600 leading-snug">
                As a trainer, you will need to upload verification documents in the next step.
              </p>
            </div>
          )}

          <button type="submit" disabled={loading} className="w-full bg-brandBlack text-white font-bold py-3 rounded-xl hover:bg-gray-800 transition mt-4 flex items-center justify-center gap-2">
            {loading ? 'Registering...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account? 
          <span onClick={() => navigate('/login')} className="text-brandOrange font-bold cursor-pointer hover:underline ml-1">Login</span>
        </p>
      </div>
    </div>
  );
};

export default Signup;