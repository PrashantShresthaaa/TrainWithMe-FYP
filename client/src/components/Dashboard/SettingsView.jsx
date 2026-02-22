import React, { useState } from 'react';
import { CreditCard, Bell, Shield, Camera, User, Mail, Phone, MapPin, ChevronRight, Check } from 'lucide-react';

const SettingsView = () => {
  const [activeSection, setActiveSection] = useState('profile');

  const sections = [
    { id: 'profile', label: 'Profile', icon: <User size={16}/> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={16}/> },
    { id: 'payment', label: 'Payment', icon: <CreditCard size={16}/> },
    { id: 'privacy', label: 'Privacy', icon: <Shield size={16}/> },
  ];

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">Settings</h2>
        <p className="text-sm text-gray-400 mt-0.5">Manage your account preferences.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">

        {/* Sidebar nav */}
        <div className="md:w-56 shrink-0">
          <div className="bg-white rounded-2xl border border-gray-100 p-2">
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all
                  ${activeSection === s.id 
                    ? 'bg-brandOrange/10 text-brandOrange font-semibold' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
              >
                {s.icon}
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeSection === 'profile' && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
              <h3 className="font-bold text-gray-800 text-base mb-6">Profile Information</h3>
              
              {/* Avatar */}
              <div className="flex items-center gap-5 mb-8 pb-8 border-b border-gray-50">
                <div className="relative group">
                  <img 
                    src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=200" 
                    className="w-20 h-20 rounded-2xl object-cover ring-4 ring-gray-50" 
                    alt="Profile" 
                  />
                  <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition flex items-center justify-center cursor-pointer">
                    <Camera size={20} className="text-white" />
                  </div>
                </div>
                <div>
                  <p className="font-bold text-gray-800">Anish K.</p>
                  <p className="text-xs text-gray-400 mb-2">Premium Member</p>
                  <button className="text-xs font-bold text-brandOrange hover:underline">Change Photo</button>
                </div>
              </div>

              {/* Form */}
              <div className="grid md:grid-cols-2 gap-5">
                {[
                  { label: "First Name", value: "Anish", icon: <User size={16}/>, type: "text" },
                  { label: "Last Name", value: "K.", icon: <User size={16}/>, type: "text" },
                  { label: "Email", value: "anish@example.com", icon: <Mail size={16}/>, type: "email" },
                  { label: "Phone", value: "+977 98XXXXXXXX", icon: <Phone size={16}/>, type: "tel" },
                  { label: "Location", value: "Kathmandu, Nepal", icon: <MapPin size={16}/>, type: "text" },
                ].map((field, i) => (
                  <div key={i} className={i === 4 ? 'md:col-span-2' : ''}>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{field.label}</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300">{field.icon}</span>
                      <input 
                        type={field.type} 
                        defaultValue={field.value} 
                        className="w-full bg-gray-50 border border-gray-100 pl-10 pr-4 py-3 rounded-xl text-sm outline-none focus:border-brandOrange/40 focus:ring-2 focus:ring-brandOrange/10 transition" 
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end mt-8 pt-6 border-t border-gray-50">
                <button className="bg-brandOrange text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-orange-600 transition shadow-lg shadow-brandOrange/20">
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {activeSection === 'notifications' && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
              <h3 className="font-bold text-gray-800 text-base mb-6">Notification Preferences</h3>
              <div className="flex flex-col gap-4">
                {[
                  { label: "Session Reminders", desc: "Get notified 30 min before sessions", default: true },
                  { label: "New Messages", desc: "Receive push notifications for messages", default: true },
                  { label: "Trainer Updates", desc: "When your trainer updates schedule", default: false },
                  { label: "Promotions", desc: "Receive offers and promotional content", default: false },
                ].map((n, i) => (
                  <ToggleRow key={i} label={n.label} desc={n.desc} defaultOn={n.default} />
                ))}
              </div>
            </div>
          )}

          {activeSection === 'payment' && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
              <h3 className="font-bold text-gray-800 text-base mb-6">Payment Methods</h3>
              
              {/* Existing method */}
              <div className="flex items-center justify-between p-4 border border-gray-100 rounded-xl mb-4 hover:border-gray-200 transition">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                    <span className="text-white text-[10px] font-bold">eSewa</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">eSewa Wallet</p>
                    <p className="text-xs text-gray-400">Linked account ending in 9841</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-1 rounded-md">Default</span>
                  <button className="text-xs font-bold text-gray-400 hover:text-brandOrange transition">Edit</button>
                </div>
              </div>

              <button className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm font-bold text-gray-400 hover:text-brandOrange hover:border-brandOrange/30 transition">
                + Add Payment Method
              </button>
            </div>
          )}

          {activeSection === 'privacy' && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
              <h3 className="font-bold text-gray-800 text-base mb-6">Privacy & Security</h3>
              <div className="flex flex-col gap-4">
                <ToggleRow label="Profile Visibility" desc="Allow trainers to see your profile" defaultOn={true} />
                <ToggleRow label="Show Progress" desc="Share progress with your trainer" defaultOn={true} />
                <ToggleRow label="Two-Factor Auth" desc="Add extra security to your account" defaultOn={false} />
              </div>
              
              <div className="mt-8 pt-6 border-t border-gray-50">
                <button className="text-sm font-bold text-red-500 hover:text-red-600 hover:underline transition">
                  Delete Account
                </button>
                <p className="text-[11px] text-gray-400 mt-1">This action is permanent and cannot be undone.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─── Toggle Row ─── */
const ToggleRow = ({ label, desc, defaultOn }) => {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition">
      <div>
        <p className="text-sm font-semibold text-gray-700">{label}</p>
        <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
      </div>
      <button 
        onClick={() => setOn(!on)}
        className={`w-11 h-6 rounded-full flex items-center transition-colors duration-200 px-0.5
          ${on ? 'bg-brandOrange' : 'bg-gray-200'}`}
      >
        <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 flex items-center justify-center
          ${on ? 'translate-x-5' : 'translate-x-0'}`}>
          {on && <Check size={10} className="text-brandOrange" />}
        </div>
      </button>
    </div>
  );
};

export default SettingsView;
