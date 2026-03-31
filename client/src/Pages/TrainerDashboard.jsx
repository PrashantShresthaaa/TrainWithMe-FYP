import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  Wallet,
  Settings,
  LogOut,
  Search,
  Menu,
  Calendar,
  Megaphone,
  Folder,
  ChevronDown,
  Inbox,
  ShieldAlert,
  Clock3,
  BadgeCheck,
  Loader,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

import TrainerHome from '../components/TrainerDashboard/TrainerHome';
import TrainerSchedule from '../components/TrainerDashboard/TrainerSchedule';
import TrainerClients from '../components/TrainerDashboard/TrainerClients';
import TrainerWallet from '../components/TrainerDashboard/TrainerWallet';
import TrainerSettings from '../components/TrainerDashboard/TrainerSettings';
import TrainerBookingInbox from '../components/TrainerDashboard/TrainerBookingInbox';
import MessagesView from '../components/Dashboard/MessagesView';
import NotificationBell from '../components/Shared/NotificationBell';
import TrainerVerificationGate from '../components/TrainerDashboard/TrainerVerificationGate';

const API = 'http://localhost:5000';

const TrainerDashboard = () => {
  const navigate = useNavigate();
  const { user, logout, getToken } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [trainerProfile, setTrainerProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  useEffect(() => {
    const loadTrainerProfile = async () => {
      if (!user || user.role !== 'trainer') return;

      try {
        const res = await fetch(`${API}/api/trainers/me`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });

        if (!res.ok) {
          throw new Error('Failed to load trainer profile');
        }

        const data = await res.json();
        setTrainerProfile(data);
      } catch {
        setTrainerProfile(null);
      } finally {
        setProfileLoading(false);
      }
    };

    loadTrainerProfile();
  }, [user?._id]);

  const verificationStatus = trainerProfile?.verificationStatus || 'not_submitted';
  const isTrainerApproved =
    trainerProfile?.isVerified && trainerProfile?.verificationStatus === 'approved';

  useEffect(() => {
    const fetchPendingCount = async () => {
      if (!isTrainerApproved) {
        setPendingCount(0);
        return;
      }

      try {
        const res = await fetch(`${API}/api/bookings`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        setPendingCount(data.filter((b) => b.status === 'pending').length);
      } catch {}
    };
    fetchPendingCount();
  }, [activeTab, isTrainerApproved]);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await fetch(`${API}/api/messages/conversations`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        const total = data.reduce((sum, conversation) => sum + (conversation.unread || 0), 0);
        setUnreadMessages(total);
      } catch {}
    };
    fetchUnread();
    const interval = activeTab !== 'messages' ? setInterval(fetchUnread, 10000) : null;
    return () => clearInterval(interval);
  }, [activeTab]);

  const openVerificationPage = () => navigate('/trainer-verification');

  const renderContent = () => {
    if (profileLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-3 text-gray-500">
            <Loader size={18} className="animate-spin text-brandOrange" />
            <span className="font-semibold text-sm">Loading trainer workspace...</span>
          </div>
        </div>
      );
    }

    if (!isTrainerApproved && activeTab !== 'settings') {
      return (
        <TrainerVerificationGate
          profile={trainerProfile}
          onOpenVerification={openVerificationPage}
        />
      );
    }

    switch (activeTab) {
      case 'overview':
        return <TrainerHome />;
      case 'requests':
        return <TrainerBookingInbox />;
      case 'schedule':
        return <TrainerSchedule />;
      case 'clients':
        return <TrainerClients />;
      case 'payments':
        return <TrainerWallet />;
      case 'messages':
        return <MessagesView />;
      case 'settings':
        return <TrainerSettings />;
      default:
        return <TrainerHome />;
    }
  };

  const statusBanner = {
    not_submitted: {
      icon: <ShieldAlert size={16} />,
      title: 'Verification not submitted',
      text: 'Upload your certificate and citizenship documents to start trainer verification.',
      tone: 'bg-gray-100 text-gray-700 border-gray-200',
      action: 'Start verification',
    },
    pending: {
      icon: <Clock3 size={16} />,
      title: 'Verification under review',
      text: 'Your profile is being reviewed. You can finish your setup, but clients cannot see you yet.',
      tone: 'bg-amber-50 text-amber-700 border-amber-200',
      action: 'View status',
    },
    rejected: {
      icon: <ShieldAlert size={16} />,
      title: 'Verification rejected',
      text:
        trainerProfile?.verificationNote ||
        'Your documents were rejected. Review the note and resubmit your files.',
      tone: 'bg-red-50 text-red-600 border-red-200',
      action: 'Resubmit documents',
    },
    resubmit_required: {
      icon: <ShieldAlert size={16} />,
      title: 'Resubmission required',
      text:
        trainerProfile?.verificationNote ||
        'The admin requested clearer or corrected verification documents.',
      tone: 'bg-orange-50 text-brandOrange border-orange-200',
      action: 'Update documents',
    },
    approved: {
      icon: <BadgeCheck size={16} />,
      title: 'Trainer verified',
      text: 'Your profile is live and visible to clients.',
      tone: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      action: '',
    },
  }[verificationStatus] || {
    icon: <ShieldAlert size={16} />,
    title: 'Verification status unavailable',
    text: 'Open the verification page to review your trainer status.',
    tone: 'bg-gray-100 text-gray-700 border-gray-200',
    action: 'Open verification',
  };

  return (
    <div className="min-h-screen bg-[#F0F2F5] flex font-sans text-gray-900">
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#111111] text-[#9ca3af] transition-transform duration-300 transform ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:relative md:translate-x-0 flex flex-col border-r border-[#333]`}
      >
        <div className="h-16 flex items-center px-5 border-b border-[#333] hover:bg-[#252525] cursor-pointer transition-colors">
          <div className="w-9 h-9 rounded-full bg-brandOrange flex items-center justify-center text-white font-bold text-sm mr-3 border border-orange-400 shrink-0">
            {getInitials(user?.name)}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-gray-200 font-bold text-sm truncate">{user?.name || 'Trainer'}</h3>
            <p className="text-xs text-gray-500 truncate">Professional Account</p>
          </div>
          <ChevronDown size={16} className="text-gray-500" />
        </div>

        <div className="flex-1 overflow-y-auto py-6">
          <div className="mb-8">
            <p className="px-5 text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Main Menu</p>
            <nav className="space-y-1 px-3">
              <NavItem icon={<LayoutDashboard size={18} />} label="Overview" id="overview" activeTab={activeTab} setActiveTab={setActiveTab} />
              <NavItem
                icon={<Inbox size={18} />}
                label="Requests"
                id="requests"
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                badge={pendingCount > 0 ? String(pendingCount) : null}
              />
              <NavItem
                icon={<MessageSquare size={18} />}
                label="Messages"
                id="messages"
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                badge={unreadMessages > 0 ? String(unreadMessages) : null}
              />
              <NavItem icon={<Users size={18} />} label="Clients" id="clients" activeTab={activeTab} setActiveTab={setActiveTab} />
              <NavItem icon={<Wallet size={18} />} label="Payments" id="payments" activeTab={activeTab} setActiveTab={setActiveTab} />
            </nav>
          </div>

          <div className="mb-8">
            <p className="px-5 text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Management</p>
            <nav className="space-y-1 px-3">
              <NavItem icon={<Calendar size={18} />} label="Schedule" id="schedule" activeTab={activeTab} setActiveTab={setActiveTab} />
              <NavItem icon={<Folder size={18} />} label="Libraries" id="libraries" activeTab={activeTab} setActiveTab={setActiveTab} />
              <NavItem icon={<Megaphone size={18} />} label="Marketing" id="marketing" activeTab={activeTab} setActiveTab={setActiveTab} />
            </nav>
          </div>

          <div className="mb-8">
            <p className="px-5 text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">System</p>
            <nav className="space-y-1 px-3">
              <NavItem icon={<Settings size={18} />} label="Settings" id="settings" activeTab={activeTab} setActiveTab={setActiveTab} />
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

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white h-16 border-b border-gray-200 flex items-center justify-between px-8 shrink-0 z-10">
          <div className="flex items-center gap-4 w-1/2">
            <button className="md:hidden text-gray-600" onClick={() => setSidebarOpen(!isSidebarOpen)}>
              <Menu size={20} />
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
            <button className="w-8 h-8 flex items-center justify-center bg-brandOrange text-white rounded-md text-lg font-medium hover:bg-orange-600 transition shadow-sm pb-1">
              +
            </button>
            <div className="h-6 w-px bg-gray-200" />
            <NotificationBell onNavigate={setActiveTab} />
            <div className="w-8 h-8 bg-brandOrange text-white rounded-full flex items-center justify-center text-xs font-bold cursor-pointer border border-orange-300">
              {getInitials(user?.name)}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-[#F7F9FC] p-8">
          <div className="max-w-[1600px] mx-auto space-y-6">
            {!profileLoading && !isTrainerApproved && (
              <div className={`rounded-2xl border px-5 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 ${statusBanner.tone}`}>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{statusBanner.icon}</div>
                  <div>
                    <p className="font-bold text-sm">{statusBanner.title}</p>
                    <p className="text-sm opacity-90 mt-1 leading-6">{statusBanner.text}</p>
                  </div>
                </div>
                <button
                  onClick={openVerificationPage}
                  className="shrink-0 bg-white/80 text-[#111111] px-4 py-2 rounded-xl text-sm font-bold hover:bg-white transition"
                >
                  {statusBanner.action}
                </button>
              </div>
            )}

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
    <div className="flex items-center gap-3">
      {icon} <span>{label}</span>
    </div>
    {badge && (
      <span className="bg-white text-brandOrange text-[10px] font-bold px-1.5 py-0.5 rounded-full">
        {badge}
      </span>
    )}
  </button>
);

export default TrainerDashboard;
