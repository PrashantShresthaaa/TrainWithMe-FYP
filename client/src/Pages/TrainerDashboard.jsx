import React, { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  Wallet,
  Settings,
  LogOut,
  Menu,
  Calendar,
  Inbox,
  ShieldAlert,
  Clock3,
  BadgeCheck,
  Loader,
  ChevronRight,
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

const pageMeta = {
  overview: {
    title: 'Overview',
    subtitle: 'Your trainer workspace at a glance.',
  },
  requests: {
    title: 'Requests',
    subtitle: 'Review incoming booking requests and approvals.',
  },
  messages: {
    title: 'Messages',
    subtitle: 'Stay connected with clients in real time.',
  },
  clients: {
    title: 'Clients',
    subtitle: 'Manage active members and ongoing relationships.',
  },
  payments: {
    title: 'Payments',
    subtitle: 'Track earnings, payouts, and billing activity.',
  },
  schedule: {
    title: 'Schedule',
    subtitle: 'Manage your availability and confirmed sessions.',
  },
  settings: {
    title: 'Settings',
    subtitle: 'Update your profile, visibility, and account details.',
  },
};

const BrandMark = () => (
  <div
    className="text-[22px] leading-none"
    style={{
      fontFamily: '"Playfair Display", Georgia, serif',
      fontStyle: 'italic',
      fontWeight: 600,
      letterSpacing: '-0.03em',
    }}
  >
    <span className="text-white">Train</span>
    <span className="text-[#FF6700]">With</span>
    <span className="text-white">Me</span>
  </div>
);

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

  const getFirstName = (name) => {
    if (!name) return 'Trainer';
    return name.split(' ')[0];
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSidebarOpen(false);
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
  }, [user?._id, user?.role, getToken]);

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
        setPendingCount(data.filter((booking) => booking.status === 'pending').length);
      } catch {}
    };

    fetchPendingCount();
  }, [activeTab, getToken, isTrainerApproved]);

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
  }, [activeTab, getToken]);

  const openVerificationPage = () => navigate('/trainer-verification');

  const renderContent = () => {
    if (profileLoading) {
      return (
        <div className="flex items-center justify-center rounded-lg border border-gray-200 bg-white h-64">
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
        return <TrainerHome trainerName={getFirstName(user?.name)} />;
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
        return <TrainerHome trainerName={getFirstName(user?.name)} />;
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

  const currentPage = pageMeta[activeTab] || pageMeta.overview;
  const headerAction =
    activeTab === 'requests'
      ? {
          label: 'Open Requests',
          tab: 'requests',
          icon: <Inbox size={15} />,
        }
      : {
          label: 'Open Schedule',
          tab: 'schedule',
          icon: <Calendar size={15} />,
        };

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#111111]">
      <style>{`
        .twm-sidebar-scroll {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .twm-sidebar-scroll::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      {isSidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar overlay"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/35 md:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-60 border-r border-gray-800 bg-[#111111] text-white transform transition-transform duration-300 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}
      >
        <div className="flex h-full flex-col overflow-hidden">
          <div className="border-b border-gray-800 px-4 py-4">
            <button
              type="button"
              onClick={() => handleTabChange('overview')}
              className="w-full text-left"
            >
              <BrandMark />
            </button>
          </div>

          <div className="twm-sidebar-scroll flex-1 overflow-y-auto px-3 py-4">
            <p className="px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
              Workspace
            </p>
            <nav className="mt-3 space-y-1">
              <NavItem
                icon={<LayoutDashboard size={16} />}
                label="Overview"
                id="overview"
                activeTab={activeTab}
                onClick={handleTabChange}
              />
              <NavItem
                icon={<Inbox size={16} />}
                label="Requests"
                id="requests"
                activeTab={activeTab}
                onClick={handleTabChange}
                badge={pendingCount > 0 ? String(pendingCount) : null}
              />
              <NavItem
                icon={<MessageSquare size={16} />}
                label="Messages"
                id="messages"
                activeTab={activeTab}
                onClick={handleTabChange}
                badge={unreadMessages > 0 ? String(unreadMessages) : null}
              />
              <NavItem
                icon={<Users size={16} />}
                label="Clients"
                id="clients"
                activeTab={activeTab}
                onClick={handleTabChange}
              />
              <NavItem
                icon={<Wallet size={16} />}
                label="Payments"
                id="payments"
                activeTab={activeTab}
                onClick={handleTabChange}
              />
            </nav>

            <p className="mt-6 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
              Manage
            </p>
            <nav className="mt-3 space-y-1">
              <NavItem
                icon={<Calendar size={16} />}
                label="Schedule"
                id="schedule"
                activeTab={activeTab}
                onClick={handleTabChange}
              />
              <NavItem
                icon={<Settings size={16} />}
                label="Settings"
                id="settings"
                activeTab={activeTab}
                onClick={handleTabChange}
              />
            </nav>
          </div>

          <div className="border-t border-gray-800 px-4 py-3.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#FF6700] text-[11px] font-bold text-white">
                {getInitials(user?.name)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">{user?.name || 'Trainer'}</p>
                <p className="truncate text-[11px] text-gray-400">Professional account</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-md border border-[#FF6700]/35 bg-transparent px-3 py-2 text-sm font-semibold text-[#FF6700] transition hover:border-[#FF6700] hover:bg-[#FF6700]/8"
            >
              <LogOut size={14} />
              Logout
            </button>
          </div>
        </div>
      </aside>

      <div className="min-h-screen md:ml-60">
        <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/92 backdrop-blur-sm">
          <div className="mx-auto flex max-w-[1480px] items-center justify-between gap-4 px-5 py-3 md:px-7">
            <div className="flex min-w-0 items-center gap-3">
              <button
                className="rounded-lg border border-gray-200 p-2 text-gray-600 transition hover:bg-gray-50 md:hidden"
                onClick={() => setSidebarOpen((prev) => !prev)}
              >
                <Menu size={17} />
              </button>

              <div className="min-w-0">
                <h1 className="truncate text-[18px] font-bold tracking-tight text-[#111111]">
                  {currentPage.title}
                </h1>
                <p className="hidden text-[13px] text-gray-500 md:block">{currentPage.subtitle}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => handleTabChange(headerAction.tab)}
                className="hidden items-center gap-2 rounded-md border border-[#FF6700]/35 bg-transparent px-3.5 py-2 text-sm font-semibold text-[#FF6700] transition hover:border-[#FF6700] hover:bg-[#FF6700]/8 sm:flex"
              >
                {headerAction.icon}
                {headerAction.label}
              </button>

              <div className="flex h-9 w-9 items-center justify-center rounded-md border border-gray-200 bg-white">
                <NotificationBell onNavigate={setActiveTab} />
              </div>

              <button
                type="button"
                onClick={() => handleTabChange('settings')}
                className="hidden items-center gap-2 rounded-md border border-gray-200 bg-white px-2.5 py-2 transition hover:border-gray-300 md:flex"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#FF6700] text-[11px] font-bold text-white">
                  {getInitials(user?.name)}
                </div>
                <span className="max-w-[96px] truncate text-sm font-semibold text-[#111111]">
                  {getFirstName(user?.name)}
                </span>
                <ChevronRight size={14} className="text-gray-300" />
              </button>
            </div>
          </div>
        </header>

        <main className="px-5 py-5 md:px-7 md:py-6">
          <div className="mx-auto max-w-[1480px] space-y-5">
            {!profileLoading && !isTrainerApproved && (
              <div className={`rounded-lg border px-5 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 ${statusBanner.tone}`}>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{statusBanner.icon}</div>
                  <div>
                    <p className="font-bold text-sm">{statusBanner.title}</p>
                    <p className="text-sm opacity-90 mt-1 leading-6">{statusBanner.text}</p>
                  </div>
                </div>
                {statusBanner.action ? (
                  <button
                    onClick={openVerificationPage}
                    className="shrink-0 rounded-md border border-current/20 bg-white/80 px-4 py-2 text-sm font-semibold transition hover:bg-white"
                  >
                    {statusBanner.action}
                  </button>
                ) : null}
              </div>
            )}

            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

const NavItem = ({ icon, label, id, activeTab, onClick, badge }) => {
  const active = activeTab === id;

  return (
    <button
      onClick={() => onClick(id)}
      className={`flex w-full items-center justify-between rounded-md px-3 py-2.5 text-sm font-semibold transition ${
        active
          ? 'bg-[#FF6700] text-white'
          : 'text-gray-300 hover:bg-white/[0.05] hover:text-white'
      }`}
    >
      <span className="flex items-center gap-3">
        {icon}
        <span>{label}</span>
      </span>
      {badge ? (
        <span className="rounded-full bg-white px-1.5 py-0.5 text-[10px] font-bold text-[#FF6700]">
          {badge}
        </span>
      ) : (
        <ChevronRight size={14} className={active ? 'text-white/85' : 'text-gray-600'} />
      )}
    </button>
  );
};

export default TrainerDashboard;
