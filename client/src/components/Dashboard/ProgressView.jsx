import React, { useState } from 'react';
import { TrendingUp, Flame, Target, Award, ChevronDown, ArrowUpRight, ArrowDownRight, Dumbbell, Zap, Heart } from 'lucide-react';

const ProgressView = () => {
  const [period, setPeriod] = useState('week');
  
  const barData = [
    { day: "Mon", value: 40 },
    { day: "Tue", value: 70 },
    { day: "Wed", value: 30 },
    { day: "Thu", value: 85 },
    { day: "Fri", value: 55 },
    { day: "Sat", value: 20 },
    { day: "Sun", value: 90 },
  ];

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Your Progress</h2>
          <p className="text-sm text-gray-400 mt-0.5">Track your fitness journey and achievements.</p>
        </div>
        <div className="flex items-center bg-gray-50 p-1 rounded-xl border border-gray-100">
          {['week', 'month', 'year'].map(p => (
            <button 
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg text-xs font-bold capitalize transition-all
                ${period === p ? 'bg-white text-gray-900 shadow-sm border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: <Flame size={18}/>, label: "Calories", value: "2,480", change: "+12%", up: true, color: "text-brandOrange", bg: "bg-orange-50" },
          { icon: <Dumbbell size={18}/>, label: "Workouts", value: "5", change: "+2", up: true, color: "text-blue-500", bg: "bg-blue-50" },
          { icon: <Target size={18}/>, label: "Weight", value: "72 kg", change: "-0.5kg", up: false, color: "text-emerald-500", bg: "bg-emerald-50" },
          { icon: <Heart size={18}/>, label: "Avg Heart Rate", value: "128", change: "bpm", up: null, color: "text-rose-500", bg: "bg-rose-50" },
        ].map((s, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${s.bg} ${s.color}`}>
              {s.icon}
            </div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{s.label}</p>
            <div className="flex items-end gap-2 mt-1">
              <span className="text-2xl font-bold text-gray-900">{s.value}</span>
              {s.up !== null && (
                <span className={`text-[11px] font-bold flex items-center gap-0.5 mb-1 ${s.up ? 'text-emerald-500' : 'text-blue-500'}`}>
                  {s.up ? <ArrowUpRight size={12}/> : <ArrowDownRight size={12}/>}
                  {s.change}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        
        {/* Weekly Chart */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-bold text-gray-800">Weekly Activity</h3>
              <p className="text-xs text-gray-400 mt-0.5">Sessions completed per day</p>
            </div>
            <span className="text-brandOrange font-bold text-sm bg-brandOrange/10 px-3 py-1 rounded-lg">3/5 Goal</span>
          </div>
          
          <div className="flex items-end gap-3 h-44">
            {barData.map((bar, i) => {
              const isHighest = bar.value === Math.max(...barData.map(b => b.value));
              return (
                <div key={i} className="flex-1 flex flex-col items-center justify-end group">
                  <div className="relative w-full">
                    {isHighest && (
                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] font-bold px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                        {bar.value}%
                      </div>
                    )}
                    <div 
                      className={`w-full rounded-xl transition-all duration-500 group-hover:opacity-90
                        ${isHighest 
                          ? 'bg-gradient-to-t from-brandOrange to-orange-400 shadow-md shadow-brandOrange/20' 
                          : 'bg-gray-100 group-hover:bg-gray-200'
                        }`} 
                      style={{ height: `${bar.value}%` }}
                    />
                  </div>
                  <span className={`text-[10px] mt-2 font-semibold ${isHighest ? 'text-brandOrange' : 'text-gray-400'}`}>
                    {bar.day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Body metrics */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-1">Body Metrics</h3>
          <p className="text-xs text-gray-400 mb-6">Track your body composition changes</p>
          
          <div className="flex flex-col gap-5">
            {[
              { label: "Weight", current: "72 kg", target: "70 kg", progress: 85, color: "bg-brandOrange" },
              { label: "Body Fat", current: "18%", target: "15%", progress: 60, color: "bg-blue-500" },
              { label: "Muscle Mass", current: "35 kg", target: "38 kg", progress: 70, color: "bg-emerald-500" },
            ].map((m, i) => (
              <div key={i}>
                <div className="flex justify-between items-baseline mb-2">
                  <span className="text-sm font-semibold text-gray-700">{m.label}</span>
                  <span className="text-xs text-gray-400">{m.current} / {m.target}</span>
                </div>
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${m.color}`}
                    style={{ width: `${m.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Achievements */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100">
        <div className="flex justify-between items-center mb-5">
          <div>
            <h3 className="font-bold text-gray-800">Achievements</h3>
            <p className="text-xs text-gray-400 mt-0.5">Badges earned through your fitness journey</p>
          </div>
          <span className="text-xs font-bold text-gray-400">3 of 12 unlocked</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { title: "Early Bird", desc: "Completed 5 morning sessions", icon: <Zap size={24}/>, earned: true },
            { title: "Consistency King", desc: "7-day workout streak", icon: <Flame size={24}/>, earned: true },
            { title: "First Session", desc: "Completed your first session", icon: <Award size={24}/>, earned: true },
          ].map((badge, i) => (
            <div 
              key={i} 
              className={`flex items-center gap-4 p-4 rounded-xl border transition-all 
                ${badge.earned 
                  ? 'bg-gradient-to-br from-orange-50 to-amber-50/50 border-brandOrange/20 shadow-sm' 
                  : 'bg-gray-50 border-gray-100 opacity-50'
                }`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0
                ${badge.earned ? 'bg-brandOrange/15 text-brandOrange' : 'bg-gray-100 text-gray-400'}`}>
                {badge.icon}
              </div>
              <div>
                <h4 className={`font-bold text-sm ${badge.earned ? 'text-gray-800' : 'text-gray-500'}`}>{badge.title}</h4>
                <p className="text-[11px] text-gray-400 mt-0.5">{badge.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProgressView;
