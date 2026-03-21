import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Send, Search, UserCheck, UserX, Loader, ArrowLeft,
  MessageSquare, Paperclip, X, FileText, CheckCheck, Check,
  Video, Phone, PhoneOff, MoreVertical, Mic, MicOff, Smile,
  Trash2, VolumeX, File, PhoneCall, PhoneMissed
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { io } from 'socket.io-client';

const API = 'http://localhost:5000';
let socket;

// ── Common emoji set ──
const EMOJIS = [
  '😀','😂','😍','🥰','😎','🤔','😅','😭','😤','🙏',
  '👍','👎','❤️','🔥','💪','🎉','✅','⚡','💯','🏋️',
  '🧘','🥊','🏃','💊','🥗','💤','📅','⏰','📞','🎯',
];

function timeLabel(dateStr) {
  const d = new Date(dateStr), now = new Date(), diff = now - d;
  if (diff < 60000)    return 'just now';
  if (diff < 3600000)  return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function fmtDuration(secs) {
  if (!secs) return '';
  return `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
}

export default function MessagesView({ preselectedTrainer = null }) {
  const { getToken, user } = useAuth();
  const getHeaders = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` });

  // ── State ──
  const [conversations,  setConversations]  = useState([]);
  const [activeConv,     setActiveConv]     = useState(null);
  const [messages,       setMessages]       = useState([]);
  const [locked,         setLocked]         = useState(false);
  const [input,          setInput]          = useState('');
  const [sending,        setSending]        = useState(false);
  const [loading,        setLoading]        = useState(true);
  const [search,         setSearch]         = useState('');
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [typingText,     setTypingText]     = useState('');
  const [selectedFile,   setSelectedFile]   = useState(null);
  const [uploading,      setUploading]      = useState(false);

  // ── Call state ──
  const [incomingCall,  setIncomingCall]  = useState(null);
  const [callDeclined,  setCallDeclined]  = useState(null);
  const ringtoneRef = useRef(null);

  // ── New feature states ──
  const [showEmoji,     setShowEmoji]     = useState(false);
  const [showMenu,      setShowMenu]      = useState(false);   // three dot menu
  const [msgSearch,     setMsgSearch]     = useState('');
  const [showMsgSearch, setShowMsgSearch] = useState(false);
  const [showFiles,     setShowFiles]     = useState(false);

  // ── Voice recording state ──
  const [recording,      setRecording]      = useState(false);
  const [audioBlob,       setAudioBlob]       = useState(null);
  const [recordSeconds,  setRecordSeconds]  = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef   = useRef([]);
  const recordTimerRef   = useRef(null);

  // ── Refs ──
  const bottomRef     = useRef(null);
  const fileInputRef  = useRef(null);
  const typingTimer   = useRef(null);
  const activeConvRef = useRef(null);
  const menuRef       = useRef(null);


  useEffect(() => { activeConvRef.current = activeConv; }, [activeConv]);

  // Close menu on outside click
  useEffect(() => {
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Load data ──
  const loadConversations = useCallback(async () => {
    try {
      const res  = await fetch(`${API}/api/messages/conversations`, { headers: getHeaders() });
      const data = await res.json();
      if (Array.isArray(data)) setConversations(data);
    } catch {}
    setLoading(false);
  }, []);

  const loadMessages = useCallback(async (otherId) => {
    try {
      const res  = await fetch(`${API}/api/messages/conversation/${otherId}`, { headers: getHeaders() });
      const data = await res.json();
      setLocked(data.locked || false);
      setMessages(data.messages || []);
    } catch {}
  }, []);

  // ── Auto-open from ExploreView ──
  useEffect(() => {
    if (!preselectedTrainer) return;
    const doOpen = async () => {
      const syntheticConv = { user: { _id: preselectedTrainer._id, name: preselectedTrainer.name, role: preselectedTrainer.role || 'trainer' }, lastMessage: null, unread: 0, isRequest: false };
      try {
        const res  = await fetch(`${API}/api/messages/conversation/${preselectedTrainer._id}`, { headers: getHeaders() });
        const data = await res.json();
        setLocked(data.locked || false);
        setMessages(data.messages || []);
      } catch { setMessages([]); setLocked(false); }
      setActiveConv(syntheticConv);
      setShowMobileChat(true);
    };
    doOpen();
  }, [preselectedTrainer]);

  // ── Ringtone helpers ──
  const playRingtone = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const ring = () => {
        const osc = ctx.createOscillator(), gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = 480; osc.type = 'sine';
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
        osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.8);
      };
      ring();
      ringtoneRef.current = { ctx, interval: setInterval(ring, 1500) };
    } catch {}
  };
  const stopRingtone = () => {
    if (!ringtoneRef.current) return;
    clearInterval(ringtoneRef.current.interval);
    try { ringtoneRef.current.ctx.close(); } catch {}
    ringtoneRef.current = null;
  };

  // ── Open call tab ──
  const openCallTab = (roomId, remoteUser, isInitiator, isOfficialSession) => {
    const cu = JSON.parse(localStorage.getItem('user') || '{}');
    const p  = new URLSearchParams({ roomId, remoteUserId: remoteUser._id, remoteUserName: remoteUser.name, isInitiator: isInitiator ? '1' : '0', isOfficialSession: isOfficialSession ? '1' : '0', currentUserId: cu._id, currentUserName: cu.name, token: cu.token });
    window.open(`/call?${p.toString()}`, '_blank', 'width=960,height=680,noopener');
  };

  // ── Save call log in chat ──
  const saveCallLog = async (receiverId, callStatus, callDuration) => {
    try {
      await fetch(`${API}/api/messages/calllog`, {
        method: 'POST', headers: getHeaders(),
        body: JSON.stringify({ receiverId, callStatus, callDuration }),
      });
    } catch {}
  };

  // ── Socket init ──
  useEffect(() => {
    loadConversations();
    socket = io(API, { transports: ['websocket'] });
    socket.on('connect', () => { socket.emit('join', user._id); });
    socket.on('new_message', (msg) => {
      const conv = activeConvRef.current;
      const otherId = conv?.user?._id;
      const partnerId = msg.sender._id === user._id ? msg.receiver._id : msg.sender._id;
      if (otherId && partnerId === otherId) {
        setMessages(prev => prev.find(m => m._id === msg._id) ? prev : [...prev, msg]);
      }
      loadConversations();
    });
    socket.on('typing',         ({ fromUserName }) => setTypingText(`${fromUserName} is typing...`));
    socket.on('stop_typing',    () => setTypingText(''));
    socket.on('request_accepted', () => {
      if (activeConvRef.current) { setLocked(false); loadMessages(activeConvRef.current.user._id); }
    });
    socket.on('call:incoming', ({ fromUserId, fromUserName, roomId, isOfficialSession }) => {
      setIncomingCall({ fromUserId, fromUserName, roomId, isOfficialSession });
      playRingtone();
      if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
        new Notification(`Incoming call from ${fromUserName}`, { body: 'TrainWithMe', icon: '/favicon.ico' });
      }
    });
    socket.on('call:declined', ({ fromUserName }) => {
      setCallDeclined({ name: fromUserName || 'They' });
      setTimeout(() => setCallDeclined(null), 4000);
    });
    socket.on('call:accepted', ({ roomId, remoteUserId, remoteUserName, isOfficialSession }) => {
      openCallTab(roomId, { _id: remoteUserId, name: remoteUserName }, true, isOfficialSession);
    });
    return () => socket.disconnect();
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // ── Call actions ──
  const startCall = () => {
    if (!activeConv) return;
    const roomId = `call-${user._id}-${activeConv.user._id}-${Date.now()}`;
    socket.emit('call:initiate', { toUserId: activeConv.user._id, fromUserId: user._id, fromUserName: user.name, roomId, isOfficialSession: false });
    openCallTab(roomId, activeConv.user, true, false);
    // Log call initiated in chat
    saveCallLog(activeConv.user._id, 'initiated', null);
  };

  const acceptCall = () => {
    if (!incomingCall) return;
    stopRingtone();
    const cu = JSON.parse(localStorage.getItem('user') || '{}');
    socket.emit('call:accepted', { toUserId: incomingCall.fromUserId, roomId: incomingCall.roomId, remoteUserId: cu._id, remoteUserName: cu.name, isOfficialSession: incomingCall.isOfficialSession });
    openCallTab(incomingCall.roomId, { _id: incomingCall.fromUserId, name: incomingCall.fromUserName }, false, incomingCall.isOfficialSession);
    saveCallLog(incomingCall.fromUserId, 'accepted', null);
    setIncomingCall(null);
  };

  const declineCall = () => {
    if (!incomingCall) return;
    stopRingtone();
    const cu = JSON.parse(localStorage.getItem('user') || '{}');
    socket.emit('call:declined', { toUserId: incomingCall.fromUserId, roomId: incomingCall.roomId, fromUserName: cu.name });
    saveCallLog(incomingCall.fromUserId, 'declined', null);
    setIncomingCall(null);
  };

  // ── Conversation actions ──

  // ── Save a call log message to the chat ──
  const sendCallLog = async (receiverId, callStatus, callDuration = null) => {
    try {
      await fetch(`${API}/api/messages/calllog`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ receiverId, callStatus, callDuration }),
      });
      loadConversations();
      if (activeConvRef.current?.user._id === receiverId) {
        loadMessages(receiverId);
      }
    } catch {}
  };

  // ── Start voice recording ──
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      audioChunksRef.current = [];
      mr.ondataavailable = e => audioChunksRef.current.push(e.data);
      mr.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (blob.size > 0) setAudioBlob(blob);
        setRecordSeconds(0);
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setRecording(true);
      recordTimerRef.current = setInterval(() => setRecordSeconds(s => s + 1), 1000);
    } catch { alert('Microphone access denied'); }
  };

  const stopRecording = () => {
    clearInterval(recordTimerRef.current);
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  const cancelRecording = () => {
    clearInterval(recordTimerRef.current);
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.ondataavailable = null;
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
    setRecordSeconds(0);
    setAudioBlob(null);
    audioChunksRef.current = [];
  };

  // ── Clear chat (UI only) ──
  const clearChat = () => {
    if (!activeConv || !window.confirm('Clear all messages from your view?')) return;
    setMessages([]);
    setShowMenu(false);
  };

  const openConversation = (conv) => {
    setActiveConv(conv); setShowMobileChat(true); setTypingText('');
    setSelectedFile(null); setShowEmoji(false); setShowMenu(false);
    setShowMsgSearch(false); setMsgSearch(''); setShowFiles(false);
    loadMessages(conv.user._id);
    setConversations(prev => prev.map(c => c.user._id === conv.user._id ? { ...c, unread: 0 } : c));
  };

  const handleTyping = (e) => {
    setInput(e.target.value);
    if (!activeConv) return;
    socket.emit('typing', { toUserId: activeConv.user._id, fromUserName: user.name });
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => socket.emit('stop_typing', { toUserId: activeConv.user._id }), 1500);
  };

  // ── Send text / emoji ──
  const sendMsg = async () => {
    if ((!input.trim() && !selectedFile) || !activeConv || sending) return;
    if (selectedFile) { await uploadFile(); return; }
    setSending(true);
    socket.emit('stop_typing', { toUserId: activeConv.user._id });
    try {
      const res  = await fetch(`${API}/api/messages`, { method: 'POST', headers: getHeaders(), body: JSON.stringify({ receiverId: activeConv.user._id, content: input.trim() }) });
      const data = await res.json();
      if (res.ok) { setMessages(prev => prev.find(m => m._id === data._id) ? prev : [...prev, data]); setInput(''); loadConversations(); }
    } catch {}
    setSending(false);
  };

  const sendEmoji = async (emoji) => {
    if (!activeConv) return;
    setShowEmoji(false);
    try {
      const res  = await fetch(`${API}/api/messages`, { method: 'POST', headers: getHeaders(), body: JSON.stringify({ receiverId: activeConv.user._id, content: emoji }) });
      const data = await res.json();
      if (res.ok) { setMessages(prev => prev.find(m => m._id === data._id) ? prev : [...prev, data]); loadConversations(); }
    } catch {}
  };

  // ── Upload file ──
  const uploadFile = async () => {
    if (!selectedFile || !activeConv) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile.file);
    formData.append('receiverId', activeConv.user._id);
    try {
      const res  = await fetch(`${API}/api/messages/upload`, { method: 'POST', headers: { Authorization: `Bearer ${getToken()}` }, body: formData });
      const data = await res.json();
      if (res.ok) { setMessages(prev => prev.find(m => m._id === data._id) ? prev : [...prev, data]); setSelectedFile(null); loadConversations(); }
    } catch {}
    setUploading(false);
  };

  // ── Upload voice ──
  const sendVoice = async () => {
    if (!audioBlob || !activeConv) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('voice', audioBlob, 'voice-message.webm');
    formData.append('receiverId', activeConv.user._id);
    formData.append('duration', String(recordSeconds));
    try {
      const res  = await fetch(`${API}/api/messages/voice`, { method: 'POST', headers: { Authorization: `Bearer ${getToken()}` }, body: formData });
      const data = await res.json();
      if (res.ok) { setMessages(prev => prev.find(m => m._id === data._id) ? prev : [...prev, data]); loadConversations(); }
    } catch {}
    setAudioBlob(null);
    setUploading(false);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const isImage = file.type.startsWith('image/');
    setSelectedFile({ file, preview: isImage ? URL.createObjectURL(file) : null, type: isImage ? 'image' : 'file', name: file.name });
  };

  // ── Accept/decline message request ──
  const handleAccept = async (senderId) => {
    await fetch(`${API}/api/messages/accept/${senderId}`, { method: 'PATCH', headers: getHeaders() });
    setLocked(false); loadMessages(senderId); loadConversations();
  };
  const handleDecline = async (senderId) => {
    await fetch(`${API}/api/messages/decline/${senderId}`, { method: 'DELETE', headers: getHeaders() });
    setActiveConv(null); setMessages([]); loadConversations(); setShowMobileChat(false);
  };

  // ── Filter ──
  const filtered   = conversations.filter(c => c.user.name.toLowerCase().includes(search.toLowerCase()));
  const requests   = filtered.filter(c => c.isRequest);
  const regular    = filtered.filter(c => !c.isRequest);
  const totalUnread = conversations.reduce((sum, c) => sum + (c.unread || 0), 0);

  // Message search filter
  const displayMessages = msgSearch.trim()
    ? messages.filter(m => m.content?.toLowerCase().includes(msgSearch.toLowerCase()))
    : messages;

  // Files only filter
  const fileMessages = messages.filter(m => m.fileType && m.fileType !== 'voice');

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <Loader size={28} className="animate-spin text-brandOrange" />
    </div>
  );

  return (
    <>
    <div className="h-[calc(100vh-180px)] min-h-[500px] bg-white rounded-2xl border border-gray-100 flex overflow-hidden shadow-sm">

      {/* ════ LEFT: Conversation List ════ */}
      <div className={`${showMobileChat ? 'hidden' : 'flex'} md:flex w-full md:w-[300px] flex-col border-r border-gray-100 bg-white shrink-0`}>
        <div className="px-4 pt-4 pb-3 border-b border-gray-50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-800 text-sm">Messages</h3>
            {totalUnread > 0 && <span className="bg-brandOrange text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{totalUnread} new</span>}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={14} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="w-full bg-gray-50 pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none border border-gray-100 focus:border-brandOrange/30 placeholder-gray-400 transition" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {requests.length > 0 && (
            <div>
              <div className="px-4 py-2 bg-amber-50 border-b border-amber-100">
                <p className="text-xs font-bold text-amber-600 flex items-center gap-1.5"><MessageSquare size={11} /> Message Requests ({requests.length})</p>
              </div>
              {requests.map(conv => <ConvRow key={conv.user._id} conv={conv} active={activeConv?.user._id === conv.user._id} onClick={() => openConversation(conv)} isRequest />)}
            </div>
          )}
          {regular.length === 0 && requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-52 text-center px-6">
              <MessageSquare size={36} className="mb-3 text-gray-200" />
              <p className="text-sm font-semibold text-gray-500">No messages yet</p>
              <p className="text-xs text-gray-400 mt-1">Message a trainer from the Find Trainers page</p>
            </div>
          ) : regular.map(conv => <ConvRow key={conv.user._id} conv={conv} active={activeConv?.user._id === conv.user._id} onClick={() => openConversation(conv)} />)}
        </div>
      </div>

      {/* ════ RIGHT: Chat Area ════ */}
      <div className={`${showMobileChat ? 'flex' : 'hidden'} md:flex flex-1 flex-col min-w-0 relative`}>

        {!activeConv ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <MessageSquare size={48} className="mb-4 text-gray-200" />
            <p className="text-base font-semibold text-gray-500">Select a conversation</p>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-3">
                <button className="md:hidden text-gray-400 mr-1" onClick={() => setShowMobileChat(false)}><ArrowLeft size={18} /></button>
                <div className="w-9 h-9 rounded-full bg-brandOrange flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {activeConv.user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-gray-900">{activeConv.user.name}</h4>
                  <p className="text-[11px] text-gray-400 capitalize h-4">{typingText || activeConv.user.role}</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {activeConv.isRequest && <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-1 rounded-full mr-2">Request</span>}
                {!activeConv.isRequest && (
                  <button onClick={startCall} title="Video call" className="w-9 h-9 rounded-full bg-gray-100 hover:bg-brandOrange hover:text-white text-gray-500 flex items-center justify-center transition">
                    <Video size={16} />
                  </button>
                )}
                {/* Three-dot menu */}
                <div className="relative" ref={menuRef}>
                  <button onClick={() => setShowMenu(p => !p)} className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition">
                    <MoreVertical size={16} />
                  </button>
                  {showMenu && (
                    <div className="absolute right-0 top-11 w-52 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-30">
                      <button onClick={() => { setShowMsgSearch(p => !p); setShowMenu(false); }} className="w-full px-4 py-2.5 text-sm text-left text-gray-700 hover:bg-gray-50 flex items-center gap-3">
                        <Search size={15} className="text-gray-400" /> Search messages
                      </button>
                      <button onClick={() => { setShowFiles(p => !p); setShowMenu(false); }} className="w-full px-4 py-2.5 text-sm text-left text-gray-700 hover:bg-gray-50 flex items-center gap-3">
                        <File size={15} className="text-gray-400" /> View shared files
                      </button>
                      <div className="border-t border-gray-100 my-1" />
                      <button onClick={clearChat} className="w-full px-4 py-2.5 text-sm text-left text-red-500 hover:bg-red-50 flex items-center gap-3">
                        <Trash2 size={15} /> Clear chat
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Message search bar */}
            {showMsgSearch && (
              <div className="px-4 py-2 border-b border-gray-100 bg-gray-50 shrink-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={14} />
                  <input autoFocus value={msgSearch} onChange={e => setMsgSearch(e.target.value)} placeholder="Search in conversation..." className="w-full bg-white pl-9 pr-4 py-2 rounded-xl text-sm outline-none border border-gray-200 focus:border-brandOrange/30" />
                  {msgSearch && <button onClick={() => setMsgSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"><X size={13} /></button>}
                </div>
                {msgSearch && <p className="text-[10px] text-gray-400 mt-1 pl-1">{displayMessages.length} result{displayMessages.length !== 1 ? 's' : ''}</p>}
              </div>
            )}

            {/* Shared files panel */}
            {showFiles && (
              <div className="border-b border-gray-100 bg-gray-50 shrink-0 max-h-48 overflow-y-auto">
                <div className="px-4 py-2 flex items-center justify-between">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Shared Files ({fileMessages.length})</p>
                  <button onClick={() => setShowFiles(false)} className="text-gray-400 hover:text-gray-600"><X size={14} /></button>
                </div>
                {fileMessages.length === 0 ? (
                  <p className="text-xs text-gray-400 px-4 pb-3">No files shared yet</p>
                ) : (
                  <div className="px-4 pb-3 flex flex-wrap gap-2">
                    {fileMessages.map(m => (
                      <a key={m._id} href={m.fileUrl} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-600 hover:border-brandOrange transition">
                        <FileText size={12} className="text-brandOrange shrink-0" />
                        <span className="truncate max-w-[120px]">{m.fileName || 'File'}</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 bg-[#FAFBFC] flex flex-col gap-2">
              {displayMessages.length === 0 && (
                <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                  {msgSearch ? 'No messages match your search' : 'No messages yet. Say hello!'}
                </div>
              )}
              {displayMessages.map((msg, i) => {
                const isMine = msg.sender._id === user._id || msg.sender._id?.toString() === user._id?.toString();
                const showDate = i === 0 || new Date(displayMessages[i-1].createdAt).toDateString() !== new Date(msg.createdAt).toDateString();

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

                    {/* Call log message */}
                    {msg.isCallLog ? (
                      <div className="flex justify-center my-1">
                        <div className="flex items-center gap-2 bg-gray-100 text-gray-500 text-xs font-medium px-4 py-1.5 rounded-full">
                          {msg.callStatus === 'declined' || msg.callStatus === 'missed'
                            ? <PhoneMissed size={13} className="text-red-400" />
                            : <PhoneCall size={13} className="text-green-500" />}
                          {msg.content}
                        </div>
                      </div>
                    ) : (
                      <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                        <div className="max-w-[70%]">
                          {/* Image */}
                          {msg.fileType === 'image' && (
                            <div className={`rounded-2xl overflow-hidden border ${isMine ? 'border-orange-200' : 'border-gray-100'}`}>
                              <img src={msg.fileUrl} alt="img" className="max-w-[240px] max-h-[240px] object-cover cursor-pointer" onClick={() => window.open(msg.fileUrl, '_blank')} />
                            </div>
                          )}
                          {/* Voice */}
                          {msg.fileType === 'voice' && (
                            <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl ${isMine ? 'bg-brandOrange text-white' : 'bg-white border border-gray-100 shadow-sm'}`}>
                              <Mic size={16} className={isMine ? 'text-white/80' : 'text-brandOrange'} />
                              <audio src={msg.fileUrl} controls className="h-8 max-w-[160px]" style={{ filter: isMine ? 'invert(1)' : 'none' }} />
                              {msg.fileDuration && <span className="text-[10px] opacity-70">{fmtDuration(msg.fileDuration)}</span>}
                            </div>
                          )}
                          {/* File */}
                          {(msg.fileType === 'pdf' || msg.fileType === 'file') && (
                            <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2 px-4 py-3 rounded-2xl border text-sm font-medium hover:opacity-80 ${isMine ? 'bg-brandOrange text-white border-orange-300' : 'bg-white border-gray-200 text-gray-700'}`}>
                              <FileText size={16} /><span className="truncate max-w-[160px]">{msg.fileName || 'File'}</span>
                            </a>
                          )}
                          {/* Text / Emoji */}
                          {msg.content && !msg.isCallLog && (
                            <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${isMine ? 'bg-brandOrange text-white rounded-tr-sm' : 'bg-white border border-gray-100 text-gray-700 rounded-tl-sm shadow-sm'}`}>
                              {msg.content}
                            </div>
                          )}
                          <div className={`flex items-center gap-1 mt-0.5 ${isMine ? 'justify-end' : 'justify-start'}`}>
                            <span className="text-[10px] text-gray-400">{timeLabel(msg.createdAt)}</span>
                            {isMine && (msg.read ? <CheckCheck size={11} className="text-blue-400" /> : <Check size={11} className="text-gray-300" />)}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* Accept/Decline bar */}
            {locked && activeConv.isRequest && (
              <div className="px-5 py-3 bg-amber-50 border-t border-amber-100 flex items-center gap-3 shrink-0">
                <p className="text-xs text-amber-700 font-medium flex-1"><span className="font-bold">{activeConv.user.name}</span> sent you a message request.</p>
                <button onClick={() => handleAccept(activeConv.user._id)} className="flex items-center gap-1.5 text-xs font-bold text-white bg-brandOrange px-3 py-1.5 rounded-lg hover:bg-orange-600 transition"><UserCheck size={13} /> Accept</button>
                <button onClick={() => handleDecline(activeConv.user._id)} className="flex items-center gap-1.5 text-xs font-bold text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition"><UserX size={13} /> Decline</button>
              </div>
            )}

            {/* File preview */}
            {selectedFile && (
              <div className="px-4 py-3 bg-orange-50 border-t border-orange-100 flex items-center gap-3 shrink-0">
                {selectedFile.type === 'image'
                  ? <img src={selectedFile.preview} alt="preview" className="w-12 h-12 rounded-lg object-cover border border-orange-200" />
                  : <div className="w-12 h-12 rounded-lg bg-white border border-orange-200 flex items-center justify-center"><FileText size={20} className="text-brandOrange" /></div>}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-gray-700 truncate">{selectedFile.name}</p>
                  <p className="text-[10px] text-gray-400">Ready to send</p>
                </div>
                <button onClick={() => setSelectedFile(null)} className="text-gray-400 hover:text-red-500"><X size={16} /></button>
              </div>
            )}

            {/* Voice recording bar */}
            {recording && (
              <div className="px-4 py-3 bg-red-50 border-t border-red-100 flex items-center gap-3 shrink-0">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-sm font-bold text-red-600 flex-1">Recording... {fmtDuration(recordSeconds)}</span>
                <button onClick={cancelRecording} className="text-xs font-bold text-gray-500 hover:text-red-500 bg-gray-100 px-3 py-1.5 rounded-lg">Cancel</button>
                <button onClick={stopRecording} className="text-xs font-bold text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-lg flex items-center gap-1.5"><MicOff size={13} /> Stop</button>
              </div>
            )}

            {/* Voice preview bar */}
            {audioBlob && !recording && (
              <div className="px-4 py-3 bg-orange-50 border-t border-orange-100 flex items-center gap-3 shrink-0">
                <Mic size={18} className="text-brandOrange shrink-0" />
                <audio src={URL.createObjectURL(audioBlob)} controls className="h-8 flex-1" />
                <button onClick={cancelRecording} className="text-gray-400 hover:text-red-500"><X size={16} /></button>
                <button onClick={sendVoice} disabled={uploading} className="text-xs font-bold text-white bg-brandOrange hover:bg-orange-600 px-3 py-1.5 rounded-lg flex items-center gap-1.5 disabled:opacity-50">
                  {uploading ? <Loader size={13} className="animate-spin" /> : <><Send size={13} /> Send</>}
                </button>
              </div>
            )}

            {/* Emoji picker */}
            {showEmoji && (
              <div className="absolute bottom-20 left-4 bg-white border border-gray-200 rounded-2xl shadow-2xl p-3 z-20 w-72">
                <div className="grid grid-cols-10 gap-1">
                  {EMOJIS.map(e => (
                    <button key={e} onClick={() => sendEmoji(e)} className="text-xl hover:bg-gray-100 rounded-lg p-1 transition leading-none">{e}</button>
                  ))}
                </div>
              </div>
            )}

            {/* Input bar */}
            {(!locked || !activeConv.isRequest) && !recording && !audioBlob && (
              <div className="p-4 bg-white border-t border-gray-50 shrink-0">
                <div className="flex gap-2 items-center">
                  {/* Emoji */}
                  <button onClick={() => setShowEmoji(p => !p)} className={`p-2.5 rounded-xl transition shrink-0 ${showEmoji ? 'text-brandOrange bg-orange-50' : 'text-gray-400 hover:text-brandOrange hover:bg-orange-50'}`}>
                    <Smile size={18} />
                  </button>
                  {/* File attach */}
                  <button onClick={() => fileInputRef.current?.click()} className="p-2.5 text-gray-400 hover:text-brandOrange hover:bg-orange-50 rounded-xl transition shrink-0">
                    <Paperclip size={18} />
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*,.pdf,.doc,.docx" onChange={handleFileSelect} className="hidden" />

                  <input type="text" value={input} onChange={handleTyping} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMsg()}
                    placeholder={selectedFile ? 'Add a caption...' : 'Type a message...'}
                    className="flex-1 bg-gray-50 px-4 py-3 rounded-xl text-sm outline-none border border-gray-100 focus:border-brandOrange/30 focus:ring-2 focus:ring-brandOrange/10 placeholder-gray-400 transition"
                    onClick={() => setShowEmoji(false)}
                  />

                  {/* Voice record — show when input is empty */}
                  {!input.trim() && !selectedFile && (
                    <button onMouseDown={startRecording} title="Hold to record voice message"
                      className="p-2.5 text-gray-400 hover:text-brandOrange hover:bg-orange-50 rounded-xl transition shrink-0">
                      <Mic size={18} />
                    </button>
                  )}

                  {/* Send */}
                  <button onClick={sendMsg} disabled={(!input.trim() && !selectedFile) || sending || uploading}
                    className="p-3 bg-brandOrange text-white rounded-xl hover:bg-orange-600 transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed shrink-0">
                    {(sending || uploading) ? <Loader size={16} className="animate-spin" /> : <Send size={16} />}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>

    {/* Call declined toast */}
    {callDeclined && (
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3">
        <PhoneOff size={18} className="text-red-400 shrink-0" />
        <p className="text-sm font-semibold">{callDeclined.name} declined the call</p>
      </div>
    )}

    {/* Incoming call overlay */}
    {incomingCall && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={e => e.stopPropagation()}>
        <div className="bg-gray-900 rounded-3xl p-8 shadow-2xl text-center max-w-sm w-full mx-4 border border-gray-700">
          <div className="relative w-24 h-24 mx-auto mb-5">
            <div className="absolute inset-0 rounded-full bg-brandOrange/20 animate-ping" />
            <div className="absolute inset-2 rounded-full bg-brandOrange/30 animate-ping" style={{ animationDelay: '0.2s' }} />
            <div className="relative w-24 h-24 rounded-full bg-brandOrange flex items-center justify-center">
              <Phone size={32} className="text-white" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-white mb-1">Incoming Call</h3>
          <p className="text-gray-400 text-sm mb-2">{incomingCall.fromUserName} is calling</p>
          {incomingCall.isOfficialSession && <span className="inline-block mb-4 text-xs font-bold bg-green-500/20 text-green-400 px-3 py-1 rounded-full border border-green-500/30">Official Session Call</span>}
          <p className="text-gray-500 text-xs mb-5">You must accept or decline to continue</p>
          <div className="flex gap-3">
            <button onClick={declineCall} className="flex-1 py-4 rounded-2xl bg-red-500/20 text-red-400 font-bold hover:bg-red-500/30 border border-red-500/30 transition flex items-center justify-center gap-2">
              <PhoneOff size={20} /> Decline
            </button>
            <button onClick={acceptCall} className="flex-1 py-4 rounded-2xl bg-green-500 text-white font-bold hover:bg-green-600 transition flex items-center justify-center gap-2">
              <Phone size={20} /> Accept
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

function ConvRow({ conv, active, onClick, isRequest }) {
  const lastMsg = conv.lastMessage;
  const preview = lastMsg?.isCallLog ? '📞 Call' : lastMsg?.fileType === 'voice' ? '🎤 Voice message' : lastMsg?.fileType === 'image' ? '📷 Image' : lastMsg?.fileType ? '📎 File' : lastMsg?.content || '';
  return (
    <button onClick={onClick} className={`w-full p-4 flex gap-3 text-left transition-all border-b border-gray-50 ${active ? 'bg-brandOrange/[0.04] border-l-2 border-l-brandOrange' : 'hover:bg-gray-50'}`}>
      <div className="w-10 h-10 rounded-full bg-brandOrange flex items-center justify-center text-white font-bold text-sm shrink-0">{conv.user.name.charAt(0).toUpperCase()}</div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline">
          <h4 className={`font-semibold text-sm truncate ${active ? 'text-gray-900' : 'text-gray-700'}`}>{conv.user.name}</h4>
          <span className="text-[10px] text-gray-400 ml-2 shrink-0">{lastMsg ? (() => { const d=new Date(lastMsg.createdAt),now=new Date(),diff=now-d; return diff<60000?'just now':diff<3600000?`${Math.floor(diff/60000)}m ago`:diff<86400000?d.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'}):d.toLocaleDateString('en-US',{month:'short',day:'numeric'}); })() : ''}</span>
        </div>
        <p className="text-xs text-gray-400 truncate mt-0.5">{isRequest && <span className="text-amber-500 font-semibold">Request · </span>}{preview}</p>
      </div>
      {conv.unread > 0 && <span className="mt-1 w-5 h-5 bg-brandOrange text-white text-[10px] font-bold rounded-full flex items-center justify-center shrink-0">{conv.unread}</span>}
    </button>
  );
}