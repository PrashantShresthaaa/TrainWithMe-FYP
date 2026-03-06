import React, { useState } from 'react';
import { 
  Home, Calendar, MessageSquare, TrendingUp, Settings, LogOut, 
  Bell, Menu, ChevronDown, Compass, UserCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Imports
import DashboardHome from '../components/Dashboard/DashboardHome';
import ScheduleView from '../components/Dashboard/ScheduleView';
import MessagesView from '../components/Dashboard/MessagesView';
import ProgressView from '../components/Dashboard/ProgressView';
import SettingsView from '../components/Dashboard/SettingsView';
import ExploreView from '../components/Dashboard/ExploreView';
import MyTrainersView from '../components/Dashboard/MyTrainersView';

const UserDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedTrainer, setSelectedTrainer] = useState(null); // trainer to auto-open in messages
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getFirstName = (name) => {
    if (!name) return 'there';
    return name.split(' ')[0];
  };

  // Called from ExploreView Message button
  const openMessagesWithTrainer = (trainer) => {
    setSelectedTrainer(trainer);
    setActiveTab('messages');
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':   return <DashboardHome setActiveTab={setActiveTab} userName={getFirstName(user?.name)} />;
      case 'explore':     return <ExploreView setActiveTab={setActiveTab} openMessagesWithTrainer={openMessagesWithTrainer} />;
      case 'mytrainers':  return <MyTrainersView setActiveTab={setActiveTab} />;
      case 'schedule':    return <ScheduleView />;
      case 'messages':    return <MessagesView preselectedTrainer={selectedTrainer} />;
      case 'progress':    return <ProgressView />;
      case 'settings':    return <SettingsView />;
      default:            return <DashboardHome setActiveTab={setActiveTab} userName={getFirstName(user?.name)} />;
    }
  };

  // Header title map
  const pageTitles = {
    dashboard:  'Overview',
    explore:    'Find Trainers',
    mytrainers: 'My Trainers',
    schedule:   'Schedule',
    messages:   'Messages',
    progress:   'Progress',
    settings:   'Settings',
  };

  return (
    <div className="min-h-screen bg-[#F0F2F5] flex font-sans text-gray-900">

      {/* ── SIDEBAR ── */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#111111] text-[#9ca3af] transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 flex flex-col border-r border-[#333]`}>

        {/* Profile Header */}
        <div className="h-16 flex items-center px-5 border-b border-[#333] hover:bg-[#252525] cursor-pointer transition-colors">
          <div className="w-9 h-9 rounded-full bg-brandOrange flex items-center justify-center text-white font-bold text-sm mr-3 border border-orange-400 shrink-0">
            {getInitials(user?.name)}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-gray-200 font-bold text-sm truncate">{user?.name || 'Loading...'}</h3>
            <p className="text-xs text-gray-500 truncate capitalize">{user?.role || 'Member'}</p>
          </div>
          <ChevronDown size={16} className="text-gray-500"/>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-6">
          <div className="mb-8">
            <p className="px-5 text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Menu</p>
            <nav className="space-y-1 px-3">
              <NavItem icon={<Home size={18}/>}         label="Overview"      id="dashboard"   activeTab={activeTab} setActiveTab={setActiveTab} />
              <NavItem icon={<Compass size={18}/>}      label="Find Trainers" id="explore"      activeTab={activeTab} setActiveTab={setActiveTab} />
              <NavItem icon={<UserCheck size={18}/>}    label="My Trainers"   id="mytrainers"  activeTab={activeTab} setActiveTab={setActiveTab} />
              <NavItem icon={<Calendar size={18}/>}     label="Schedule"      id="schedule"    activeTab={activeTab} setActiveTab={setActiveTab} />
              <NavItem icon={<MessageSquare size={18}/>} label="Messages"     id="messages"    activeTab={activeTab} setActiveTab={setActiveTab} badge="2"/>
              <NavItem icon={<TrendingUp size={18}/>}   label="Progress"      id="progress"    activeTab={activeTab} setActiveTab={setActiveTab} />
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
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-400 hover:text-white hover:bg-[#252525] rounded-md w-full transition-colors"
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">

        {/* Header */}
        <header className="bg-white h-16 border-b border-gray-200 flex items-center justify-between px-8 shrink-0 z-10">
          <div className="flex items-center gap-4 w-1/2">
            <button className="md:hidden text-gray-600" onClick={() => setSidebarOpen(!isSidebarOpen)}>
              <Menu size={20}/>
            </button>
            <h2 className="text-xl font-bold text-gray-800 hidden md:block">
              {pageTitles[activeTab] || activeTab}
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
            <div className="w-8 h-8 bg-brandOrange text-white rounded-full flex items-center justify-center text-xs font-bold cursor-pointer border border-orange-300">
              {getInitials(user?.name)}
            </div>
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