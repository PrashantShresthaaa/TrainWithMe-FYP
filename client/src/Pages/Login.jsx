import React, { useState } from 'react';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext'; // ← ADD THIS

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth(); // ← ADD THIS

  const [formData, setFormData] = useState({ email: '', password: '' });
  const { email, password } = formData;
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onChange = (e) => {
    setFormData((prevState) => ({ ...prevState, [e.target.name]: e.target.value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields.');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/api/users/login', { email, password });

      if (response.data) {
        // ← CHANGED: use login() from context instead of raw localStorage.setItem
        // This saves to localStorage AND updates context state at the same time
        login(response.data);

        console.log('Login Successful:', response.data);

        if (response.data.role === 'trainer') {
          navigate('/trainer-dashboard');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Login failed. Please check your email and password.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 font-sans">
      <div className="max-w-4xl w-full bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col md:flex-row">

        {/* Left Side - Visual */}
        <div className="md:w-1/2 bg-brandBlack p-10 flex flex-col justify-between text-white relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-brandOrange/10 z-0"></div>
          <div className="relative z-10">
            <h1 className="text-3xl font-bold mb-2">Train<span className="text-brandOrange">With</span>Me</h1>
            <p className="text-gray-400 text-sm">Welcome back to your fitness journey.</p>
          </div>
          <div className="relative z-10">
            <h2 className="text-4xl font-bold leading-tight mb-4">
              Focus on your goals, <br/><span className="text-brandOrange">we handle the rest.</span>
            </h2>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="md:w-1/2 p-10 flex flex-col justify-center">
          <h2 className="text-2xl font-bold text-brandBlack mb-6">Login to Account</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg font-medium">
              {error}
            </div>
          )}

          <form className="space-y-5" onSubmit={onSubmit}>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type="email" name="email" value={email} onChange={onChange}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-100 rounded-xl outline-none focus:border-brandOrange focus:bg-orange-50 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type="password" name="password" value={password} onChange={onChange}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-100 rounded-xl outline-none focus:border-brandOrange focus:bg-orange-50 transition"
                />
              </div>
              <div className="flex justify-end mt-2">
                <a href="#" className="text-xs font-bold text-brandOrange hover:underline">Forgot Password?</a>
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full bg-brandBlack text-white font-bold py-4 rounded-xl hover:bg-gray-800 transition flex items-center justify-center gap-2"
            >
              {loading ? 'Verifying...' : 'Login Now'} <ArrowRight size={20}/>
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-8">
            Don't have an account?
            <span onClick={() => navigate('/signup')} className="text-brandOrange font-bold cursor-pointer hover:underline ml-1">Sign Up</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;