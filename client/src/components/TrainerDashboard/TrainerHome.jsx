import React from 'react';
import { MoreHorizontal, AlertCircle, TrendingUp, Calendar, ArrowRight, Users, Megaphone, Clock, Eye, DollarSign } from 'lucide-react';

const TrainerHome = () => {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
      
      {/* --- LEFT COLUMN (Main Feed) --- */}
      <div className="xl:col-span-3 space-y-6">
        
        {/* 1. REPLACEMENT: Trainer Pulse Bar (Value instead of Trial) */}
        <div className="bg-white px-6 py-4 rounded-lg border border-gray-200 flex flex-col md:flex-row items-center justify-between shadow-sm gap-4">
          
          {/* Item 1: Next Session */}
          <div className="flex items-center gap-3 w-full md:w-auto border-b md:border-b-0 md:border-r border-gray-100 pb-2 md:pb-0 md:pr-6">
            <div className="bg-orange-50 text-brandOrange p-2 rounded-lg">
              <Clock size={18} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Up Next</p>
              <p className="text-sm font-bold text-gray-800">5:00 PM • Yoga with Anish</p>
            </div>
          </div>

          {/* Item 2: Profile Performance */}
          <div className="flex items-center gap-3 w-full md:w-auto border-b md:border-b-0 md:border-r border-gray-100 pb-2 md:pb-0 md:pr-6">
            <div className="bg-blue-50 text-blue-600 p-2 rounded-lg">
              <Eye size={18} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Profile Views</p>
              <p className="text-sm font-bold text-gray-800">124 today <span className="text-green-500 text-xs font-normal">(+12%)</span></p>
            </div>
          </div>

          {/* Item 3: Today's Earnings */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="bg-green-50 text-green-600 p-2 rounded-lg">
              <DollarSign size={18} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Earned Today</p>
              <p className="text-sm font-bold text-gray-800">Rs. 4,500</p>
            </div>
          </div>

        </div>

        {/* 2. Marketing Banner (Replaced Masterclass with Profile Boosting) */}
        <div className="bg-[#1F2937] rounded-lg p-8 text-white relative overflow-hidden flex items-center shadow-md">
          <div className="relative z-10 max-w-2xl">
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-brandOrange text-white text-xs font-bold px-2 py-0.5 rounded uppercase">Pro Tip</span>
            </div>
            <h2 className="text-2xl font-bold mb-2">Boost Your Profile Visibility</h2>
            <p className="text-gray-300 text-sm mb-6 max-w-lg leading-relaxed">
              Trainers with complete bios and at least 3 certifications get 2x more bookings. Update your profile to rank higher in search results.
            </p>
            <button className="bg-brandOrange hover:bg-orange-600 text-white px-6 py-2.5 rounded font-bold text-sm transition shadow-lg shadow-orange-500/20">
              EDIT PROFILE
            </button>
          </div>
          {/* Abstract Background Design */}
          <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-black/50 to-transparent"></div>
          <div className="absolute -right-10 -bottom-20 w-64 h-64 bg-brandOrange/20 rounded-full blur-3xl"></div>
        </div>

        {/* 3. Action Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          
          {/* Client Alerts */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-bold text-gray-800 text-sm">Needs Attention</h3>
              <span className="bg-red-100 text-red-600 text-xs font-bold px-2.5 py-0.5 rounded-full">2</span>
            </div>
            <div className="p-5 space-y-4">
              {[
                { name: "Anish K.", issue: "Pending Booking Request", time: "2h ago", color: "text-brandOrange", bg: "bg-orange-50" },
                { name: "Sarah L.", issue: "Payment Failed", time: "1d ago", color: "text-red-600", bg: "bg-red-50" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between group cursor-pointer hover:bg-gray-50 p-2 rounded-md -mx-2 transition">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                       <img src={`https://images.unsplash.com/photo-${1500000000000 + i}?q=80&w=100`} className="w-full h-full object-cover" alt="User"/>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-800">{item.name}</p>
                      <p className={`text-xs ${item.color} font-medium`}>{item.issue}</p>
                    </div>
                  </div>
                  <button className="text-xs border border-gray-200 px-3 py-1.5 rounded text-gray-600 hover:bg-white hover:text-brandOrange hover:border-brandOrange transition">Review</button>
                </div>
              ))}
            </div>
            <div className="px-5 py-3 border-t border-gray-100 text-center">
              <button className="text-xs font-bold text-gray-500 hover:text-brandOrange transition">View All Alerts</button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
             <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-bold text-gray-800 text-sm">Quick Actions</h3>
            </div>
            <div className="p-5 grid grid-cols-2 gap-4">
              <ActionButton icon={<Calendar size={20}/>} label="Add Event" />
              <ActionButton icon={<Users size={20}/>} label="Add Client" />
              <ActionButton icon={<Megaphone size={20}/>} label="Post Update" />
              <ActionButton icon={<TrendingUp size={20}/>} label="Log Stats" />
            </div>
          </div>

        </div>
      </div>

      {/* --- RIGHT COLUMN (Activity Stream) --- */}
      <div className="xl:col-span-1">
        <div className="bg-white border border-gray-200 rounded-lg h-full min-h-[600px] shadow-sm flex flex-col">
          <div className="p-5 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-bold text-gray-700 text-xs uppercase tracking-wide">Recent Activity</h3>
            <button className="text-gray-400 hover:text-gray-600"><MoreHorizontal size={16}/></button>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {[
              { user: "Rahul B.", action: "completed workout", time: "10m", type: "check" },
              { user: "Anish K.", action: "booked a session", time: "1h", type: "calendar" },
              { user: "System", action: "Payout processed", time: "3h", type: "money" },
              { user: "Sita G.", action: "updated schedule", time: "5h", type: "edit" },
              { user: "Priya S.", action: "sent a message", time: "1d", type: "msg" },
            ].map((act, i) => (
              <div key={i} className="flex gap-4 p-4 border-b border-gray-50 hover:bg-gray-50 transition group">
                <div className={`mt-1 w-2.5 h-2.5 rounded-full ${i===0 ? 'bg-green-500' : 'bg-gray-300 group-hover:bg-brandOrange'}`}></div>
                <div>
                  <p className="text-sm text-gray-800 leading-snug">
                    <span className="font-bold">{act.user}</span> {act.action}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">{act.time} ago</p>
                </div>
              </div>
            ))}
          </div>
          
          <button className="w-full py-3 text-xs font-bold text-gray-400 hover:text-brandOrange hover:bg-gray-50 border-t border-gray-100 transition">
            LOAD MORE
          </button>
        </div>
      </div>

    </div>
  );
};

const ActionButton = ({ icon, label }) => (
  <button className="flex flex-col items-center justify-center p-4 border border-gray-100 rounded-lg hover:border-brandOrange/50 hover:bg-orange-50/20 transition group">
    <div className="text-gray-500 group-hover:text-brandOrange mb-2 transition-colors">{icon}</div>
    <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900">{label}</span>
  </button>
);

export default TrainerHome;