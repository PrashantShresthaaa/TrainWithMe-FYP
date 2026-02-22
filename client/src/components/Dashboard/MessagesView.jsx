import React, { useState } from 'react';
import { MoreVertical, Send, Paperclip, Search, Phone, Video, Smile, Check, CheckCheck } from 'lucide-react';

const contacts = [
  { 
    name: "Sita Gurung", 
    msg: "Don't forget your mat tomorrow!", 
    time: "2m", 
    online: true,
    avatar: "https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=100",
    unread: 1
  },
  { 
    name: "Rohan Shrestha", 
    msg: "Great session today. Keep it up!", 
    time: "1h", 
    online: false,
    avatar: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=100",
    unread: 0
  },
  { 
    name: "Priya Karki", 
    msg: "See you at 7 AM sharp!", 
    time: "1d", 
    online: true,
    avatar: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=100",
    unread: 0
  },
];

const MessagesView = () => {
  const [activeChat, setActiveChat] = useState(0);
  const [message, setMessage] = useState('');

  const selected = contacts[activeChat];

  return (
    <div className="h-[calc(100vh-180px)] min-h-[500px] bg-white rounded-2xl border border-gray-100 flex overflow-hidden">
      
      {/* ─── Contact List ─── */}
      <div className="w-full md:w-[320px] border-r border-gray-100 flex flex-col bg-white">
        {/* Search */}
        <div className="p-4 border-b border-gray-50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={15} />
            <input 
              type="text" 
              placeholder="Search conversations..." 
              className="w-full bg-gray-50 pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none border border-gray-100 focus:border-brandOrange/30 focus:ring-2 focus:ring-brandOrange/10 placeholder-gray-400 transition" 
            />
          </div>
        </div>

        {/* Contacts */}
        <div className="flex-1 overflow-y-auto">
          {contacts.map((chat, i) => (
            <button
              key={i} 
              onClick={() => setActiveChat(i)}
              className={`w-full p-4 flex gap-3 text-left transition-all border-b border-gray-50
                ${activeChat === i ? 'bg-brandOrange/[0.04] border-l-2 border-l-brandOrange' : 'hover:bg-gray-50'}`}
            >
              <div className="relative">
                <img src={chat.avatar} alt={chat.name} className="w-11 h-11 rounded-full object-cover" />
                {chat.online && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-white rounded-full" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                  <h4 className={`font-semibold text-sm truncate ${activeChat === i ? 'text-gray-900' : 'text-gray-700'}`}>
                    {chat.name}
                  </h4>
                  <span className="text-[10px] text-gray-400 ml-2 shrink-0">{chat.time}</span>
                </div>
                <p className="text-xs text-gray-400 truncate mt-0.5">{chat.msg}</p>
              </div>
              {chat.unread > 0 && (
                <span className="mt-1 w-5 h-5 bg-brandOrange text-white text-[10px] font-bold rounded-full flex items-center justify-center shrink-0">
                  {chat.unread}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Chat Area ─── */}
      <div className="flex-1 flex flex-col hidden md:flex">
        {/* Chat header */}
        <div className="px-6 py-4 border-b border-gray-50 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img src={selected.avatar} alt={selected.name} className="w-10 h-10 rounded-full object-cover" />
              {selected.online && (
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-white rounded-full" />
              )}
            </div>
            <div>
              <h4 className="font-bold text-sm text-gray-900">{selected.name}</h4>
              <p className="text-[11px] text-emerald-500 font-medium">{selected.online ? 'Online' : 'Offline'}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl transition"><Phone size={18}/></button>
            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl transition"><Video size={18}/></button>
            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl transition"><MoreVertical size={18}/></button>
          </div>
        </div>
        
        {/* Messages */}
        <div className="flex-1 p-6 overflow-y-auto bg-[#FAFBFC] flex flex-col gap-4">
          {/* Date divider */}
          <div className="flex items-center gap-4 my-2">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Today</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          {/* Sent message */}
          <div className="flex justify-end">
            <div className="max-w-xs">
              <div className="bg-brandOrange text-white px-4 py-3 rounded-2xl rounded-tr-md text-sm leading-relaxed shadow-sm">
                Hi {selected.name.split(' ')[0]}, is our session still on for 5 PM?
              </div>
              <div className="flex justify-end items-center gap-1 mt-1">
                <span className="text-[10px] text-gray-400">2:30 PM</span>
                <CheckCheck size={12} className="text-blue-400" />
              </div>
            </div>
          </div>

          {/* Received message */}
          <div className="flex justify-start">
            <div className="max-w-xs">
              <div className="bg-white border border-gray-100 text-gray-700 px-4 py-3 rounded-2xl rounded-tl-md text-sm leading-relaxed shadow-sm">
                {"Yes Anish! See you then. Don't forget your mat!"}
              </div>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-[10px] text-gray-400">2:32 PM</span>
              </div>
            </div>
          </div>

          {/* Sent */}
          <div className="flex justify-end">
            <div className="max-w-xs">
              <div className="bg-brandOrange text-white px-4 py-3 rounded-2xl rounded-tr-md text-sm leading-relaxed shadow-sm">
                Perfect, already packed! See you soon.
              </div>
              <div className="flex justify-end items-center gap-1 mt-1">
                <span className="text-[10px] text-gray-400">2:33 PM</span>
                <Check size={12} className="text-gray-300" />
              </div>
            </div>
          </div>
        </div>

        {/* Input */}
        <div className="p-4 bg-white border-t border-gray-50">
          <div className="flex gap-2 items-center">
            <button className="p-2.5 text-gray-400 hover:text-brandOrange hover:bg-orange-50 rounded-xl transition">
              <Paperclip size={18}/>
            </button>
            <button className="p-2.5 text-gray-400 hover:text-brandOrange hover:bg-orange-50 rounded-xl transition">
              <Smile size={18}/>
            </button>
            <input 
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)} 
              placeholder="Type a message..." 
              className="flex-1 bg-gray-50 px-4 py-3 rounded-xl text-sm outline-none border border-gray-100 focus:border-brandOrange/30 focus:ring-2 focus:ring-brandOrange/10 placeholder-gray-400 transition" 
            />
            <button className="p-3 bg-brandOrange text-white rounded-xl hover:bg-orange-600 transition shadow-md shadow-brandOrange/20">
              <Send size={16}/>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessagesView;
