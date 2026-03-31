import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  Users,
  CalendarDays,
  Wallet,
  LogOut,
  ChevronRight,
  BadgeCheck,
  BadgeAlert,
  Search,
  Activity,
  BriefcaseBusiness,
  Loader,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API = 'http://localhost:5000';

const numberFormat = (value) => new Intl.NumberFormat().format(value || 0);

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, logout, getToken } = useAuth();

  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [trainers, setTrainers] = useState([]);
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState('');
  const [reviewNotes, setReviewNotes] = useState({});

  const getHeaders = () => ({
    Authorization: `Bearer ${getToken()}`,
    'Content-Type': 'application/json',
  });

  useEffect(() => {
    if (!user) return;
    if (user.role !== 'admin') {
      navigate('/login');
    }
  }, [user, navigate]);

  const loadOverview = async () => {
    const res = await fetch(`${API}/api/admin/overview`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to load admin overview');
    return res.json();
  };

  const loadTrainers = async () => {
    const res = await fetch(`${API}/api/admin/trainers`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to load trainers');
    return res.json();
  };

  const loadUsers = async () => {
    const res = await fetch(`${API}/api/admin/users`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to load users');
    return res.json();
  };

  const loadBookings = async () => {
    const res = await fetch(`${API}/api/admin/bookings`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to load bookings');
    return res.json();
  };

  const refreshCurrentData = async () => {
    try {
      setError('');
      if (activeTab === 'overview') {
        setOverview(await loadOverview());
      }
      if (activeTab === 'trainers') {
        setTrainers(await loadTrainers());
      }
      if (activeTab === 'users') {
        setUsers(await loadUsers());
      }
      if (activeTab === 'bookings') {
        setBookings(await loadBookings());
      }
    } catch (error) {
      console.error(error);
      setError(error.message || 'Failed to load admin data.');
    }
  };

  useEffect(() => {
    const boot = async () => {
      try {
        setLoading(true);
        setError('');
        const [overviewData, trainerData] = await Promise.all([
          loadOverview(),
          loadTrainers(),
        ]);
        setOverview(overviewData);
        setTrainers(trainerData);
      } catch (error) {
        console.error(error);
        setError(error.message || 'Failed to load admin workspace.');
      } finally {
        setLoading(false);
      }
    };

    if (user?.role === 'admin') {
      boot();
    }
  }, [user?.role]);

  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    refreshCurrentData();
  }, [activeTab]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const reviewTrainer = async (trainerId, verificationStatus) => {
    try {
      setUpdatingId(trainerId);

      const res = await fetch(`${API}/api/admin/trainers/${trainerId}/verify`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({
          verificationStatus,
          reviewNote: reviewNotes[trainerId] || '',
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to update verification');
      }

      const updated = await res.json();

      setTrainers((prev) =>
        prev.map((trainer) => (trainer._id === trainerId ? updated : trainer))
      );

      setOverview(await loadOverview());
    } catch (error) {
      console.error(error);
      alert('Failed to update trainer verification');
    } finally {
      setUpdatingId(null);
    }
  };

  const safeIncludes = (value, term) => String(value || '').toLowerCase().includes(term);

  const filteredTrainers = trainers.filter((trainer) => {
    const term = search.toLowerCase();
    return (
      safeIncludes(trainer.user?.name, term) ||
      safeIncludes(trainer.user?.email, term) ||
      safeIncludes(trainer.specialty, term) ||
      safeIncludes(trainer.location, term)
    );
  });

  const filteredUsers = users.filter((account) => {
    const term = search.toLowerCase();
    return (
      safeIncludes(account.name, term) ||
      safeIncludes(account.email, term) ||
      safeIncludes(account.role, term)
    );
  });

  const filteredBookings = bookings.filter((booking) => {
    const term = search.toLowerCase();
    return (
      safeIncludes(booking.client?.name, term) ||
      safeIncludes(booking.trainer?.name, term) ||
      safeIncludes(booking.status, term) ||
      safeIncludes(booking.paymentStatus, term)
    );
  });

  const renderOverview = () => {
    const stats = overview?.stats || {};
    const recentBookings = overview?.recentBookings || [];

    return (
      <div className="space-y-6">
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <MetricCard title="Total Users" value={numberFormat(stats.totalUsers)} icon={<Users size={16} />} accent="orange" />
          <MetricCard title="Total Trainers" value={numberFormat(stats.totalTrainers)} icon={<BriefcaseBusiness size={16} />} accent="black" />
          <MetricCard title="Pending Verification" value={numberFormat(stats.pendingVerifications)} icon={<BadgeAlert size={16} />} accent="amber" />
          <MetricCard title="Platform Revenue" value={`Rs. ${numberFormat(stats.platformRevenue)}`} icon={<Wallet size={16} />} accent="green" />
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-6">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200 bg-gray-50">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Recent Activity</p>
              <h3 className="text-lg font-bold text-[#111111] mt-1">Platform Flow</h3>
            </div>

            <div className="divide-y divide-gray-100">
              {recentBookings.length > 0 ? (
                recentBookings.map((booking) => (
                  <div key={booking._id} className="px-5 py-3 hover:bg-gray-50 transition">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-[#111111] truncate">
                          {booking.client?.name || 'Client'} → {booking.trainer?.name || 'Trainer'}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {booking.sessionDate} · {booking.sessionTime}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge text={booking.status} tone={booking.status} />
                        <Badge text={booking.paymentStatus || 'unpaid'} tone={booking.paymentStatus || 'unpaid'} />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-5 py-8 text-center text-gray-500">
                  <p className="text-sm">No recent bookings</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-[#111111] text-white rounded-xl p-5 border border-gray-800 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#FF6700]/10 to-transparent" />
            <div className="relative z-10">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Summary</p>
              <h3 className="text-xl font-bold mt-3 leading-snug">Operations at a glance</h3>

              <div className="grid grid-cols-2 gap-3 mt-5">
                <SummaryBlock label="Verified" value={numberFormat(stats.verifiedTrainers)} />
                <SummaryBlock label="Paid Bookings" value={numberFormat(stats.paidBookings)} />
                <SummaryBlock label="Gross Revenue" value={`Rs. ${numberFormat(stats.grossRevenue)}`} />
                <SummaryBlock label="Trainer Revenue" value={`Rs. ${numberFormat(stats.trainerRevenue)}`} />
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  };

  const renderTrainers = () => (
    <div className="space-y-4">
      {filteredTrainers.map((trainer) => (
        <div key={trainer._id} className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex flex-col lg:flex-row lg:items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-[#FF6700]/10 text-[#FF6700] flex items-center justify-center font-bold text-lg shrink-0">
              {(trainer.user?.name || 'T').charAt(0).toUpperCase()}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-4">
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-[#111111]">{trainer.user?.name || 'Trainer'}</h3>
                  <p className="text-sm text-gray-500">{trainer.user?.email}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {trainer.verificationStatus === 'approved' ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                      <BadgeCheck size={13} />
                      Verified
                    </span>
                  ) : trainer.verificationStatus === 'pending' ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold">
                      <BadgeAlert size={13} />
                      Pending Review
                    </span>
                  ) : trainer.verificationStatus === 'rejected' ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-50 text-red-600 border border-red-200 text-xs font-semibold">
                      <BadgeAlert size={13} />
                      Rejected
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-orange-50 text-brandOrange border border-orange-200 text-xs font-semibold">
                      <BadgeAlert size={13} />
                      {trainer.verificationStatus === 'resubmit_required' ? 'Resubmit Required' : 'Not Submitted'}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid sm:grid-cols-4 gap-3 mb-4">
                <InfoBlock label="Specialty" value={trainer.specialty || 'Not set'} />
                <InfoBlock label="Experience" value={`${trainer.experience || 0} yrs`} />
                <InfoBlock label="Location" value={trainer.location || 'Not set'} />
                <InfoBlock label="Packages" value={String(trainer.packages?.length || 0)} />
              </div>

              {trainer.certifications?.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Certifications</p>
                  <div className="flex flex-wrap gap-2">
                    {trainer.certifications.map((cert, index) => (
                      <span key={index} className="px-2.5 py-1 rounded-full bg-gray-100 border border-gray-200 text-xs font-medium text-gray-700">
                        {cert}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 mb-4">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Verification Documents</p>
                <div className="flex flex-wrap gap-2">
                  {trainer.verificationDocuments?.certificateImage ? (
                    <a
                      href={trainer.verificationDocuments.certificateImage}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-2 rounded-lg bg-white border border-gray-200 text-xs font-bold text-gray-700 hover:text-brandOrange hover:border-brandOrange/30 transition"
                    >
                      View Certificate
                    </a>
                  ) : (
                    <span className="px-3 py-2 rounded-lg bg-white border border-gray-200 text-xs text-gray-400">
                      Certificate missing
                    </span>
                  )}

                  {trainer.verificationDocuments?.citizenshipFrontImage ? (
                    <a
                      href={trainer.verificationDocuments.citizenshipFrontImage}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-2 rounded-lg bg-white border border-gray-200 text-xs font-bold text-gray-700 hover:text-brandOrange hover:border-brandOrange/30 transition"
                    >
                      View Citizenship Front
                    </a>
                  ) : (
                    <span className="px-3 py-2 rounded-lg bg-white border border-gray-200 text-xs text-gray-400">
                      Front ID missing
                    </span>
                  )}

                  {trainer.verificationDocuments?.citizenshipBackImage && (
                    <a
                      href={trainer.verificationDocuments.citizenshipBackImage}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-2 rounded-lg bg-white border border-gray-200 text-xs font-bold text-gray-700 hover:text-brandOrange hover:border-brandOrange/30 transition"
                    >
                      View Citizenship Back
                    </a>
                  )}
                </div>

                {trainer.verificationSubmittedAt && (
                  <p className="text-xs text-gray-500 mt-3">
                    Submitted on {new Date(trainer.verificationSubmittedAt).toLocaleString()}
                  </p>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                  Admin Review Note
                </label>
                <textarea
                  rows={3}
                  value={reviewNotes[trainer._id] ?? trainer.verificationNote ?? ''}
                  onChange={(e) =>
                    setReviewNotes((prev) => ({
                      ...prev,
                      [trainer._id]: e.target.value,
                    }))
                  }
                  placeholder="Add a reason for rejection or a note for resubmission..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-brandOrange text-sm resize-none"
                />
              </div>

              <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
                <button
                  onClick={() => reviewTrainer(trainer._id, 'approved')}
                  disabled={updatingId === trainer._id || trainer.verificationStatus === 'approved'}
                  className="px-4 py-2 rounded-lg bg-[#FF6700] text-white font-semibold text-sm hover:bg-orange-600 transition disabled:opacity-50"
                >
                  {updatingId === trainer._id ? 'Saving...' : 'Approve'}
                </button>

                <button
                  onClick={() => reviewTrainer(trainer._id, 'resubmit_required')}
                  disabled={updatingId === trainer._id}
                  className="px-4 py-2 rounded-lg bg-amber-100 text-amber-800 font-semibold text-sm hover:bg-amber-200 transition disabled:opacity-50"
                >
                  Request Resubmission
                </button>

                <button
                  onClick={() => reviewTrainer(trainer._id, 'rejected')}
                  disabled={updatingId === trainer._id}
                  className="px-4 py-2 rounded-lg bg-red-100 text-red-700 font-semibold text-sm hover:bg-red-200 transition disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}

      {filteredTrainers.length === 0 && (
        <EmptyState title="No trainers found" description="Try a different search term." />
      )}
    </div>
  );

  const renderUsers = () => (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-200 bg-gray-50">
        <h3 className="text-base font-bold text-[#111111]">All Users</h3>
        <p className="text-sm text-gray-500 mt-1">Monitor every account and role in the platform.</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-gray-200 bg-gray-50">
            <tr>
              <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Name</th>
              <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Email</th>
              <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Role</th>
              <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredUsers.map((account) => (
              <tr key={account._id} className="hover:bg-gray-50 transition">
                <td className="px-5 py-3 text-sm font-semibold text-[#111111]">{account.name}</td>
                <td className="px-5 py-3 text-sm text-gray-600">{account.email}</td>
                <td className="px-5 py-3"><Badge text={account.role} tone={account.role} /></td>
                <td className="px-5 py-3 text-sm text-gray-500">{new Date(account.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredUsers.length === 0 && <EmptyState title="No users found" description="Try another search term." />}
    </div>
  );

  const renderBookings = () => (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-200 bg-gray-50">
        <h3 className="text-base font-bold text-[#111111]">Bookings Overview</h3>
        <p className="text-sm text-gray-500 mt-1">Booking lifecycle and payment state across the platform.</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-gray-200 bg-gray-50">
            <tr>
              <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Client</th>
              <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Trainer</th>
              <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Schedule</th>
              <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Amount</th>
              <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Status</th>
              <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Payment</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredBookings.map((booking) => (
              <tr key={booking._id} className="hover:bg-gray-50 transition">
                <td className="px-5 py-3 text-sm font-semibold text-[#111111]">{booking.client?.name || 'Client'}</td>
                <td className="px-5 py-3 text-sm text-gray-600">{booking.trainer?.name || 'Trainer'}</td>
                <td className="px-5 py-3 text-sm text-gray-500">
                  {booking.sessionDate} · {booking.sessionTime}
                </td>
                <td className="px-5 py-3 text-sm font-semibold text-[#111111]">
                  Rs. {numberFormat(booking.totalAmount || booking.price)}
                </td>
                <td className="px-5 py-3"><Badge text={booking.status} tone={booking.status} /></td>
                <td className="px-5 py-3"><Badge text={booking.paymentStatus || 'unpaid'} tone={booking.paymentStatus || 'unpaid'} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredBookings.length === 0 && <EmptyState title="No bookings found" description="Try another search term." />}
    </div>
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F7F9FC] flex items-center justify-center text-gray-500">
        <div className="flex items-center gap-3">
          <Loader className="animate-spin" size={18} />
          <span className="font-semibold text-sm">Preparing admin workspace...</span>
        </div>
      </div>
    );
  }

  if (user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-[#F7F9FC] flex items-center justify-center px-6">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 max-w-md text-center">
          <h2 className="text-xl font-bold text-[#111111]">Admin Access Required</h2>
          <p className="text-sm text-gray-500 mt-2">
            This account does not have admin access. Please log in with an admin account.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-[#111111] flex">
      {/* Sidebar */}
      <aside className="w-56 bg-[#111111] text-white h-screen overflow-hidden flex flex-col border-r border-gray-800 fixed left-0 top-0">
        {/* Brand Area */}
        <div className="px-5 py-5 border-b border-gray-800">
          <h1 className="text-sm font-bold tracking-wider">
            <span style={{ fontFamily: '"Playfair Display", Georgia, serif', fontStyle: 'italic', letterSpacing: '0.02em' }}>
              <span className="text-white">Train</span>
              <span className="text-[#FF6700]">With</span>
              <span className="text-white">Me</span>
            </span>
          </h1>
          <p className="text-xs text-gray-400 mt-3 leading-relaxed">
            Admin console for platform operations and trust.
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <SidebarTab icon={<Activity size={16} />} label="Overview" id="overview" activeTab={activeTab} setActiveTab={setActiveTab} />
          <SidebarTab icon={<ShieldCheck size={16} />} label="Trainer Verification" id="trainers" activeTab={activeTab} setActiveTab={setActiveTab} />
          <SidebarTab icon={<Users size={16} />} label="Users" id="users" activeTab={activeTab} setActiveTab={setActiveTab} />
          <SidebarTab icon={<CalendarDays size={16} />} label="Bookings" id="bookings" activeTab={activeTab} setActiveTab={setActiveTab} />
        </nav>

        {/* Admin Info & Logout */}
        <div className="px-3 py-4 border-t border-gray-800 space-y-4">
          <div className="rounded-lg bg-white/5 border border-gray-700 p-3">
            <p className="text-xs uppercase tracking-wider text-gray-500 font-bold">Logged In As</p>
            <p className="text-sm font-bold mt-1.5">{user.name}</p>
            <p className="text-xs text-[#FF6700] mt-1">Administrator</p>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#FF6700] hover:bg-orange-600 text-white py-2.5 font-semibold text-sm transition"
          >
            <LogOut size={15} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 ml-56 flex flex-col min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-20 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Administration</p>
              <h2 className="text-xl font-bold tracking-tight mt-1">
                {activeTab === 'overview' && 'Platform Overview'}
                {activeTab === 'trainers' && 'Trainer Verification'}
                {activeTab === 'users' && 'User Management'}
                {activeTab === 'bookings' && 'Booking Oversight'}
              </h2>
            </div>

            <div className="relative w-full lg:w-72">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-10 pr-4 py-2 text-sm outline-none focus:border-[#FF6700] focus:ring-2 focus:ring-orange-50 transition"
              />
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          )}
          {loading ? (
            <div className="h-[40vh] flex items-center justify-center">
              <div className="flex items-center gap-3 text-gray-500">
                <Loader className="animate-spin" size={18} />
                <span className="font-semibold text-sm">Loading admin workspace...</span>
              </div>
            </div>
          ) : (
            <>
              {activeTab === 'overview' && renderOverview()}
              {activeTab === 'trainers' && renderTrainers()}
              {activeTab === 'users' && renderUsers()}
              {activeTab === 'bookings' && renderBookings()}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

/* Sub-components */

const SidebarTab = ({ icon, label, id, activeTab, setActiveTab }) => (
  <button
    onClick={() => setActiveTab(id)}
    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition text-sm font-semibold ${
      activeTab === id
        ? 'bg-[#FF6700] text-white'
        : 'text-gray-300 hover:bg-white/10 hover:text-white'
    }`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

const MetricCard = ({ title, value, icon, accent }) => {
  const accents = {
    orange: 'bg-orange-50 text-[#FF6700] border-orange-100',
    black: 'bg-gray-900 text-white border-gray-900',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    green: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className={`w-10 h-10 rounded-lg border flex items-center justify-center ${accents[accent]}`}>
        {icon}
      </div>
      <p className="text-xs uppercase tracking-wider text-gray-500 font-bold mt-3">{title}</p>
      <h3 className="text-2xl font-bold text-[#111111] mt-1">{value}</h3>
    </div>
  );
};

const SummaryBlock = ({ label, value }) => (
  <div className="rounded-lg bg-white/8 border border-gray-700 p-3">
    <p className="text-xs uppercase tracking-wider text-gray-400 font-bold">{label}</p>
    <p className="text-base font-bold mt-1">{value}</p>
  </div>
);

const InfoBlock = ({ label, value }) => (
  <div className="rounded-lg bg-gray-50 border border-gray-200 p-3">
    <p className="text-xs uppercase tracking-wider text-gray-500 font-bold">{label}</p>
    <p className="text-sm font-semibold text-[#111111] mt-1 truncate">{value}</p>
  </div>
);

const EmptyState = ({ title, description }) => (
  <div className="px-5 py-12 text-center text-gray-500">
    <p className="text-base font-bold text-[#111111]">{title}</p>
    <p className="text-sm mt-1">{description}</p>
  </div>
);

const Badge = ({ text, tone }) => {
  const normalized = String(tone || '').toLowerCase();

  const classes = normalized.includes('confirmed') || normalized.includes('paid') || normalized.includes('verified') || normalized.includes('admin')
    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
    : normalized.includes('pending') || normalized.includes('awaiting')
    ? 'bg-amber-50 text-amber-700 border border-amber-200'
    : normalized.includes('rejected') || normalized.includes('failed')
    ? 'bg-red-50 text-red-600 border border-red-100'
    : normalized.includes('completed')
    ? 'bg-blue-50 text-blue-600 border border-blue-100'
    : normalized.includes('trainer')
    ? 'bg-orange-50 text-[#FF6700] border border-orange-100'
    : 'bg-gray-100 text-gray-700 border border-gray-200';

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${classes}`}>
      {String(text).replace(/_/g, ' ')}
    </span>
  );
};

export default AdminDashboard;
