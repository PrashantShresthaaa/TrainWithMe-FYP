import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './Pages/LandingPage';
import Onboarding from './Pages/Onboarding';
import TrainerDetails from './Pages/TrainerDetails';
import UserDashboard from './Pages/UserDashboard';
import CallPage from './Pages/CallPage';
import Login from './Pages/Login';
import Signup from './Pages/Signup';
import TrainerDashboard from './Pages/TrainerDashboard';
import KhaltiCallback from './Pages/KhaltiCallback';
import AdminDashboard from './Pages/AdminDashboard';
import TrainerVerification from './Pages/TrainerVerification';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/get-started" element={<Onboarding />} />
        <Route path="/trainer/:id" element={<TrainerDetails />} />
        <Route path="/dashboard" element={<UserDashboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/trainer-dashboard" element={<TrainerDashboard />} />
        <Route path="/trainer-verification" element={<TrainerVerification />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/call" element={<CallPage />} />
        <Route path="/payment/khalti/callback" element={<KhaltiCallback />} />
      </Routes>
    </Router>
  );
};

export default App;
