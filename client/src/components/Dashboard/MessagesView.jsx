import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Send, Search, UserCheck, UserX, Loader, ArrowLeft,
  MessageSquare, Paperclip, X, FileText, Image, CheckCheck, Check
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { io } from 'socket.io-client';

const API = 'http://localhost:5000';
let socket; // module-level socket instance

// ── Time label helper ──
function timeLabel(dateStr) {
  const d   = new Date(dateStr);
  const now = new Date();
  const diff = now - d;
  if (diff < 60000)    return 'just now';
  if (diff < 3600000)  return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// preselectedTrainer: { _id, name, role } — passed from ExploreView when clicking Message
export default function MessagesView({ preselectedTrainer = null }) {
  const { getToken, user } = useAuth();
  const token   = getToken();
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const [conversations,   setConversations]   = useState([]);
  const [activeConv,      setActiveConv]       = useState(null);
  const [messages,        setMessages]         = useState([]);
  const [locked,          setLocked]           = useState(false);
  const [input,           setInput]            = useState('');
  const [sending,         setSending]          = useState(false);
  const [loading,         setLoading]          = useState(true);
  const [search,          setSearch]           = useState('');
  const [showMobileChat,  setShowMobileChat]   = useState(false);
  const [typingText,      setTypingText]       = useState('');
  const [selectedFile,    setSelectedFile]     = useState(null); // { file, preview, type }
  const [uploading,       setUploading]        = useState(false);

  const bottomRef    = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimer  = useRef(null);
  const activeConvRef = useRef(null); // keep ref in sync for socket handler

  // Keep ref in sync
  useEffect(() => { activeConvRef.current = activeConv; }, [activeConv]);

  // ── Load conversations ──
  const loadConversations = useCallback(async () => {
    try {
      const res  = await fetch(`${API}/api/messages/conversations`, { headers });
      const data = await res.json();
      if (Array.isArray(data)) setConversations(data);
    } catch {}
    setLoading(false);
  }, []);

  // ── Load messages for a conversation ──
  const loadMessages = useCallback(async (otherId) => {
    try {
      const res  = await fetch(`${API}/api/messages/conversation/${otherId}`, { headers });
      const data = await res.json();
      setLocked(data.locked || false);
      setMessages(data.messages || []);
    } catch {}
  }, []);

  // ── Auto-open conversation when coming from ExploreView ──
  // Runs whenever preselectedTrainer changes OR loading finishes
  useEffect(() => {
    if (!preselectedTrainer) return;

    const doOpen = async () => {
      // Build a synthetic conv immediately so the chat window opens right away
      const syntheticConv = {
        user: {
          _id:  preselectedTrainer._id,
          name: preselectedTrainer.name,
          role: preselectedTrainer.role || 'trainer',
        },
        lastMessage: null,
        unread: 0,
        isRequest: false,
      };

      // Check if an existing conversation exists in DB
      try {
        const res  = await fetch(`${API}/api/messages/conversation/${preselectedTrainer._id}`, {
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setLocked(data.locked || false);
        setMessages(data.messages || []);
      } catch {
        setMessages([]);
        setLocked(false);
      }

      setActiveConv(syntheticConv);
      setShowMobileChat(true);
    };

    doOpen();
  }, [preselectedTrainer]);

    // ── Init Socket.io ──
  useEffect(() => {
    loadConversations();

    // Connect socket
    socket = io(API, { transports: ['websocket'] });

    socket.on('connect', () => {
      console.log('✅ Socket connected');
      socket.emit('join', user._id); // join personal room
    });

    // New message received
    socket.on('new_message', (msg) => {
      const conv = activeConvRef.current;
      const otherId = conv?.user?._id;
      const msgPartnerId =
        msg.sender._id === user._id ? msg.receiver._id : msg.sender._id;

      // If message belongs to active chat, append it
      if (otherId && msgPartnerId === otherId) {
        setMessages(prev => {
          // avoid duplicates
          if (prev.find(m => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
      }
      // Refresh conversation list for unread badges
      loadConversations();
    });

    // Typing indicators
    socket.on('typing',      ({ fromUserName }) => setTypingText(`${fromUserName} is typing...`));
    socket.on('stop_typing', () => setTypingText(''));

    // Request accepted
    socket.on('request_accepted', () => {
      if (activeConvRef.current) {
        setLocked(false);
        loadMessages(activeConvRef.current.user._id);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Open a conversation ──
  const openConversation = (conv) => {
    setActiveConv(conv);
    setShowMobileChat(true);
    setTypingText('');
    setSelectedFile(null);
    loadMessages(conv.user._id);
    // Clear unread badge
    setConversations(prev =>
      prev.map(c => c.user._id === conv.user._id ? { ...c, unread: 0 } : c)
    );
  };

  // ── Typing indicator ──
  const handleTyping = (e) => {
    setInput(e.target.value);
    if (!activeConv) return;
    socket.emit('typing', { toUserId: activeConv.user._id, fromUserName: user.name });
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      socket.emit('stop_typing', { toUserId: activeConv.user._id });
    }, 1500);
  };

  // ── Send text message ──
  const sendMsg = async () => {
    if ((!input.trim() && !selectedFile) || !activeConv || sending) return;

    // If file is selected, upload it
    if (selectedFile) {
      await uploadFile();
      return;
    }

    setSending(true);
    socket.emit('stop_typing', { toUserId: activeConv.user._id });

    try {
      const res  = await fetch(`${API}/api/messages`, {
        method:  'POST',
        headers,
        body:    JSON.stringify({ receiverId: activeConv.user._id, content: input.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        // Optimistically add to UI (socket will also fire but we deduplicate)
        setMessages(prev => prev.find(m => m._id === data._id) ? prev : [...prev, data]);
        setInput('');
        loadConversations();
      }
    } catch {}
    setSending(false);
  };

  // ── Upload file to Cloudinary via backend ──
  const uploadFile = async () => {
    if (!selectedFile || !activeConv) return;
    setUploading(true);

    const formData = new FormData();
    formData.append('file', selectedFile.file);
    formData.append('receiverId', activeConv.user._id);

    try {
      const res  = await fetch(`${API}/api/messages/upload`, {
        method:  'POST',
        headers: { Authorization: `Bearer ${token}` }, // no Content-Type for FormData
        body:    formData,
      });
      const data = await res.json();
      if (res.ok) {
        setMessages(prev => prev.find(m => m._id === data._id) ? prev : [...prev, data]);
        setSelectedFile(null);
        loadConversations();
      }
    } catch {}
    setUploading(false);
  };

  // ── File picker ──
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const isImage = file.type.startsWith('image/');
    setSelectedFile({
      file,
      preview: isImage ? URL.createObjectURL(file) : null,
      type:    isImage ? 'image' : 'file',
      name:    file.name,
    });
  };

  // ── Accept / Decline request ──
  const handleAccept = async (senderId) => {
    await fetch(`${API}/api/messages/accept/${senderId}`, { method: 'PATCH', headers });
    setLocked(false);
    loadMessages(senderId);
    loadConversations();
  };

  const handleDecline = async (senderId) => {
    await fetch(`${API}/api/messages/decline/${senderId}`, { method: 'DELETE', headers });
    setActiveConv(null);
    setMessages([]);
    loadConversations();
    setShowMobileChat(false);
  };

  // ── Filter ──
  const filtered  = conversations.filter(c => c.user.name.toLowerCase().includes(search.toLowerCase()));
  const requests  = filtered.filter(c => c.isRequest);
  const regular   = filtered.filter(c => !c.isRequest);
  const totalUnread = conversations.reduce((sum, c) => sum + (c.unread || 0), 0);

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <Loader size={28} className="animate-spin text-brandOrange" />
    </div>
  );

  return (
    <div className="h-[calc(100vh-180px)] min-h-[500px] bg-white rounded-2xl border border-gray-100 flex overflow-hidden shadow-sm">

      {/* ════ LEFT: Conversation List ════ */}
      <div className={`${showMobileChat ? 'hidden' : 'flex'} md:flex w-full md:w-[300px] flex-col border-r border-gray-100 bg-white shrink-0`}>

        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b border-gray-50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-800 text-sm">Messages</h3>
            {totalUnread > 0 && (
              <span className="bg-brandOrange text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                {totalUnread} new
              </span>
            )}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={14} />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full bg-gray-50 pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none border border-gray-100 focus:border-brandOrange/30 placeholder-gray-400 transition"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Message Requests */}
          {requests.length > 0 && (
            <div>
              <div className="px-4 py-2 bg-amber-50 border-b border-amber-100">
                <p className="text-xs font-bold text-amber-600 flex items-center gap-1.5">
                  <MessageSquare size={11} /> Message Requests ({requests.length})
                </p>
              </div>
              {requests.map(conv => (
                <ConvRow key={conv.user._id} conv={conv} active={activeConv?.user._id === conv.user._id} onClick={() => openConversation(conv)} isRequest />
              ))}
            </div>
          )}

          {/* Regular conversations */}
          {regular.length === 0 && requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-52 text-center px-6">
              <MessageSquare size={36} className="mb-3 text-gray-200" />
              <p className="text-sm font-semibold text-gray-500">No messages yet</p>
              <p className="text-xs text-gray-400 mt-1">Message a trainer from the Find Trainers page</p>
            </div>
          ) : (
            regular.map(conv => (
              <ConvRow key={conv.user._id} conv={conv} active={activeConv?.user._id === conv.user._id} onClick={() => openConversation(conv)} />
            ))
          )}
        </div>
      </div>

      {/* ════ RIGHT: Chat Area ════ */}
      <div className={`${showMobileChat ? 'flex' : 'hidden'} md:flex flex-1 flex-col min-w-0`}>

        {!activeConv ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <MessageSquare size={48} className="mb-4 text-gray-200" />
            <p className="text-base font-semibold text-gray-500">Select a conversation</p>
            <p className="text-sm mt-1 text-gray-400">Choose someone to start chatting</p>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-3">
                <button className="md:hidden text-gray-400 mr-1" onClick={() => setShowMobileChat(false)}>
                  <ArrowLeft size={18} />
                </button>
                <div className="w-9 h-9 rounded-full bg-brandOrange flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {activeConv.user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-gray-900">{activeConv.user.name}</h4>
                  <p className="text-[11px] text-gray-400 capitalize h-4">
                    {typingText || activeConv.user.role}
                  </p>
                </div>
              </div>
              {activeConv.isRequest && (
                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-1 rounded-full">
                  Message Request
                </span>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 bg-[#FAFBFC] flex flex-col gap-2">
              {messages.length === 0 && (
                <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                  No messages yet. Say hello!
                </div>
              )}
              {messages.map((msg, i) => {
                const isMine = msg.sender._id === user._id ||
                               msg.sender._id?.toString() === user._id?.toString();
                const showDate = i === 0 ||
                  new Date(messages[i-1].createdAt).toDateString() !== new Date(msg.createdAt).toDateString();

                return (
                  <div key={msg._id || i}>
                    {showDate && (
                      <div className="flex items-center gap-3 my-3">
                        <div className="flex-1 h-px bg-gray-100" />
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                          {new Date(msg.createdAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </span>
                        <div className="flex-1 h-px bg-gray-100" />
                      </div>
                    )}
                    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className="max-w-[70%]">
                        {/* Image message */}
                        {msg.fileType === 'image' && (
                          <div className={`rounded-2xl overflow-hidden border ${isMine ? 'border-orange-200' : 'border-gray-100'}`}>
                            <img
                              src={msg.fileUrl}
                              alt="sent image"
                              className="max-w-[240px] max-h-[240px] object-cover cursor-pointer"
                              onClick={() => window.open(msg.fileUrl, '_blank')}
                            />
                          </div>
                        )}

                        {/* PDF / file message */}
                        {(msg.fileType === 'pdf' || msg.fileType === 'file') && (
                          <a
                            href={msg.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex items-center gap-2 px-4 py-3 rounded-2xl border text-sm font-medium transition hover:opacity-80
                              ${isMine ? 'bg-brandOrange text-white border-orange-300' : 'bg-white border-gray-200 text-gray-700'}`}
                          >
                            <FileText size={16} />
                            <span className="truncate max-w-[160px]">{msg.fileName || 'File'}</span>
                          </a>
                        )}

                        {/* Text message */}
                        {msg.content && (
                          <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed
                            ${isMine
                              ? 'bg-brandOrange text-white rounded-tr-sm'
                              : 'bg-white border border-gray-100 text-gray-700 rounded-tl-sm shadow-sm'
                            }`}>
                            {msg.content}
                          </div>
                        )}

                        {/* Timestamp + read receipt */}
                        <div className={`flex items-center gap-1 mt-0.5 ${isMine ? 'justify-end' : 'justify-start'}`}>
                          <span className="text-[10px] text-gray-400">{timeLabel(msg.createdAt)}</span>
                          {isMine && (msg.read
                            ? <CheckCheck size={11} className="text-blue-400" />
                            : <Check size={11} className="text-gray-300" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* Accept / Decline bar for message requests */}
            {locked && activeConv.isRequest && (
              <div className="px-5 py-3 bg-amber-50 border-t border-amber-100 flex items-center gap-3 shrink-0">
                <p className="text-xs text-amber-700 font-medium flex-1">
                  <span className="font-bold">{activeConv.user.name}</span> sent you a message request.
                </p>
                <button onClick={() => handleAccept(activeConv.user._id)}
                  className="flex items-center gap-1.5 text-xs font-bold text-white bg-brandOrange px-3 py-1.5 rounded-lg hover:bg-orange-600 transition">
                  <UserCheck size={13} /> Accept
                </button>
                <button onClick={() => handleDecline(activeConv.user._id)}
                  className="flex items-center gap-1.5 text-xs font-bold text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition">
                  <UserX size={13} /> Decline
                </button>
              </div>
            )}

            {/* File preview bar */}
            {selectedFile && (
              <div className="px-4 py-3 bg-orange-50 border-t border-orange-100 flex items-center gap-3 shrink-0">
                {selectedFile.type === 'image' ? (
                  <img src={selectedFile.preview} alt="preview" className="w-12 h-12 rounded-lg object-cover border border-orange-200" />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-white border border-orange-200 flex items-center justify-center">
                    <FileText size={20} className="text-brandOrange" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-gray-700 truncate">{selectedFile.name}</p>
                  <p className="text-[10px] text-gray-400">{selectedFile.type === 'image' ? 'Image' : 'File'} — ready to send</p>
                </div>
                <button onClick={() => setSelectedFile(null)} className="text-gray-400 hover:text-red-500 transition">
                  <X size={16} />
                </button>
              </div>
            )}

            {/* Input — only if not a locked request */}
            {(!locked || !activeConv.isRequest) && (
              <div className="p-4 bg-white border-t border-gray-50 shrink-0">
                <div className="flex gap-2 items-center">
                  {/* File attachment button */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2.5 text-gray-400 hover:text-brandOrange hover:bg-orange-50 rounded-xl transition shrink-0"
                    title="Attach image or file"
                  >
                    <Paperclip size={18} />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf,.doc,.docx"
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  <input
                    type="text"
                    value={input}
                    onChange={handleTyping}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMsg()}
                    placeholder={selectedFile ? 'Add a caption (optional)...' : 'Type a message...'}
                    className="flex-1 bg-gray-50 px-4 py-3 rounded-xl text-sm outline-none border border-gray-100 focus:border-brandOrange/30 focus:ring-2 focus:ring-brandOrange/10 placeholder-gray-400 transition"
                  />

                  <button
                    onClick={sendMsg}
                    disabled={(!input.trim() && !selectedFile) || sending || uploading}
                    className="p-3 bg-brandOrange text-white rounded-xl hover:bg-orange-600 transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                  >
                    {(sending || uploading)
                      ? <Loader size={16} className="animate-spin" />
                      : <Send size={16} />}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Conversation Row Component ──
function ConvRow({ conv, active, onClick, isRequest }) {
  const lastMsg = conv.lastMessage;
  const preview = lastMsg?.fileType
    ? lastMsg.fileType === 'image' ? '📷 Image' : '📎 File'
    : lastMsg?.content || '';

  return (
    <button
      onClick={onClick}
      className={`w-full p-4 flex gap-3 text-left transition-all border-b border-gray-50
        ${active ? 'bg-brandOrange/[0.04] border-l-2 border-l-brandOrange' : 'hover:bg-gray-50'}`}
    >
      <div className="w-10 h-10 rounded-full bg-brandOrange flex items-center justify-center text-white font-bold text-sm shrink-0">
        {conv.user.name.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline">
          <h4 className={`font-semibold text-sm truncate ${active ? 'text-gray-900' : 'text-gray-700'}`}>
            {conv.user.name}
          </h4>
          <span className="text-[10px] text-gray-400 ml-2 shrink-0">
            {lastMsg ? timeLabel(lastMsg.createdAt) : ''}
          </span>
        </div>
        <p className="text-xs text-gray-400 truncate mt-0.5">
          {isRequest && <span className="text-amber-500 font-semibold">Request · </span>}
          {preview}
        </p>
      </div>
      {conv.unread > 0 && (
        <span className="mt-1 w-5 h-5 bg-brandOrange text-white text-[10px] font-bold rounded-full flex items-center justify-center shrink-0">
          {conv.unread}
        </span>
      )}
    </button>
  );
}