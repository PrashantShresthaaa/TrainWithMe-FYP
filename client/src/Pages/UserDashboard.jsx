import React, { useCallback, useEffect, useState } from 'react';
import {
  Home,
  Calendar,
  MessageSquare,
  TrendingUp,
  Settings,
  LogOut,
  Menu,
  Compass,
  UserCheck,
  ChevronRight,
  CalendarPlus,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

import DashboardHome from '../components/Dashboard/DashboardHome';
import ScheduleView from '../components/Dashboard/ScheduleView';
import MessagesView from '../components/Dashboard/MessagesView';
import ProgressView from '../components/Dashboard/ProgressView';
import SettingsView from '../components/Dashboard/SettingsView';
import ExploreView from '../components/Dashboard/ExploreView';
import MyTrainersView from '../components/Dashboard/MyTrainersView';
import NotificationBell from '../components/Shared/NotificationBell';
import PostLoginSplash from '../components/Shared/PostLoginSplash';

const pageMeta = {
  dashboard: {
    title: 'Overview',
    subtitle: 'Your training hub.',
  },
  explore: {
    title: 'Find Trainers',
    subtitle: 'Browse and book confidently.',
  },
  mytrainers: {
    title: 'My Trainers',
    subtitle: 'Bookings, calls, and trainer relationships.',
  },
  schedule: {
    title: 'Schedule',
    subtitle: 'Keep upcoming sessions in view.',
  },
  messages: {
    title: 'Messages',
    subtitle: 'Stay connected with trainers.',
  },
  progress: {
    title: 'Progress',
    subtitle: 'Track your momentum.',
  },
  settings: {
    title: 'Settings',
    subtitle: 'Manage your account.',
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

const UserDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const hasSplash = Boolean(location.state?.showSplash);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [showSplash, setShowSplash] = useState(hasSplash);
  const [dashboardReady, setDashboardReady] = useState(!hasSplash);

  useEffect(() => {
    if (location.state?.showSplash) {
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate]);

  const handleDashboardReady = useCallback(() => {
    setDashboardReady(true);
  }, []);

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getFirstName = (name) => {
    if (!name) return 'there';
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

  const openMessagesWithTrainer = (trainer) => {
    setSelectedTrainer(trainer);
    setActiveTab('messages');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardHome
            setActiveTab={setActiveTab}
            userName={getFirstName(user?.name)}
            splashActive={showSplash}
            onReady={handleDashboardReady}
          />
        );
      case 'explore':
        return (
          <ExploreView
            setActiveTab={setActiveTab}
            openMessagesWithTrainer={openMessagesWithTrainer}
          />
        );
      case 'mytrainers':
        return <MyTrainersView setActiveTab={setActiveTab} />;
      case 'schedule':
        return <ScheduleView />;
      case 'messages':
        return <MessagesView preselectedTrainer={selectedTrainer} />;
      case 'progress':
        return <ProgressView />;
      case 'settings':
        return <SettingsView />;
      default:
        return (
          <DashboardHome
            setActiveTab={setActiveTab}
            userName={getFirstName(user?.name)}
            splashActive={showSplash}
            onReady={handleDashboardReady}
          />
        );
    }
  };

  const currentPage = pageMeta[activeTab] || pageMeta.dashboard;

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

      {showSplash && (
        <PostLoginSplash
          userName={location.state?.splashName || user?.name || ''}
          duration={1400}
          hold={!dashboardReady}
          onComplete={() => setShowSplash(false)}
        />
      )}

      {isSidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar overlay"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/35 md:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-56 border-r border-gray-800 bg-[#111111] text-white transform transition-transform duration-300 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}
      >
        <div className="flex h-full flex-col overflow-hidden">
          <div className="border-b border-gray-800 px-4 py-4">
            <button
              type="button"
              onClick={() => handleTabChange('dashboard')}
              className="w-full text-left"
            >
              <BrandMark />
            </button>
          </div>

          <div className="twm-sidebar-scroll flex-1 overflow-y-auto px-3 py-4">
            <p className="px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
              Navigation
            </p>

            <nav className="mt-3 space-y-1">
              <NavItem
                icon={<Home size={16} />}
                label="Overview"
                id="dashboard"
                activeTab={activeTab}
                onClick={handleTabChange}
              />
              <NavItem
                icon={<Compass size={16} />}
                label="Find Trainers"
                id="explore"
                activeTab={activeTab}
                onClick={handleTabChange}
              />
              <NavItem
                icon={<UserCheck size={16} />}
                label="My Trainers"
                id="mytrainers"
                activeTab={activeTab}
                onClick={handleTabChange}
              />
              <NavItem
                icon={<Calendar size={16} />}
                label="Schedule"
                id="schedule"
                activeTab={activeTab}
                onClick={handleTabChange}
              />
              <NavItem
                icon={<MessageSquare size={16} />}
                label="Messages"
                id="messages"
                activeTab={activeTab}
                onClick={handleTabChange}
              />
              <NavItem
                icon={<TrendingUp size={16} />}
                label="Progress"
                id="progress"
                activeTab={activeTab}
                onClick={handleTabChange}
              />
            </nav>

            <p className="mt-6 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
              Account
            </p>

            <nav className="mt-3 space-y-1">
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
                <p className="truncate text-sm font-semibold text-white">{user?.name || 'Member'}</p>
                <p className="truncate text-[11px] text-gray-400 capitalize">
                  {user?.role || 'member'}
                </p>
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

      <div className="min-h-screen md:ml-56">
        <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/92 backdrop-blur-sm">
          <div className="mx-auto flex max-w-[1380px] items-center justify-between gap-4 px-5 py-3 md:px-6">
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
                onClick={() => handleTabChange('explore')}
                className="hidden items-center gap-2 rounded-md border border-[#FF6700]/35 bg-transparent px-3.5 py-2 text-sm font-semibold text-[#FF6700] transition hover:border-[#FF6700] hover:bg-[#FF6700]/8 sm:flex"
              >
                <CalendarPlus size={15} />
                Book Session
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
                <span className="max-w-[88px] truncate text-sm font-semibold text-[#111111]">
                  {getFirstName(user?.name)}
                </span>
                <ChevronRight size={14} className="text-gray-300" />
              </button>
            </div>
          </div>
        </header>

        <main className="px-5 py-5 md:px-6 md:py-6">
          <div className="mx-auto max-w-[1380px]">{renderContent()}</div>
        </main>
      </div>
    </div>
  );
};

const NavItem = ({ icon, label, id, activeTab, onClick }) => {
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
      <ChevronRight size={14} className={active ? 'text-white/85' : 'text-gray-600'} />
    </button>
  );
};

export default UserDashboard;
