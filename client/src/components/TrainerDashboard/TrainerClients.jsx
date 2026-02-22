import React from 'react';
import { MessageSquare, MoreHorizontal } from 'lucide-react';

const TrainerClients = () => (
  <div className="space-y-6 animate-fadeIn">
    <h2 className="text-2xl font-bold text-brandBlack">My Clients</h2>
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
          <div className="flex justify-between items-start mb-4">
            <img src={`https://images.unsplash.com/photo-${1500000000000+i}?q=80&w=100`} className="w-14 h-14 rounded-full object-cover" alt="C" />
            <button className="text-gray-400 hover:text-brandBlack"><MoreHorizontal/></button>
          </div>
          <h3 className="font-bold text-lg text-brandBlack">Client Name {i}</h3>
          <p className="text-sm text-gray-500 mb-4">Weight Loss Program • 3 Weeks left</p>
          <div className="flex gap-2">
            <button className="flex-1 bg-brandOrange/10 text-brandOrange py-2 rounded-lg font-bold text-sm hover:bg-brandOrange hover:text-white transition flex items-center justify-center gap-2">
              <MessageSquare size={16}/> Chat
            </button>
            <button className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-lg font-bold text-sm hover:bg-gray-200 transition">
              Profile
            </button>
          </div>
        </div>
      ))}
    </div>
  </div>
);
export default TrainerClients;