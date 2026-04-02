import React from 'react';
import {
  AlertCircle,
  ArrowRight,
  Calendar,
  Clock3,
  Eye,
  Megaphone,
  MoreHorizontal,
  TrendingUp,
  Users,
} from 'lucide-react';

const TrainerHome = ({ trainerName = 'Trainer' }) => {
  const overviewStats = [
    {
      icon: <Eye size={15} />,
      label: 'Profile Views',
      value: '124',
      note: '+12% today',
      accent: 'text-[#FF6700]',
    },
    {
      icon: <Users size={15} />,
      label: 'Active Clients',
      value: '18',
      note: '4 this week',
      accent: 'text-[#111111]',
    },
    {
      icon: <Clock3 size={15} />,
      label: 'Open Requests',
      value: '2',
      note: 'Needs review',
      accent: 'text-amber-600',
    },
  ];

  const attentionItems = [
    {
      name: 'Anish K.',
      issue: 'Pending booking request',
      time: '2h ago',
      tone: 'text-[#FF6700]',
      button: 'Review',
    },
    {
      name: 'Sarah L.',
      issue: 'Payment issue detected',
      time: '1d ago',
      tone: 'text-red-600',
      button: 'Resolve',
    },
  ];

  const recentActivity = [
    { user: 'Rahul B.', action: 'completed a workout', time: '10m ago', active: true },
    { user: 'Anish K.', action: 'booked a session', time: '1h ago' },
    { user: 'System', action: 'processed a payout', time: '3h ago' },
    { user: 'Sita G.', action: 'updated availability', time: '5h ago' },
    { user: 'Priya S.', action: 'sent a message', time: '1d ago' },
  ];

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
      <div className="xl:col-span-2 space-y-5">
        <section
          className="relative overflow-hidden rounded-lg"
          style={{
            backgroundColor: '#1C1C1C',
            border: '1px solid #2B2B2B',
          }}
        >
          <div
            className="absolute -left-10 -top-12 h-40 w-40 rounded-full blur-3xl"
            style={{ background: 'rgba(255,103,0,0.14)' }}
          />
          <div
            className="absolute bottom-0 right-0 h-32 w-40 rounded-full blur-3xl"
            style={{ background: 'rgba(255,103,0,0.10)' }}
          />
          <div
            className="absolute right-6 top-1/2 h-36 w-36 -translate-y-1/2 rounded-full blur-3xl"
            style={{ background: 'rgba(255,103,0,0.16)' }}
          />

          <div className="relative px-6 py-5 md:px-7">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#FF6700]">
              Visibility
            </p>
            <h2 className="mt-2 max-w-xl text-[24px] font-bold leading-tight text-white">
              Put your profile in front of more clients.
            </h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-gray-300">
              Sharper profile details and updated availability help you stay visible and get
              chosen faster.
            </p>

            <div className="mt-5 flex flex-wrap gap-2.5">
              <button className="inline-flex items-center gap-2 rounded-md border border-[#FF6700]/35 bg-transparent px-4 py-2.5 text-sm font-semibold text-[#FF6700] transition hover:border-[#FF6700] hover:bg-[#FF6700]/8">
                Edit Profile
                <ArrowRight size={15} />
              </button>
              <button className="rounded-md border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.05)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[rgba(255,255,255,0.10)]">
                Add Certifications
              </button>
            </div>

            <div className="mt-5 flex flex-wrap gap-2.5">
              <span className="rounded-full border border-[rgba(255,255,255,0.10)] bg-[rgba(255,255,255,0.05)] px-3 py-1.5 text-xs font-semibold text-gray-300">
                Profile ranking improving
              </span>
              <span className="rounded-full border border-[#FF6700]/20 bg-[#FF6700]/10 px-3 py-1.5 text-xs font-semibold text-orange-200">
                Visibility status: High
              </span>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#FF6700]/10 text-[#FF6700]">
                <Calendar size={15} />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">
                  Today
                </p>
                <p className="mt-0.5 text-sm font-semibold text-[#111111]">
                  {trainerName}, here is today&apos;s snapshot.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-600">
                1 session scheduled
              </span>
              <span className="rounded-full bg-orange-50 px-2.5 py-1 text-[11px] font-semibold text-[#FF6700]">
                2 items to review
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 divide-x divide-gray-100">
              {overviewStats.map((stat) => (
                <CompactStat
                  key={stat.label}
                  icon={stat.icon}
                  label={stat.label}
                  value={stat.value}
                  note={stat.note}
                  accent={stat.accent}
                />
              ))}
          </div>
        </section>

        <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <Panel title="Needs Attention" subtitle="Keep bookings and client issues moving.">
            <div className="divide-y divide-gray-100">
              {attentionItems.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between gap-3 px-5 py-4 transition hover:bg-gray-50"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-md bg-gray-100 text-gray-600">
                      <AlertCircle size={15} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#111111]">{item.name}</p>
                      <p className={`mt-1 text-sm ${item.tone}`}>{item.issue}</p>
                      <p className="mt-1 text-xs text-gray-400">{item.time}</p>
                    </div>
                  </div>

                  <button className="rounded-md border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:border-[#FF6700]/30 hover:bg-orange-50 hover:text-[#FF6700]">
                    {item.button}
                  </button>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Quick Actions" subtitle="Jump into the most common trainer tasks.">
            <div className="grid grid-cols-2 gap-3 px-5 py-5">
              <ActionButton icon={<Calendar size={18} />} label="Add Event" />
              <ActionButton icon={<Users size={18} />} label="Add Client" />
              <ActionButton icon={<Megaphone size={18} />} label="Post Update" />
              <ActionButton icon={<TrendingUp size={18} />} label="Log Stats" />
            </div>
          </Panel>
        </div>
      </div>

      <div className="space-y-5">
        <Panel title="Recent Activity" subtitle="What is moving across your trainer workspace.">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-gray-400">
              Live Feed
            </p>
            <button className="text-gray-400 transition hover:text-gray-600">
              <MoreHorizontal size={16} />
            </button>
          </div>

          <div className="divide-y divide-gray-100">
            {recentActivity.map((item) => (
              <div key={`${item.user}-${item.time}`} className="flex gap-3 px-5 py-4">
                <div
                  className={`mt-1.5 h-2.5 w-2.5 rounded-full ${
                    item.active ? 'bg-emerald-500' : 'bg-gray-300'
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-6 text-[#111111]">
                    <span className="font-bold">{item.user}</span> {item.action}
                  </p>
                  <p className="mt-1 text-xs text-gray-400">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <section className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-5 py-4">
            <h3 className="text-[12px] font-bold uppercase tracking-[0.16em] text-[#111111]">
              Weekly Focus
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Small levers that improve visibility and booking quality.
            </p>
          </div>

          <div className="space-y-4 px-5 py-5">
            <FocusItem title="Profile strength" value="82%" accent="bg-[#FF6700]" />
            <FocusItem title="Availability coverage" value="68%" accent="bg-[#F59E0B]" />
            <FocusItem title="Response speed" value="91%" accent="bg-emerald-500" />
          </div>
        </section>
      </div>
    </div>
  );
};

const Panel = ({ title, subtitle, children }) => (
  <section className="overflow-hidden rounded-lg border border-gray-200 bg-white">
    <div className="border-b border-gray-100 px-5 py-4">
      <h3 className="text-[12px] font-bold uppercase tracking-[0.16em] text-[#111111]">
        {title}
      </h3>
      {subtitle ? <p className="mt-1 text-sm text-gray-500">{subtitle}</p> : null}
    </div>
    {children}
  </section>
);

const CompactStat = ({ icon, label, value, note, accent }) => (
  <div className="px-4 py-3.5 text-center">
    <div className={`mx-auto flex h-7 w-7 items-center justify-center rounded-md bg-gray-50 ${accent}`}>
      {icon}
    </div>
    <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400">
      {label}
    </p>
    <p className="mt-1.5 text-[24px] font-bold tracking-tight text-[#111111]">{value}</p>
    <p className="mt-1 text-[11px] text-gray-400">{note}</p>
  </div>
);

const ActionButton = ({ icon, label }) => (
  <button className="flex flex-col items-center justify-center rounded-md border border-gray-200 px-4 py-5 transition hover:border-[#FF6700]/30 hover:bg-orange-50/30">
    <div className="text-gray-500 transition-colors hover:text-[#FF6700]">{icon}</div>
    <span className="mt-2 text-sm font-semibold text-gray-700">{label}</span>
  </button>
);

const FocusItem = ({ title, value, accent }) => (
  <div>
    <div className="mb-2 flex items-center justify-between">
      <span className="text-sm font-semibold text-[#111111]">{title}</span>
      <span className="text-sm font-bold text-gray-500">{value}</span>
    </div>
    <div className="h-2 overflow-hidden rounded-full bg-gray-100">
      <div className={`h-full rounded-full ${accent}`} style={{ width: value }} />
    </div>
  </div>
);

export default TrainerHome;
