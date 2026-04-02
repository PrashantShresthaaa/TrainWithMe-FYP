import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  CalendarDays,
  CheckCircle,
  Clock3,
  ShieldCheck,
  Target,
  TrendingUp,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const API = 'http://localhost:5000';

const statusStyles = {
  pending: {
    pill: 'bg-amber-50 text-amber-700 border border-amber-200',
    label: 'Pending',
  },
  accepted_awaiting_payment: {
    pill: 'bg-orange-50 text-orange-700 border border-orange-200',
    label: 'Awaiting Payment',
  },
  confirmed: {
    pill: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    label: 'Confirmed',
  },
  rejected: {
    pill: 'bg-red-50 text-red-600 border border-red-200',
    label: 'Rejected',
  },
  cancelled: {
    pill: 'bg-gray-100 text-gray-600 border border-gray-200',
    label: 'Cancelled',
  },
  completed: {
    pill: 'bg-blue-50 text-blue-700 border border-blue-200',
    label: 'Completed',
  },
};

const parseDate = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const sortBySessionDate = (a, b) => {
  const first = parseDate(a.sessionDate)?.getTime() || 0;
  const second = parseDate(b.sessionDate)?.getTime() || 0;
  return first - second;
};

const formatSessionDate = (value) => {
  const parsed = parseDate(value);
  if (!parsed) return value || 'Not scheduled';
  return parsed.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
};

const DashboardShell = () => (
  <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
    <div className="xl:col-span-2 space-y-5">
      <section className="overflow-hidden rounded-lg border border-gray-900 bg-[#111111]">
        <div className="grid gap-5 px-6 py-6 md:grid-cols-[1.45fr_1fr] md:px-7">
          <div className="relative">
            <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-[#FF6700]/10 blur-3xl" />
            <div className="relative z-10 h-3 w-24 rounded bg-white/10" />
            <div className="relative z-10 mt-4 h-7 w-[78%] rounded bg-white/10" />
            <div className="relative z-10 mt-2 h-7 w-[58%] rounded bg-white/10" />
            <div className="relative z-10 mt-4 h-4 w-[46%] rounded bg-white/10" />
            <div className="relative z-10 mt-5 flex gap-3">
              <div className="h-10 w-40 rounded-md border border-white/10 bg-white/[0.04]" />
              <div className="h-10 w-32 rounded-md border border-white/10 bg-white/[0.04]" />
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
            <div className="h-3 w-24 rounded bg-white/10" />
            <div className="mt-4 h-5 w-40 rounded bg-white/10" />
            <div className="mt-2 h-4 w-32 rounded bg-white/10" />
            <div className="mt-4 flex gap-2">
              <div className="h-7 w-20 rounded-md bg-white/10" />
              <div className="h-7 w-20 rounded-md bg-white/10" />
            </div>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-5 py-3.5">
          <div className="h-3 w-32 rounded bg-gray-100" />
        </div>

        <div className="grid divide-y divide-gray-100 md:grid-cols-[1.15fr_1fr] md:divide-y-0 md:divide-x">
          <div className="px-5 py-4">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-md bg-gray-100" />
              <div className="flex-1">
                <div className="h-3 w-24 rounded bg-gray-100" />
                <div className="mt-3 h-6 w-40 rounded bg-gray-100" />
                <div className="mt-2 h-4 w-[85%] rounded bg-gray-100" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 divide-x divide-gray-100">
            {[1, 2, 3].map((item) => (
              <div key={item} className="px-4 py-4 text-center">
                <div className="mx-auto h-8 w-8 rounded-md bg-gray-100" />
                <div className="mx-auto mt-3 h-3 w-14 rounded bg-gray-100" />
                <div className="mx-auto mt-3 h-7 w-10 rounded bg-gray-100" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {[1, 2].map((item) => (
        <section key={item} className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-5 py-4">
            <div className="flex-1">
              <div className="h-3 w-36 rounded bg-gray-100" />
              <div className="mt-2 h-4 w-52 rounded bg-gray-100" />
            </div>
            <div className="h-4 w-24 rounded bg-gray-100" />
          </div>

          <div className="px-5 py-5">
            {item === 1 ? (
              <div className="space-y-4">
                {[1, 2, 3].map((row) => (
                  <div key={row} className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="h-4 w-40 rounded bg-gray-100" />
                      <div className="mt-2 h-4 w-32 rounded bg-gray-100" />
                    </div>
                    <div className="flex gap-2">
                      <div className="h-7 w-20 rounded-md bg-gray-100" />
                      <div className="h-7 w-20 rounded-md bg-gray-100" />
                      <div className="h-7 w-20 rounded-md bg-gray-100" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-4">
                  {[1, 2, 3].map((row) => (
                    <div key={row}>
                      <div className="mb-2 flex items-center justify-between">
                        <div className="h-4 w-28 rounded bg-gray-100" />
                        <div className="h-4 w-10 rounded bg-gray-100" />
                      </div>
                      <div className="h-2 rounded-full bg-gray-100" />
                    </div>
                  ))}
                </div>
                <div className="rounded-lg border border-gray-200 bg-[#FAFAFA] p-4">
                  <div className="h-3 w-16 rounded bg-gray-100" />
                  <div className="mt-3 h-5 w-40 rounded bg-gray-100" />
                  <div className="mt-3 h-4 w-full rounded bg-gray-100" />
                  <div className="mt-2 h-4 w-[86%] rounded bg-gray-100" />
                  <div className="mt-4 flex gap-2">
                    <div className="h-7 w-28 rounded-full bg-gray-100" />
                    <div className="h-7 w-24 rounded-full bg-gray-100" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      ))}
    </div>

    <div className="space-y-5">
      {[1, 2].map((panel) => (
        <section key={panel} className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-5 py-4">
            <div className="h-3 w-24 rounded bg-gray-100" />
            <div className="mt-2 h-4 w-40 rounded bg-gray-100" />
          </div>

          <div className="px-5 py-3">
            {[1, 2, 3].map((row) => (
              <div key={row} className="flex items-center gap-3 py-3">
                <div className="h-10 w-10 rounded-md bg-gray-100" />
                <div className="flex-1">
                  <div className="h-4 w-28 rounded bg-gray-100" />
                  <div className="mt-2 h-3 w-24 rounded bg-gray-100" />
                </div>
                <div className="h-6 w-16 rounded-md bg-gray-100" />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>

  </div>
);

const DashboardHome = ({ setActiveTab, userName, splashActive = false, onReady }) => {
  const { getToken } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await fetch(`${API}/api/bookings`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });

        if (!res.ok) throw new Error('Failed to load bookings');

        const data = await res.json();
        setBookings(Array.isArray(data) ? data : []);
      } catch {
        setBookings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [getToken]);

  useEffect(() => {
    if (!loading) {
      onReady?.();
    }
  }, [loading, onReady]);

  const activeBookings = bookings.filter(
    (booking) => booking.status !== 'cancelled' && booking.status !== 'rejected'
  );

  const upcomingBookings = [...activeBookings]
    .filter((booking) => {
      const date = parseDate(booking.sessionDate);
      if (!date) return false;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return date >= today;
    })
    .sort(sortBySessionDate);

  const completedBookings = bookings.filter((booking) => booking.status === 'completed');
  const confirmedBookings = bookings.filter((booking) => booking.status === 'confirmed');
  const pendingBookings = bookings.filter(
    (booking) =>
      booking.status === 'pending' || booking.status === 'accepted_awaiting_payment'
  );

  const uniqueTrainers = [
    ...new Map(
      bookings
        .filter((booking) => booking.trainer)
        .map((booking) => [
          booking.trainer._id || booking.trainer.name,
          {
            name: booking.trainer?.name || 'Trainer',
            email: booking.trainer?.email || '',
            latestStatus: booking.status,
            totalBookings: bookings.filter(
              (item) =>
                (item.trainer?._id || item.trainer?.name) ===
                (booking.trainer?._id || booking.trainer?.name)
            ).length,
          },
        ])
    ).values(),
  ];

  const nextSession = upcomingBookings[0] || null;
  const recentActivity = [...bookings]
    .sort(
      (a, b) =>
        new Date(b.createdAt || b.updatedAt || 0) - new Date(a.createdAt || a.updatedAt || 0)
    )
    .slice(0, 4);

  const totalBookings = bookings.length;
  const completionRate =
    totalBookings > 0 ? Math.round((completedBookings.length / totalBookings) * 100) : 0;
  const bookingStability =
    totalBookings > 0 ? Math.round((confirmedBookings.length / totalBookings) * 100) : 0;

  if (loading) {
    return <DashboardShell />;
  }

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
      <div className="xl:col-span-2 space-y-5">
        <section className="overflow-hidden rounded-lg border border-gray-900 bg-[#111111]">
          <div className="grid gap-5 px-6 py-6 md:grid-cols-[1.45fr_1fr] md:px-7">
            <div className="relative">
              <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-[#FF6700]/10 blur-3xl" />
              <p className="relative z-10 text-[10px] font-bold uppercase tracking-[0.22em] text-[#FF6700]">
                Welcome back
              </p>
              <h2 className="relative z-10 mt-2 text-[27px] font-bold leading-tight text-white">
                {userName || 'There'}, your week is in motion.
              </h2>
              <p className="relative z-10 mt-3 text-sm text-gray-400">
                {upcomingBookings.length} upcoming session
                {upcomingBookings.length !== 1 ? 's' : ''} on the board.
              </p>

              <div className="relative z-10 mt-5 flex flex-wrap gap-2.5">
                <button
                  onClick={() => setActiveTab('explore')}
                  className="inline-flex items-center gap-2 rounded-md border border-[#FF6700]/35 bg-transparent px-4 py-2.5 text-sm font-semibold text-[#FF6700] transition hover:border-[#FF6700] hover:bg-[#FF6700]/8"
                >
                  Book Next Session
                  <ArrowRight size={15} />
                </button>

                <button
                  onClick={() => setActiveTab('schedule')}
                  className="rounded-md border border-white/12 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
                >
                  Open Schedule
                </button>
              </div>
            </div>

            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-gray-500">
                Next Session
              </p>

              {nextSession ? (
                <div className="mt-3 space-y-2.5">
                  <div>
                    <p className="text-base font-bold text-white">
                      {nextSession.trainer?.name || 'Trainer Session'}
                    </p>
                    <p className="mt-1 text-sm text-gray-400">
                      {formatSessionDate(nextSession.sessionDate)} at {nextSession.sessionTime}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-md bg-white/[0.06] px-2.5 py-1 text-[11px] font-semibold text-gray-300">
                      {nextSession.sessionType}
                    </span>
                    <span
                      className={`rounded-md px-2.5 py-1 text-[11px] font-bold ${
                        (statusStyles[nextSession.status] || statusStyles.pending).pill
                      }`}
                    >
                      {(statusStyles[nextSession.status] || statusStyles.pending).label}
                    </span>
                  </div>

                  <button
                    onClick={() => setActiveTab('mytrainers')}
                    className="pt-1 text-sm font-semibold text-[#FF6700] transition hover:text-orange-400"
                  >
                    View booking
                  </button>
                </div>
              ) : (
                <div className="mt-3">
                  <p className="text-sm font-semibold text-white">No session scheduled</p>
                  <p className="mt-1 text-sm text-gray-400">Find a trainer and lock one in.</p>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-5 py-3.5">
            <h3 className="text-[12px] font-bold uppercase tracking-[0.16em] text-[#111111]">
              Overview Snapshot
            </h3>
          </div>

          <div className="grid divide-y divide-gray-100 md:grid-cols-[1.15fr_1fr] md:divide-y-0 md:divide-x">
            <div className="px-5 py-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-md bg-[#FF6700]/10 text-[#FF6700]">
                  <CalendarDays size={16} />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400">
                    This Week
                  </p>
                  <p className="mt-1 text-xl font-bold tracking-tight text-[#111111]">
                    {upcomingBookings.length} session{upcomingBookings.length !== 1 ? 's' : ''}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    {nextSession
                      ? `Next up: ${formatSessionDate(nextSession.sessionDate)} at ${nextSession.sessionTime}`
                      : 'No upcoming session booked yet.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 divide-x divide-gray-100">
              <CompactStat
                icon={<UserCheck size={15} />}
                label="Trainers"
                value={uniqueTrainers.length}
                accent="text-[#FF6700]"
              />
              <CompactStat
                icon={<Clock3 size={15} />}
                label="Pending"
                value={pendingBookings.length}
                accent="text-amber-600"
              />
              <CompactStat
                icon={<CheckCircle size={15} />}
                label="Completed"
                value={completedBookings.length}
                accent="text-emerald-600"
              />
            </div>
          </div>
        </section>

        <Panel
          title="Upcoming Sessions"
          subtitle="Your next booked sessions and request status."
          actionLabel="Open schedule"
          onAction={() => setActiveTab('schedule')}
        >
          {upcomingBookings.length === 0 ? (
            <EmptyState
              title="No upcoming sessions"
              description="Once you book a trainer, your schedule will show here."
              actionLabel="Find trainers"
              onAction={() => setActiveTab('explore')}
            />
          ) : (
            <div className="divide-y divide-gray-100">
              {upcomingBookings.slice(0, 5).map((booking) => (
                <div
                  key={booking._id}
                  className="flex flex-col gap-3 px-5 py-4 transition hover:bg-gray-50 md:flex-row md:items-center md:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-[#111111]">
                      {booking.trainer?.name || 'Trainer'}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      {formatSessionDate(booking.sessionDate)} at {booking.sessionTime}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-600">
                      {booking.sessionType}
                    </span>
                    <span className="rounded-md bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-600">
                      Rs. {(booking.totalAmount || booking.price || 0).toLocaleString()}
                    </span>
                    <span
                      className={`rounded-md px-2.5 py-1 text-[11px] font-bold ${
                        (statusStyles[booking.status] || statusStyles.pending).pill
                      }`}
                    >
                      {(statusStyles[booking.status] || statusStyles.pending).label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel
          title="Performance Snapshot"
          subtitle="A tighter read on booking quality and consistency."
        >
          <div className="grid gap-5 px-5 py-5 md:grid-cols-2">
            <div className="space-y-4">
              <ProgressRow
                label="Completion Rate"
                value={completionRate}
                accent="bg-emerald-500"
              />
              <ProgressRow
                label="Booking Stability"
                value={bookingStability}
                accent="bg-[#FF6700]"
              />
              <ProgressRow
                label="Pending Load"
                value={
                  totalBookings > 0 ? Math.round((pendingBookings.length / totalBookings) * 100) : 0
                }
                accent="bg-amber-500"
              />
            </div>

            <div className="rounded-lg border border-gray-200 bg-[#FAFAFA] p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-gray-400">
                Focus
              </p>
              <h3 className="mt-2 text-base font-bold text-[#111111]">
                Keep the next booking cycle steady.
              </h3>
              <p className="mt-2 text-sm leading-6 text-gray-500">
                You have {confirmedBookings.length} confirmed session
                {confirmedBookings.length !== 1 ? 's' : ''} and {pendingBookings.length} request
                {pendingBookings.length !== 1 ? 's' : ''} still in motion.
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <Tag icon={<Target size={12} />} text={`${completionRate}% completion`} />
                <Tag icon={<ShieldCheck size={12} />} text={`${bookingStability}% confirmed`} />
                <Tag icon={<TrendingUp size={12} />} text={`${uniqueTrainers.length} trainer links`} />
              </div>
            </div>
          </div>
        </Panel>
      </div>

      <div className="space-y-5">
        <Panel title="My Trainers" subtitle="Your active trainer relationships.">
          {uniqueTrainers.length === 0 ? (
            <EmptyState
              title="No trainers yet"
              description="Book a session to start building your trainer list."
              actionLabel="Browse trainers"
              onAction={() => setActiveTab('explore')}
            />
          ) : (
            <div className="divide-y divide-gray-100">
              {uniqueTrainers.slice(0, 5).map((trainer, index) => (
                <div
                  key={`${trainer.name}-${index}`}
                  className="flex items-center gap-3 px-5 py-4 transition hover:bg-gray-50"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#FF6700]/10 text-sm font-bold text-[#FF6700]">
                    {trainer.name.charAt(0).toUpperCase()}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-[#111111]">{trainer.name}</p>
                    <p className="truncate text-xs text-gray-400">
                      {trainer.email || `${trainer.totalBookings} booking records`}
                    </p>
                  </div>

                  <span
                    className={`rounded-md px-2 py-1 text-[10px] font-bold ${
                      (statusStyles[trainer.latestStatus] || statusStyles.pending).pill
                    }`}
                  >
                    {(statusStyles[trainer.latestStatus] || statusStyles.pending).label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Recent Activity" subtitle="Latest changes across your bookings.">
          {recentActivity.length === 0 ? (
            <EmptyState
              title="No recent activity"
              description="Your booking updates will appear here once you start using the platform."
            />
          ) : (
            <div className="divide-y divide-gray-100">
              {recentActivity.map((booking) => (
                <div key={booking._id} className="px-5 py-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-md bg-gray-100 text-gray-600">
                      <CalendarDays size={14} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-[#111111]">
                        {booking.trainer?.name || 'Trainer'} session update
                      </p>
                      <p className="mt-1 text-xs leading-5 text-gray-500">
                        {formatSessionDate(booking.sessionDate)} at {booking.sessionTime} •{' '}
                        {booking.sessionType}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <span
                      className={`rounded-md px-2.5 py-1 text-[10px] font-bold ${
                        (statusStyles[booking.status] || statusStyles.pending).pill
                      }`}
                    >
                      {(statusStyles[booking.status] || statusStyles.pending).label}
                    </span>
                    <span className="rounded-md bg-gray-100 px-2.5 py-1 text-[10px] font-semibold text-gray-600">
                      Rs. {(booking.totalAmount || booking.price || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
};

const Panel = ({ title, subtitle, actionLabel, onAction, children }) => (
  <section className="overflow-hidden rounded-lg border border-gray-200 bg-white">
    <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-5 py-4">
      <div>
        <h3 className="text-[12px] font-bold uppercase tracking-[0.16em] text-[#111111]">
          {title}
        </h3>
        {subtitle ? <p className="mt-1 text-sm text-gray-500">{subtitle}</p> : null}
      </div>

      {actionLabel ? (
        <button
          onClick={onAction}
          className="shrink-0 text-sm font-semibold text-[#FF6700] transition hover:text-orange-600"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
    {children}
  </section>
);

const CompactStat = ({ icon, label, value, accent }) => (
  <div className="px-4 py-4 text-center">
    <div className={`mx-auto flex h-8 w-8 items-center justify-center rounded-md bg-gray-50 ${accent}`}>
      {icon}
    </div>
    <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400">
      {label}
    </p>
    <p className="mt-2 text-2xl font-bold tracking-tight text-[#111111]">{value}</p>
  </div>
);

const ProgressRow = ({ label, value, accent }) => (
  <div>
    <div className="mb-2 flex items-center justify-between">
      <span className="text-sm font-semibold text-[#111111]">{label}</span>
      <span className="text-sm font-bold text-gray-500">{value}%</span>
    </div>
    <div className="h-2 overflow-hidden rounded-full bg-gray-100">
      <div className={`h-full rounded-full ${accent}`} style={{ width: `${value}%` }} />
    </div>
  </div>
);

const Tag = ({ icon, text }) => (
  <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600">
    {icon}
    {text}
  </span>
);

const EmptyState = ({ title, description, actionLabel, onAction }) => (
  <div className="px-5 py-10 text-center">
    <p className="text-base font-bold text-[#111111]">{title}</p>
    <p className="mt-1 text-sm text-gray-500">{description}</p>
    {actionLabel ? (
      <button
        onClick={onAction}
        className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#FF6700] transition hover:text-orange-600"
      >
        {actionLabel}
        <ArrowRight size={15} />
      </button>
    ) : null}
  </div>
);

export default DashboardHome;
