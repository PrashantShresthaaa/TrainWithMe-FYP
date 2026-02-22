import React from 'react';
import { Clock, TrendingUp, Activity, Flame, Calendar, ArrowRight, MoreHorizontal, Zap, Target, ChevronRight } from 'lucide-react';

const DashboardHome = ({ setActiveTab }) => {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      
      {/* ─── LEFT COLUMN (spans 2) ─── */}
      <div className="xl:col-span-2 flex flex-col gap-6">

        {/* Hero Banner */}
        <div className="relative bg-[#0E0E10] rounded-2xl p-8 md:p-10 overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-brandOrange/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 left-1/2 w-48 h-48 bg-orange-500/5 rounded-full blur-[80px]" />
          <div className="absolute top-6 right-8 w-20 h-20 border border-white/[0.04] rounded-full" />
          <div className="absolute bottom-8 right-24 w-10 h-10 border border-brandOrange/10 rounded-full" />

          <div className="relative z-10 max-w-lg">
            <div className="inline-flex items-center gap-2 bg-brandOrange/15 text-brandOrange text-xs font-bold px-3 py-1.5 rounded-full mb-4">
              <Zap size={12} /> 3 sessions this week
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3 leading-tight">
              Keep pushing, <span className="text-brandOrange">Anish!</span>
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              You're just one session away from hitting your weekly target. Book now and earn your consistency badge.
            </p>
            <div className="flex flex-wrap gap-3">
              <button 
                onClick={() => setActiveTab('schedule')}
                className="bg-brandOrange hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-bold text-sm transition shadow-lg shadow-brandOrange/25 flex items-center gap-2"
              >
                Book Next Session <ArrowRight size={16} />
              </button>
              <button 
                onClick={() => setActiveTab('progress')}
                className="bg-white/[0.06] hover:bg-white/[0.1] text-white px-6 py-3 rounded-xl font-semibold text-sm transition border border-white/[0.06]"
              >
                View Progress
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: <Activity size={20}/>, label: "Total Workouts", value: "12", color: "text-blue-500", bg: "bg-blue-50" },
            { icon: <Flame size={20}/>, label: "Calories Burned", value: "12.5k", color: "text-brandOrange", bg: "bg-orange-50" },
            { icon: <Clock size={20}/>, label: "Hours Trained", value: "18.5", color: "text-emerald-500", bg: "bg-emerald-50" },
            { icon: <Calendar size={20}/>, label: "Sessions Left", value: "2", color: "text-amber-500", bg: "bg-amber-50", highlight: true },
          ].map((stat, i) => (
            <div 
              key={i} 
              className={`p-5 rounded-2xl border transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md cursor-default
                ${stat.highlight 
                  ? 'bg-gradient-to-br from-brandOrange to-orange-500 text-white border-brandOrange shadow-lg shadow-brandOrange/20' 
                  : 'bg-white border-gray-100 text-gray-800'
                }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 
                ${stat.highlight ? 'bg-white/20' : `${stat.bg} ${stat.color}`}`}>
                {stat.icon}
              </div>
              <h3 className="text-2xl font-bold tracking-tight">{stat.value}</h3>
              <p className={`text-[11px] font-semibold uppercase tracking-wider mt-1 ${stat.highlight ? 'text-white/70' : 'text-gray-400'}`}>
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* Pulse Bar */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 flex flex-col md:flex-row items-stretch gap-4">
          {[
            { icon: <Clock size={18}/>, color: "bg-orange-50 text-brandOrange", title: "Next Session", detail: "5:00 PM - Yoga Flow" },
            { icon: <Flame size={18}/>, color: "bg-blue-50 text-blue-500", title: "Weekly Streak", detail: "3 Days active" },
            { icon: <Target size={18}/>, color: "bg-emerald-50 text-emerald-500", title: "Weight Goal", detail: "72kg / 70kg target" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 flex-1 p-3 rounded-xl hover:bg-gray-50 transition cursor-default">
              <div className={`p-2.5 rounded-xl ${item.color}`}>{item.icon}</div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{item.title}</p>
                <p className="text-sm font-semibold text-gray-800">{item.detail}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Upcoming Sessions */}
        <div className="bg-white rounded-2xl border border-gray-100">
          <div className="flex justify-between items-center p-5 border-b border-gray-50">
            <h3 className="font-bold text-gray-800 text-sm">Upcoming Sessions</h3>
            <button 
              onClick={() => setActiveTab('schedule')}
              className="text-brandOrange text-xs font-bold hover:underline flex items-center gap-1"
            >
              View All <ChevronRight size={14}/>
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {[
              { title: "Yoga Flow", trainer: "Sita Gurung", time: "Today, 5:00 PM", type: "Online", tag: "bg-orange-50 text-brandOrange" },
              { title: "HIIT Cardio", trainer: "Priya Karki", time: "Tomorrow, 7:00 AM", type: "In-Person", tag: "bg-blue-50 text-blue-600" },
              { title: "Strength Training", trainer: "Rohan S.", time: "Wed, 4:00 PM", type: "In-Person", tag: "bg-emerald-50 text-emerald-600" },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-4 p-4 hover:bg-gray-50/50 transition group cursor-pointer">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold ${s.tag}`}>
                  {s.title.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 group-hover:text-brandOrange transition">{s.title}</p>
                  <p className="text-xs text-gray-400">with {s.trainer}</p>
                </div>
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-semibold text-gray-700">{s.time}</p>
                  <p className="text-[10px] text-gray-400">{s.type}</p>
                </div>
                <ChevronRight size={16} className="text-gray-300 group-hover:text-brandOrange transition" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── RIGHT COLUMN ─── */}
      <div className="xl:col-span-1 flex flex-col gap-6">

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="font-bold text-gray-800 text-sm mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: <Calendar size={18}/>, label: "Book", color: "bg-orange-50 text-brandOrange hover:bg-orange-100" },
              { icon: <TrendingUp size={18}/>, label: "Progress", color: "bg-blue-50 text-blue-500 hover:bg-blue-100" },
            ].map((action, i) => (
              <button 
                key={i} 
                onClick={() => setActiveTab(action.label.toLowerCase() === 'book' ? 'schedule' : 'progress')}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl transition font-semibold text-xs ${action.color}`}
              >
                {action.icon}
                {action.label}
              </button>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white border border-gray-100 rounded-2xl flex-1 flex flex-col min-h-[400px]">
          <div className="p-5 border-b border-gray-50 flex justify-between items-center">
            <h3 className="font-bold text-gray-800 text-sm">Recent Activity</h3>
            <button className="text-gray-300 hover:text-gray-500"><MoreHorizontal size={16}/></button>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {[
              { title: "Morning Yoga", detail: "Sita G. - 2 days ago", icon: "bg-orange-50 text-brandOrange", dot: "bg-brandOrange" },
              { title: "Cardio Blast", detail: "Priya K. - 3 days ago", icon: "bg-blue-50 text-blue-500", dot: "bg-blue-500" },
              { title: "Plan Renewed", detail: "System - 1 week ago", icon: "bg-emerald-50 text-emerald-500", dot: "bg-emerald-500" },
              { title: "Weight Updated", detail: "72kg logged - 1 week ago", icon: "bg-amber-50 text-amber-500", dot: "bg-amber-500" },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4 p-4 hover:bg-gray-50/50 transition group">
                <div className="relative mt-0.5">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold ${item.icon}`}>
                    <Activity size={16} />
                  </div>
                  <span className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${item.dot}`} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700 group-hover:text-gray-900 transition">{item.title}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
          
          <button className="w-full py-3.5 text-xs font-bold text-gray-400 hover:text-brandOrange hover:bg-gray-50 border-t border-gray-50 transition rounded-b-2xl">
            VIEW ALL ACTIVITY
          </button>
        </div>

        {/* Active Trainer */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="font-bold text-gray-800 text-sm mb-4">Your Trainer</h3>
          <div className="flex items-center gap-4">
            <img 
              src="https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=200" 
              alt="Trainer"
              className="w-12 h-12 rounded-xl object-cover"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-800">Sita Gurung</p>
              <p className="text-xs text-gray-400">Yoga & Pilates</p>
            </div>
            <button className="text-brandOrange hover:bg-orange-50 p-2 rounded-lg transition">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
