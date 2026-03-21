import { useEffect, useRef, useState, useCallback } from 'react';
import { PhoneOff, Mic, MicOff, Video, VideoOff, Maximize, Minimize, AlertCircle } from 'lucide-react';
import { io } from 'socket.io-client';

const API = 'http://localhost:5000';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

// Progressive media fallback
async function getMediaWithFallback() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    return { stream, mode: 'full' };
  } catch {}
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
    return { stream, mode: 'audio-only' };
  } catch {}
  const ctx  = new AudioContext();
  const dest = ctx.createMediaStreamDestination();
  return { stream: dest.stream, mode: 'dummy' };
}

/**
 * VideoCallPage
 *
 * This component is rendered on a dedicated /call route (new browser tab).
 * It reads all call parameters from sessionStorage:
 *   callParams = { roomId, remoteUserId, remoteUserName, isInitiator, isOfficialSession }
 * It connects its own socket, does WebRTC, and when done closes the tab.
 */
export default function VideoCallPage() {
  const localVideoRef  = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerRef        = useRef(null);
  const localStreamRef = useRef(null);
  const socketRef      = useRef(null);
  const endedRef       = useRef(false);
  const failTimerRef   = useRef(null);

  const [callStatus, setCallStatus] = useState('connecting');
  const [mediaMode,  setMediaMode]  = useState('full');
  const [micOn,  setMicOn]  = useState(true);
  const [camOn,  setCamOn]  = useState(true);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [params, setParams] = useState(null);
  const timerRef = useRef(null);

  // Read call params from URL query string (sessionStorage not shared across windows)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomId            = urlParams.get('roomId');
    const remoteUserId      = urlParams.get('remoteUserId');
    const remoteUserName    = urlParams.get('remoteUserName');
    const isInitiator       = urlParams.get('isInitiator') === '1';
    const isOfficialSession = urlParams.get('isOfficialSession') === '1';
    const currentUserId     = urlParams.get('currentUserId');
    const currentUserName   = urlParams.get('currentUserName');
    const token             = urlParams.get('token');

    if (!roomId || !remoteUserId) {
      document.title = 'Invalid call link';
      return;
    }

    // Store token in localStorage so API calls work in this tab
    const existing = JSON.parse(localStorage.getItem('user') || '{}');
    if (!existing.token && token) {
      localStorage.setItem('user', JSON.stringify({
        ...existing,
        _id:   currentUserId,
        name:  currentUserName,
        token,
      }));
    }

    setParams({ roomId, remoteUserId, remoteUserName, isInitiator, isOfficialSession, currentUserId, currentUserName });
    document.title = `Call with ${remoteUserName}`;
  }, []);

  const token = JSON.parse(localStorage.getItem('user'))?.token;
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  // Duration timer
  useEffect(() => {
    if (callStatus === 'live') {
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [callStatus]);

  const fmt = (s) => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;

  const buildPeer = useCallback((stream, remoteUserId, roomId) => {
    const peer = new RTCPeerConnection(ICE_SERVERS);
    stream.getTracks().forEach(track => peer.addTrack(track, stream));

    peer.onicecandidate = ({ candidate }) => {
      if (candidate && socketRef.current) {
        socketRef.current.emit('webrtc:ice_candidate', { toUserId: remoteUserId, candidate, roomId });
      }
    };

    peer.ontrack = (event) => {
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
        setCallStatus('live');
      }
    };

    peer.oniceconnectionstatechange = () => {
      const state = peer.iceConnectionState;
      if (state === 'connected' || state === 'completed') {
        clearTimeout(failTimerRef.current);
        setCallStatus('live');
      }
      if (state === 'failed') {
        failTimerRef.current = setTimeout(() => {
          if (peer.iceConnectionState === 'failed') handleEndCall();
        }, 3000);
      }
    };

    return peer;
  }, []);

  // Main init — runs after params are loaded
  useEffect(() => {
    if (!params) return;
    let active = true;

    const socket = io(API, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', async () => {
      if (!active) return;
      socket.emit('join', params.currentUserId);

      // Get media
      const { stream, mode } = await getMediaWithFallback();
      if (!active) { stream.getTracks().forEach(t => t.stop()); return; }

      localStreamRef.current = stream;
      setMediaMode(mode);
      if (localVideoRef.current && mode === 'full') {
        localVideoRef.current.srcObject = stream;
      }

      peerRef.current = buildPeer(stream, params.remoteUserId, params.roomId);

      if (params.isOfficialSession) {
        const tok = JSON.parse(localStorage.getItem('user'))?.token;
        try {
          await fetch(`${API}/api/sessions/${params.roomId}/join`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok}` }
          });
        } catch {}
      }

      socket.emit('webrtc:ready', { toUserId: params.remoteUserId, roomId: params.roomId });
    });

      // Signaling
      socket.on('webrtc:ready', async ({ roomId: r }) => {
        if (r !== params.roomId || !params.isInitiator || !peerRef.current) return;
        const offer = await peerRef.current.createOffer();
        await peerRef.current.setLocalDescription(offer);
        socket.emit('webrtc:offer', { toUserId: params.remoteUserId, offer, roomId: params.roomId });
      });

      socket.on('webrtc:offer', async ({ offer, roomId: r }) => {
        if (r !== params.roomId || params.isInitiator || !peerRef.current) return;
        await peerRef.current.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peerRef.current.createAnswer();
        await peerRef.current.setLocalDescription(answer);
        socket.emit('webrtc:answer', { toUserId: params.remoteUserId, answer, roomId: params.roomId });
      });

      socket.on('webrtc:answer', async ({ answer, roomId: r }) => {
        if (r !== params.roomId || !params.isInitiator || !peerRef.current) return;
        await peerRef.current.setRemoteDescription(new RTCSessionDescription(answer));
      });

      socket.on('webrtc:ice_candidate', async ({ candidate, roomId: r }) => {
        if (r !== params.roomId || !peerRef.current || !candidate) return;
        try { await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate)); } catch {}
      });

      socket.on('call:end', ({ roomId: r }) => {
        if (r !== params.roomId) return;
        handleEndCall();
      });

    return () => {
      active = false;
      socket.disconnect();
    };
  }, [params]);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleEndCall = useCallback(async () => {
    if (endedRef.current) return;
    endedRef.current = true;
    setCallStatus('ended');
    clearInterval(timerRef.current);
    clearTimeout(failTimerRef.current);

    // Release camera and mic
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }
    peerRef.current?.close();

    if (socketRef.current && params) {
      socketRef.current.emit('call:end', { toUserId: params.remoteUserId, roomId: params.roomId });
    }

    if (params?.isOfficialSession) {
      try { await fetch(`${API}/api/sessions/${params.roomId}/end`, { method: 'PATCH', headers }); } catch {}
    }

    // Close tab after showing "ended" for 2 seconds
    setTimeout(() => window.close(), 2000);
  }, [params]);

  const toggleMic = () => {
    localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
    setMicOn(p => !p);
  };

  const toggleCam = () => {
    localStreamRef.current?.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
    setCamOn(p => !p);
  };

  if (!params) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <p>Loading call...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-900 select-none">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-gray-800 shrink-0">
        <div>
          <p className="text-white font-bold">{params.remoteUserName}</p>
          <p className="text-xs text-gray-400">
            {callStatus === 'connecting' && 'Connecting...'}
            {callStatus === 'live'       && `Live · ${fmt(duration)}`}
            {callStatus === 'ended'      && 'Call ended'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {mediaMode !== 'full' && (
            <span className="bg-amber-500/20 text-amber-400 text-xs font-bold px-3 py-1 rounded-full border border-amber-500/30 flex items-center gap-1">
              <AlertCircle size={12} />
              {mediaMode === 'dummy' ? 'Test mode' : 'Audio only'}
            </span>
          )}
          {params.isOfficialSession && (
            <span className="bg-green-500/20 text-green-400 text-xs font-bold px-3 py-1 rounded-full border border-green-500/30">
              Official Session
            </span>
          )}
          <button onClick={toggleFullscreen} className="text-gray-400 hover:text-white transition p-2 rounded-lg hover:bg-gray-700">
            {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
          </button>
        </div>
      </div>

      {/* Video area */}
      <div className="relative flex-1 bg-black overflow-hidden">
        <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />

        {callStatus === 'connecting' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800">
            <div className="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center mb-4 ring-4 ring-brandOrange/30 ring-offset-4 ring-offset-gray-800 animate-pulse">
              <span className="text-4xl font-bold text-white">
                {params.remoteUserName?.charAt(0).toUpperCase()}
              </span>
            </div>
            <p className="text-white font-semibold text-lg">{params.remoteUserName}</p>
            <p className="text-gray-400 text-sm mt-2 animate-pulse">Connecting...</p>
            {mediaMode !== 'full' && (
              <p className="text-amber-400 text-xs mt-3 bg-amber-500/10 px-4 py-2 rounded-full">
                {mediaMode === 'dummy' ? 'Camera & mic unavailable — test mode' : 'Running in audio-only mode'}
              </p>
            )}
          </div>
        )}

        {/* Local PiP */}
        {mediaMode === 'full' && (
          <div className="absolute bottom-6 right-6 w-48 rounded-2xl overflow-hidden border-2 border-gray-600 shadow-2xl bg-gray-800">
            <video ref={localVideoRef} autoPlay playsInline muted className="w-full object-cover" />
            {!camOn && (
              <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                <VideoOff size={24} className="text-gray-400" />
              </div>
            )}
            <div className="absolute bottom-2 left-2 text-[10px] text-white bg-black/50 px-1.5 py-0.5 rounded font-bold">
              You
            </div>
          </div>
        )}

        {mediaMode === 'audio-only' && (
          <div className="absolute bottom-6 right-6 w-16 h-16 rounded-full bg-gray-700 border-2 border-gray-600 flex items-center justify-center shadow-xl">
            <Mic size={24} className={micOn ? 'text-white' : 'text-red-400'} />
          </div>
        )}

        {callStatus === 'ended' && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center">
            <p className="text-white font-bold text-2xl mb-2">Call ended</p>
            <p className="text-gray-400 text-sm">This tab will close automatically...</p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-6 py-6 bg-gray-900 shrink-0">
        <div className="flex flex-col items-center gap-1">
          <button onClick={toggleMic}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition shadow-lg
              ${micOn ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-red-500 text-white hover:bg-red-600'}`}>
            {micOn ? <Mic size={22} /> : <MicOff size={22} />}
          </button>
          <span className="text-[10px] text-gray-500">{micOn ? 'Mute' : 'Unmute'}</span>
        </div>

        <div className="flex flex-col items-center gap-1">
          <button onClick={handleEndCall}
            className="w-18 h-18 w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition shadow-xl ring-4 ring-red-500/30">
            <PhoneOff size={28} />
          </button>
          <span className="text-[10px] text-gray-500">End Call</span>
        </div>

        {mediaMode === 'full' && (
          <div className="flex flex-col items-center gap-1">
            <button onClick={toggleCam}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition shadow-lg
                ${camOn ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-red-500 text-white hover:bg-red-600'}`}>
              {camOn ? <Video size={22} /> : <VideoOff size={22} />}
            </button>
            <span className="text-[10px] text-gray-500">{camOn ? 'Stop Video' : 'Start Video'}</span>
          </div>
        )}
      </div>
    </div>
  );
}