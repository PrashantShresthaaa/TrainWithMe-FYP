import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './Pages/LandingPage';
import Onboarding from './Pages/Onboarding';
import TrainerDetails from './Pages/TrainerDetails';
import UserDashboard from './Pages/UserDashboard';
import CallPage from './Pages/CallPage';
// Import new pages
import Login from './Pages/Login';
import Signup from './Pages/Signup';
import TrainerDashboard from './Pages/TrainerDashboard'; // Add import


const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/get-started" element={<Onboarding />} />
        <Route path="/trainer/:id" element={<TrainerDetails />} />
        <Route path="/dashboard" element={<UserDashboard />} />
        {/* New Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/trainer-dashboard" element={<TrainerDashboard />} />
        <Route path="/call" element={<CallPage />} />
      </Routes>
    </Router>
  );
};

export default App;