import React, { useState } from 'react';
import { 
  Home, Calendar, MessageSquare, TrendingUp, Settings, LogOut, 
  Bell, Search, Menu, ChevronDown, Compass 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Imports
import DashboardHome from '../components/Dashboard/DashboardHome';
import ScheduleView from '../components/Dashboard/ScheduleView';
import MessagesView from '../components/Dashboard/MessagesView';
import ProgressView from '../components/Dashboard/ProgressView';
import SettingsView from '../components/Dashboard/SettingsView';
import ExploreView from '../components/Dashboard/ExploreView';

const UserDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  // Switcher Logic
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardHome setActiveTab={setActiveTab} />;
      case 'explore': return <ExploreView setActiveTab={setActiveTab} />; 
      case 'schedule': return <ScheduleView />;
      case 'messages': return <MessagesView />;
      case 'progress': return <ProgressView />;
      case 'settings': return <SettingsView />;
      default: return <DashboardHome setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F2F5] flex font-sans text-gray-900">
      
      {/* --- SIDEBAR (Restored Dark Professional Design) --- */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#111111] text-[#9ca3af] transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 flex flex-col border-r border-[#333]`}>
        
        {/* Brand/Profile Header */}
        <div className="h-16 flex items-center px-5 border-b border-[#333] hover:bg-[#252525] cursor-pointer transition-colors">
          <div className="w-9 h-9 rounded-full bg-gray-700 overflow-hidden border border-gray-600 mr-3">
             <img src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=200" alt="Profile" className="w-full h-full object-cover"/>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-gray-200 font-bold text-sm truncate">Anish K.</h3>
            <p className="text-xs text-gray-500 truncate">Premium Member</p>
          </div>
          <ChevronDown size={16} className="text-gray-500"/>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-6">
          <div className="mb-8">
            <p className="px-5 text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Menu</p>
            <nav className="space-y-1 px-3">
              <NavItem icon={<Home size={18}/>} label="Overview" id="dashboard" activeTab={activeTab} setActiveTab={setActiveTab} />
              
              {/* Find Trainers Tab */}
              <NavItem icon={<Compass size={18}/>} label="Find Trainers" id="explore" activeTab={activeTab} setActiveTab={setActiveTab} />
              
              <NavItem icon={<Calendar size={18}/>} label="Schedule" id="schedule" activeTab={activeTab} setActiveTab={setActiveTab} />
              <NavItem icon={<MessageSquare size={18}/>} label="Messages" id="messages" activeTab={activeTab} setActiveTab={setActiveTab} badge="2"/>
              <NavItem icon={<TrendingUp size={18}/>} label="Progress" id="progress" activeTab={activeTab} setActiveTab={setActiveTab} />
            </nav>
          </div>

          <div className="mb-8">
            <p className="px-5 text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Account</p>
            <nav className="space-y-1 px-3">
              <NavItem icon={<Settings size={18}/>} label="Settings" id="settings" activeTab={activeTab} setActiveTab={setActiveTab} />
            </nav>
          </div>
        </div>

        <div className="p-4 border-t border-[#333]">
          <button onClick={() => navigate('/')} className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-400 hover:text-white hover:bg-[#252525] rounded-md w-full transition-colors">
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Header */}
        <header className="bg-white h-16 border-b border-gray-200 flex items-center justify-between px-8 shrink-0 z-10">
          <div className="flex items-center gap-4 w-1/2">
            <button className="md:hidden text-gray-600" onClick={() => setSidebarOpen(!isSidebarOpen)}><Menu size={20}/></button>
            
            {/* Page Title */}
            <h2 className="text-xl font-bold text-gray-800 capitalize hidden md:block">
                {activeTab === 'explore' ? 'Find Trainers' : activeTab}
            </h2>
          </div>

          <div className="flex items-center gap-5">
            <button 
                onClick={() => setActiveTab('explore')}
                className="bg-brandOrange text-white px-4 py-1.5 rounded-md text-xs font-bold hover:bg-orange-600 transition shadow-sm hidden sm:block"
            >
                + Book Session
            </button>
            <div className="h-6 w-px bg-gray-200"></div>
            <button className="text-gray-500 hover:text-gray-800"><Bell size={20} /></button>
            <div className="w-8 h-8 bg-gray-800 text-white rounded-full flex items-center justify-center text-xs font-bold cursor-pointer border border-gray-300">AK</div>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto bg-[#F7F9FC] p-8">
          <div className="max-w-[1600px] mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

// Nav Item Helper (Restored Professional Style)
const NavItem = ({ icon, label, id, activeTab, setActiveTab, badge }) => (
  <button 
    onClick={() => setActiveTab(id)}
    className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-all ${
      activeTab === id 
      ? 'bg-brandOrange text-white shadow-md font-bold' 
      : 'text-gray-400 hover:text-white hover:bg-[#252525]'
    }`}
  >
    <div className="flex items-center gap-3">{icon} <span>{label}</span></div>
    {badge && <span className="bg-white text-brandOrange text-[10px] font-bold px-1.5 py-0.5 rounded-full">{badge}</span>}
  </button>
);

export default UserDashboard;