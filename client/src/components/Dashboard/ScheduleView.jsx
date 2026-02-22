import React, { useState } from 'react';
import { Clock, MapPin, LayoutList, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Video, User } from 'lucide-react';

const ScheduleView = () => {
  const [view, setView] = useState('calendar'); 
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const events = [
    { day: 18, title: "Yoga Flow", time: "5 PM", color: "bg-brandOrange/10 text-brandOrange border-brandOrange/20" },
    { day: 19, title: "HIIT", time: "7 AM", color: "bg-blue-50 text-blue-600 border-blue-100" },
    { day: 22, title: "Cardio", time: "6 PM", color: "bg-emerald-50 text-emerald-600 border-emerald-100" },
    { day: 25, title: "Strength", time: "4 PM", color: "bg-amber-50 text-amber-600 border-amber-100" }
  ];

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl border border-gray-100">
        <div>
          <h2 className="text-xl font-bold text-gray-900">My Schedule</h2>
          <p className="text-gray-400 text-sm mt-0.5">Manage your upcoming training sessions.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-gray-50 p-1 rounded-xl border border-gray-100">
            <button 
              onClick={() => setView('list')} 
              className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all
                ${view === 'list' ? 'bg-white text-gray-900 shadow-sm border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <LayoutList size={14}/> List
            </button>
            <button 
              onClick={() => setView('calendar')} 
              className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all
                ${view === 'calendar' ? 'bg-white text-gray-900 shadow-sm border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <CalendarIcon size={14}/> Calendar
            </button>
          </div>
          <button className="bg-brandOrange text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-orange-600 transition shadow-md shadow-brandOrange/20">
            + Book Session
          </button>
        </div>
      </div>

      {view === 'calendar' ? (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {/* Calendar header */}
          <div className="flex justify-between items-center p-5 border-b border-gray-50">
            <div className="flex items-center gap-3">
              <button className="p-2 hover:bg-gray-50 rounded-xl transition text-gray-400 hover:text-gray-700">
                <ChevronLeft size={18}/>
              </button>
              <h3 className="text-base font-bold text-gray-900">January 2026</h3>
              <button className="p-2 hover:bg-gray-50 rounded-xl transition text-gray-400 hover:text-gray-700">
                <ChevronRight size={18}/>
              </button>
            </div>
            <button className="text-xs font-bold text-brandOrange hover:underline">Today</button>
          </div>

          {/* Day names */}
          <div className="grid grid-cols-7 border-b border-gray-50 bg-gray-50/50">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
              <div key={day} className="py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center">{day}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7">
            {/* Padding cells for offset */}
            {[1, 2, 3].map(pad => (
              <div key={`pad-${pad}`} className="border-r border-b border-gray-50 bg-gray-50/20 min-h-[90px]" />
            ))}
            {days.map(day => {
              const event = events.find(e => e.day === day);
              const isToday = day === 18;
              return (
                <div 
                  key={day} 
                  className={`border-r border-b border-gray-50 p-2 min-h-[90px] transition cursor-pointer group
                    ${isToday ? 'bg-brandOrange/[0.02]' : 'hover:bg-gray-50/50'}`}
                >
                  <span className={`text-xs font-bold w-7 h-7 flex items-center justify-center rounded-full transition
                    ${isToday 
                      ? 'bg-brandOrange text-white' 
                      : 'text-gray-500 group-hover:bg-gray-100'
                    }`}>
                    {day}
                  </span>
                  {event && (
                    <div className={`mt-1.5 px-2 py-1.5 rounded-lg text-[10px] font-bold border ${event.color}`}>
                      {event.time} - {event.title}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ─── List View ─── */
        <div className="flex flex-col gap-4">
          {[
            { 
              day: "Today", date: "Jan 18", time: "05:00 PM", title: "Yoga Flow", 
              trainer: "Sita Gurung", type: "Online", status: "Upcoming",
              statusColor: "bg-brandOrange/10 text-brandOrange",
              avatar: "https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=100"
            },
            { 
              day: "Tomorrow", date: "Jan 19", time: "07:00 AM", title: "HIIT Cardio", 
              trainer: "Priya Karki", type: "In-Person", status: "Confirmed",
              statusColor: "bg-emerald-50 text-emerald-600",
              avatar: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=100"
            },
            { 
              day: "Wed", date: "Jan 22", time: "06:00 PM", title: "Cardio Blast", 
              trainer: "Rohan Shrestha", type: "In-Person", status: "Confirmed",
              statusColor: "bg-emerald-50 text-emerald-600",
              avatar: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=100"
            }
          ].map((session, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col md:flex-row md:items-center gap-4 hover:border-gray-200 hover:shadow-sm transition group cursor-pointer">
              {/* Date badge */}
              <div className="flex flex-col items-center justify-center min-w-[60px] p-3 bg-gray-50 rounded-xl">
                <span className="text-[10px] font-bold text-gray-400 uppercase">{session.day}</span>
                <span className="text-xl font-bold text-gray-800">{session.date.split(' ')[1]}</span>
                <span className="text-[10px] text-gray-400">{session.date.split(' ')[0]}</span>
              </div>

              {/* Session info */}
              <div className="flex items-center gap-4 flex-1">
                <img src={session.avatar} alt={session.trainer} className="w-11 h-11 rounded-xl object-cover" />
                <div className="flex-1">
                  <h3 className="font-bold text-gray-800 group-hover:text-brandOrange transition">{session.title}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">with {session.trainer}</p>
                </div>
              </div>

              {/* Meta */}
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg">
                  <Clock size={12}/> {session.time}
                </div>
                <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg">
                  {session.type === 'Online' ? <Video size={12}/> : <MapPin size={12}/>}
                  {session.type}
                </div>
                <span className={`px-3 py-1.5 rounded-lg text-[11px] font-bold ${session.statusColor}`}>
                  {session.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ScheduleView;
