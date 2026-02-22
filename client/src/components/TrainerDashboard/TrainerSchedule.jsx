import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

const TrainerSchedule = () => {
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  // Mock availability: Trainer sets when they are free
  const slots = [
    { day: 24, time: "5 PM", title: "Booked: Anish", type: "booked" },
    { day: 25, time: "7 AM", title: "Booked: Sarah", type: "booked" },
    { day: 26, time: "9 AM", title: "Open Slot", type: "open" }
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-xl font-bold text-brandBlack">Manage Availability</h2>
          <p className="text-gray-500 text-sm">Click a date to add open slots.</p>
        </div>
        <button className="bg-brandBlack text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-gray-800">
          <Plus size={16}/> Add Slot
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-gray-100 rounded-full"><ChevronLeft size={20}/></button>
            <h3 className="text-lg font-bold text-brandBlack">January 2026</h3>
            <button className="p-2 hover:bg-gray-100 rounded-full"><ChevronRight size={20}/></button>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-7 border-b border-gray-100 text-center bg-gray-50">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
            <div key={day} className="py-3 text-xs font-bold text-gray-500 uppercase">{day}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 min-h-[500px]">
          {[1, 2, 3].map(pad => <div key={`pad-${pad}`} className="border-r border-b border-gray-50 bg-gray-50/30"></div>)}
          {days.map(day => {
            const slot = slots.find(s => s.day === day);
            return (
              <div key={day} className="border-r border-b border-gray-100 p-2 min-h-[100px] hover:bg-gray-50 transition relative group cursor-pointer">
                <span className={`text-sm font-bold p-1 rounded-full w-7 h-7 flex items-center justify-center ${day === 24 ? 'bg-brandBlack text-white' : 'text-gray-700'}`}>{day}</span>
                {slot && (
                  <div className={`mt-2 p-1.5 rounded text-[10px] font-bold border ${slot.type === 'booked' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-green-50 text-green-600 border-green-100'}`}>
                    {slot.time} - {slot.title}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TrainerSchedule;