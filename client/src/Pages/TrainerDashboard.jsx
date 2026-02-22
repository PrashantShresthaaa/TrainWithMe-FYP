import React, { useState } from 'react';
import { 
  LayoutDashboard, MessageSquare, Users, Wallet, 
  Settings, LogOut, Bell, Search, Menu, Calendar, 
  Megaphone, Folder, ChevronDown 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// IMPORTS
import TrainerHome from '../components/TrainerDashboard/TrainerHome';
import TrainerSchedule from '../components/TrainerDashboard/TrainerSchedule';
import TrainerClients from '../components/TrainerDashboard/TrainerClients';
import TrainerWallet from '../components/TrainerDashboard/TrainerWallet';

const TrainerDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case 'overview': return <TrainerHome />;
      case 'schedule': return <TrainerSchedule />;
      case 'clients': return <TrainerClients />;
      case 'payments': return <TrainerWallet />;
      default: return <TrainerHome />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F2F5] flex font-sans text-gray-900">
      
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#111111] text-[#9ca3af] transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 flex flex-col border-r border-[#333]`}>
        
        {/* Profile Header */}
        <div className="h-16 flex items-center px-5 border-b border-[#333] hover:bg-[#252525] cursor-pointer transition-colors">
          <div className="w-9 h-9 rounded-full bg-gray-700 overflow-hidden border border-gray-600 mr-3">
             <img src="https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=200" alt="Profile" className="w-full h-full object-cover"/>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-gray-200 font-bold text-sm truncate">Sita Gurung</h3>
            <p className="text-xs text-gray-500 truncate">Professional Account</p>
          </div>
          <ChevronDown size={16} className="text-gray-500"/>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-6">
          <div className="mb-8">
            <p className="px-5 text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Main Menu</p>
            <nav className="space-y-1 px-3">
              <NavItem icon={<LayoutDashboard size={18}/>} label="Overview" id="overview" activeTab={activeTab} setActiveTab={setActiveTab} />
              <NavItem icon={<MessageSquare size={18}/>} label="Messages" id="messages" activeTab={activeTab} setActiveTab={setActiveTab} badge="3" />
              <NavItem icon={<Users size={18}/>} label="Clients" id="clients" activeTab={activeTab} setActiveTab={setActiveTab} />
              <NavItem icon={<Wallet size={18}/>} label="Payments" id="payments" activeTab={activeTab} setActiveTab={setActiveTab} />
            </nav>
          </div>

          <div className="mb-8">
            <p className="px-5 text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Management</p>
            <nav className="space-y-1 px-3">
              <NavItem icon={<Calendar size={18}/>} label="Schedule" id="schedule" activeTab={activeTab} setActiveTab={setActiveTab} />
              <NavItem icon={<Folder size={18}/>} label="Libraries" id="libraries" activeTab={activeTab} setActiveTab={setActiveTab} />
              <NavItem icon={<Megaphone size={18}/>} label="Marketing" id="marketing" activeTab={activeTab} setActiveTab={setActiveTab} />
            </nav>
          </div>
        </div>

        <div className="p-4 border-t border-[#333]">
          <button onClick={() => navigate('/')} className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-400 hover:text-white hover:bg-[#252525] rounded-md w-full transition-colors">
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white h-16 border-b border-gray-200 flex items-center justify-between px-8 shrink-0 z-10">
          <div className="flex items-center gap-4 w-1/2">
            <button className="md:hidden text-gray-600" onClick={() => setSidebarOpen(!isSidebarOpen)}><Menu size={20}/></button>
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
            {/* BRAND ORANGE PLUS BUTTON */}
            <button className="w-8 h-8 flex items-center justify-center bg-brandOrange text-white rounded-md text-lg font-medium hover:bg-orange-600 transition shadow-sm pb-1">+</button>
            <div className="h-6 w-px bg-gray-200"></div>
            <button className="text-gray-500 hover:text-gray-800"><Bell size={20} /></button>
            <div className="w-8 h-8 bg-brandBlack text-white rounded-full flex items-center justify-center text-xs font-bold cursor-pointer border border-gray-300">SG</div>
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

// BRAND ORANGE ACTIVE STATE
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