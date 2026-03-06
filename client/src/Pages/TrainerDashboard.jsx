import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, MessageSquare, Users, Wallet, 
  Settings, LogOut, Bell, Search, Menu, Calendar, 
  Megaphone, Folder, ChevronDown, Inbox
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// IMPORTS - Sub Components
import TrainerHome from '../components/TrainerDashboard/TrainerHome';
import TrainerSchedule from '../components/TrainerDashboard/TrainerSchedule';
import TrainerClients from '../components/TrainerDashboard/TrainerClients';
import TrainerWallet from '../components/TrainerDashboard/TrainerWallet';
import TrainerSettings from '../components/TrainerDashboard/TrainerSettings';
import TrainerBookingInbox from '../components/TrainerDashboard/TrainerBookingInbox';
import MessagesView from '../components/Dashboard/MessagesView'; // ← shared component

const TrainerDashboard = () => {
  const navigate = useNavigate();
  const { user, logout, getToken } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Fetch pending bookings count
  useEffect(() => {
    const fetchPendingCount = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/bookings', {
          headers: { 'Authorization': `Bearer ${getToken()}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        setPendingCount(data.filter(b => b.status === 'pending').length);
      } catch {}
    };
    fetchPendingCount();
  }, [activeTab]);

  // Fetch unread message count
  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/messages/conversations', {
          headers: { 'Authorization': `Bearer ${getToken()}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        const total = data.reduce((sum, c) => sum + (c.unread || 0), 0);
        setUnreadMessages(total);
      } catch {}
    };
    fetchUnread();
    // Poll unread count every 10s when not on messages tab
    const interval = activeTab !== 'messages' ? setInterval(fetchUnread, 10000) : null;
    return () => clearInterval(interval);
  }, [activeTab]);

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':  return <TrainerHome />;
      case 'requests':  return <TrainerBookingInbox />;
      case 'schedule':  return <TrainerSchedule />;
      case 'clients':   return <TrainerClients />;
      case 'payments':  return <TrainerWallet />;
      case 'messages':  return <MessagesView />;
      case 'settings':  return <TrainerSettings />;
      default:          return <TrainerHome />;
    }
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
            <h3 className="text-gray-200 font-bold text-sm truncate">{user?.name || 'Trainer'}</h3>
            <p className="text-xs text-gray-500 truncate">Professional Account</p>
          </div>
          <ChevronDown size={16} className="text-gray-500"/>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-6">
          <div className="mb-8">
            <p className="px-5 text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Main Menu</p>
            <nav className="space-y-1 px-3">
              <NavItem icon={<LayoutDashboard size={18}/>} label="Overview"  id="overview"  activeTab={activeTab} setActiveTab={setActiveTab} />
              <NavItem 
                icon={<Inbox size={18}/>} 
                label="Requests" 
                id="requests"  
                activeTab={activeTab} 
                setActiveTab={setActiveTab}
                badge={pendingCount > 0 ? String(pendingCount) : null}
              />
              <NavItem
                icon={<MessageSquare size={18}/>}
                label="Messages"
                id="messages"
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                badge={unreadMessages > 0 ? String(unreadMessages) : null}
              />
              <NavItem icon={<Users size={18}/>}         label="Clients"   id="clients"   activeTab={activeTab} setActiveTab={setActiveTab} />
              <NavItem icon={<Wallet size={18}/>}        label="Payments"  id="payments"  activeTab={activeTab} setActiveTab={setActiveTab} />
            </nav>
          </div>

          <div className="mb-8">
            <p className="px-5 text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Management</p>
            <nav className="space-y-1 px-3">
              <NavItem icon={<Calendar size={18}/>}  label="Schedule"  id="schedule"  activeTab={activeTab} setActiveTab={setActiveTab} />
              <NavItem icon={<Folder size={18}/>}    label="Libraries" id="libraries" activeTab={activeTab} setActiveTab={setActiveTab} />
              <NavItem icon={<Megaphone size={18}/>} label="Marketing" id="marketing" activeTab={activeTab} setActiveTab={setActiveTab} />
            </nav>
          </div>

          <div className="mb-8">
            <p className="px-5 text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">System</p>
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

        <header className="bg-white h-16 border-b border-gray-200 flex items-center justify-between px-8 shrink-0 z-10">
          <div className="flex items-center gap-4 w-1/2">
            <button className="md:hidden text-gray-600" onClick={() => setSidebarOpen(!isSidebarOpen)}>
              <Menu size={20}/>
            </button>
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search clients..."
                className="w-full bg-gray-100 text-gray-800 pl-10 pr-4 py-2 rounded-md text-sm focus:ring-1 focus:ring-brandOrange outline-none border-none placeholder-gray-500 transition"
              />
            </div>
          </div>

          <div className="flex items-center gap-5">
            <button className="w-8 h-8 flex items-center justify-center bg-brandOrange text-white rounded-md text-lg font-medium hover:bg-orange-600 transition shadow-sm pb-1">+</button>
            <div className="h-6 w-px bg-gray-200"></div>
            <button className="text-gray-500 hover:text-gray-800 relative">
              <Bell size={20} />
              {unreadMessages > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-brandOrange text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {unreadMessages}
                </span>
              )}
            </button>
            <div className="w-8 h-8 bg-brandOrange text-white rounded-full flex items-center justify-center text-xs font-bold cursor-pointer border border-orange-300">
              {getInitials(user?.name)}
            </div>
          </div>
        </header>

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
        : 'hover:text-white hover:bg-[#252525]'
    }`}
  >
    <div className="flex items-center gap-3">{icon} <span>{label}</span></div>
    {badge && <span className="bg-white text-brandOrange text-[10px] font-bold px-1.5 py-0.5 rounded-full">{badge}</span>}
  </button>
);

export default TrainerDashboard;