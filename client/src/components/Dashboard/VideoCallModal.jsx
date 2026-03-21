import { useEffect, useRef, useState, useCallback } from 'react';
import { PhoneOff, Mic, MicOff, Video, VideoOff, Minimize2, AlertCircle } from 'lucide-react';

const API = 'http://localhost:5000';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

// Try to get media with progressive fallback:
// 1. video + audio
// 2. audio only (camera busy)
// 3. silent dummy stream (mic also busy — happens in same-device testing)
async function getMediaWithFallback() {
  // Try full video+audio
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    return { stream, mode: 'full' };
  } catch {}

  // Try audio only
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
    return { stream, mode: 'audio-only' };
  } catch {}

  // Create a silent dummy stream — allows WebRTC to work without any real device
  // This is fine for same-device local testing
  const ctx    = new AudioContext();
  const dest   = ctx.createMediaStreamDestination();
  const stream = dest.stream;
  return { stream, mode: 'dummy' };
}

export default function VideoCallModal({
  socket,
  currentUser,
  remoteUser,
  roomId,
  isInitiator,
  isOfficialSession,
  onClose,
}) {
  const localVideoRef  = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerRef        = useRef(null);
  const localStreamRef = useRef(null);
  const endedRef       = useRef(false);
  const failTimerRef   = useRef(null);

  const [callStatus, setCallStatus] = useState('connecting');
  const [mediaMode,  setMediaMode]  = useState('full'); // full | audio-only | dummy
  const [micOn,  setMicOn]  = useState(true);
  const [camOn,  setCamOn]  = useState(true);
  const [duration, setDuration] = useState(0);
  const timerRef = useRef(null);

  const token   = JSON.parse(localStorage.getItem('user'))?.token;
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (callStatus === 'live') {
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [callStatus]);

  const fmt = (s) => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;

  const buildPeer = useCallback((stream) => {
    const peer = new RTCPeerConnection(ICE_SERVERS);

    stream.getTracks().forEach(track => peer.addTrack(track, stream));

    peer.onicecandidate = ({ candidate }) => {
      if (candidate) {
        socket.emit('webrtc:ice_candidate', { toUserId: remoteUser._id, candidate, roomId });
      }
    };

    peer.ontrack = (event) => {
      console.log('📺 Remote track received');
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
        setCallStatus('live');
      }
    };

    peer.oniceconnectionstatechange = () => {
      const state = peer.iceConnectionState;
      console.log('ICE:', state);

      if (state === 'connected' || state === 'completed') {
        clearTimeout(failTimerRef.current);
        setCallStatus('live');
      }

      if (state === 'failed') {
        failTimerRef.current = setTimeout(() => {
          if (peer.iceConnectionState === 'failed') handleEndCall();
        }, 3000);
      }
      // intentionally NOT ending on 'disconnected' — transient on same device
    };

    return peer;
  }, [socket, remoteUser._id, roomId]);

  // Init
  useEffect(() => {
    let active = true;

    const init = async () => {
      const { stream, mode } = await getMediaWithFallback();
      if (!active) { stream.getTracks().forEach(t => t.stop()); return; }

      console.log('🎥 Media acquired, mode:', mode);
      setMediaMode(mode);
      localStreamRef.current = stream;

      if (localVideoRef.current && mode === 'full') {
        localVideoRef.current.srcObject = stream;
      }

      peerRef.current = buildPeer(stream);
      console.log('✅ Peer built. isInitiator:', isInitiator);

      if (isOfficialSession) {
        try { await fetch(`${API}/api/sessions/${roomId}/join`, { method: 'PATCH', headers }); } catch {}
      }

      socket.emit('webrtc:ready', { toUserId: remoteUser._id, roomId });
    };

    init();
    return () => { active = false; };
  }, []);

  // Signaling
  useEffect(() => {
    const handleReady = async ({ roomId: r }) => {
      if (r !== roomId || !isInitiator || !peerRef.current) return;
      console.log('📡 Ready received — sending offer');
      try {
        const offer = await peerRef.current.createOffer();
        await peerRef.current.setLocalDescription(offer);
        socket.emit('webrtc:offer', { toUserId: remoteUser._id, offer, roomId });
      } catch (e) { console.error('createOffer:', e); }
    };

    const handleOffer = async ({ offer, roomId: r }) => {
      if (r !== roomId || isInitiator || !peerRef.current) return;
      console.log('📥 Offer received — sending answer');
      try {
        await peerRef.current.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peerRef.current.createAnswer();
        await peerRef.current.setLocalDescription(answer);
        socket.emit('webrtc:answer', { toUserId: remoteUser._id, answer, roomId });
      } catch (e) { console.error('handleOffer:', e); }
    };

    const handleAnswer = async ({ answer, roomId: r }) => {
      if (r !== roomId || !isInitiator || !peerRef.current) return;
      console.log('📥 Answer received');
      try {
        await peerRef.current.setRemoteDescription(new RTCSessionDescription(answer));
      } catch (e) { console.error('handleAnswer:', e); }
    };

    const handleIce = async ({ candidate, roomId: r }) => {
      if (r !== roomId || !peerRef.current || !candidate) return;
      try { await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate)); } catch {}
    };

    const handleCallEnd = ({ roomId: r }) => {
      if (r !== roomId) return;
      handleEndCall();
    };

    socket.on('webrtc:ready',         handleReady);
    socket.on('webrtc:offer',         handleOffer);
    socket.on('webrtc:answer',        handleAnswer);
    socket.on('webrtc:ice_candidate', handleIce);
    socket.on('call:end',             handleCallEnd);

    return () => {
      socket.off('webrtc:ready',         handleReady);
      socket.off('webrtc:offer',         handleOffer);
      socket.off('webrtc:answer',        handleAnswer);
      socket.off('webrtc:ice_candidate', handleIce);
      socket.off('call:end',             handleCallEnd);
    };
  }, [socket, roomId, isInitiator, remoteUser._id]);

  const handleEndCall = useCallback(async () => {
    if (endedRef.current) return;
    endedRef.current = true;
    setCallStatus('ended');
    clearInterval(timerRef.current);
    clearTimeout(failTimerRef.current);

    localStreamRef.current?.getTracks().forEach(t => t.stop());
    peerRef.current?.close();

    socket.emit('call:end', { toUserId: remoteUser._id, roomId });

    if (isOfficialSession) {
      try { await fetch(`${API}/api/sessions/${roomId}/end`, { method: 'PATCH', headers }); } catch {}
    }

    setTimeout(onClose, 1500);
  }, [socket, remoteUser._id, roomId, isOfficialSession, onClose]);

  const toggleMic = () => {
    localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
    setMicOn(p => !p);
  };

  const toggleCam = () => {
    localStreamRef.current?.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
    setCamOn(p => !p);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl mx-4 bg-gray-900 rounded-3xl overflow-hidden shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gray-800">
          <div>
            <p className="text-white font-bold text-sm">{remoteUser.name}</p>
            <p className="text-xs text-gray-400">
              {callStatus === 'connecting' && 'Connecting...'}
              {callStatus === 'live'       && `Live · ${fmt(duration)}`}
              {callStatus === 'ended'      && 'Call ended'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {mediaMode === 'audio-only' && (
              <span className="bg-amber-500/20 text-amber-400 text-[10px] font-bold px-2 py-1 rounded-full border border-amber-500/30 flex items-center gap-1">
                <AlertCircle size={10} /> Audio only
              </span>
            )}
            {mediaMode === 'dummy' && (
              <span className="bg-amber-500/20 text-amber-400 text-[10px] font-bold px-2 py-1 rounded-full border border-amber-500/30 flex items-center gap-1">
                <AlertCircle size={10} /> No media (test mode)
              </span>
            )}
            {isOfficialSession && (
              <span className="bg-green-500/20 text-green-400 text-[10px] font-bold px-2 py-1 rounded-full border border-green-500/30">
                Official Session
              </span>
            )}
            <button onClick={onClose} className="text-gray-400 hover:text-white transition">
              <Minimize2 size={18} />
            </button>
          </div>
        </div>

        {/* Video */}
        <div className="relative bg-black" style={{ aspectRatio: '16/9' }}>
          <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />

          {callStatus === 'connecting' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800">
              <div className="w-20 h-20 rounded-full bg-gray-700 flex items-center justify-center mb-3">
                <span className="text-3xl font-bold text-white">
                  {remoteUser.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <p className="text-white font-semibold text-sm">{remoteUser.name}</p>
              <p className="text-gray-400 text-xs mt-1 animate-pulse">Connecting...</p>
              {mediaMode !== 'full' && (
                <p className="text-amber-400 text-xs mt-2">
                  {mediaMode === 'dummy'
                    ? 'Camera & mic unavailable — running in test mode'
                    : 'Camera unavailable — audio only'}
                </p>
              )}
            </div>
          )}

          {/* Local PiP */}
          {mediaMode === 'full' && (
            <div className="absolute bottom-4 right-4 w-32 rounded-xl overflow-hidden border-2 border-gray-700 shadow-lg bg-gray-800">
              <video ref={localVideoRef} autoPlay playsInline muted className="w-full object-cover" />
              {!camOn && (
                <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                  <VideoOff size={20} className="text-gray-400" />
                </div>
              )}
            </div>
          )}

          {/* Audio-only local indicator */}
          {mediaMode === 'audio-only' && (
            <div className="absolute bottom-4 right-4 w-16 h-16 rounded-full bg-gray-700 border-2 border-gray-600 flex items-center justify-center">
              <Mic size={20} className={micOn ? 'text-white' : 'text-red-400'} />
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 py-5 bg-gray-900">
          <button onClick={toggleMic}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition
              ${micOn ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-red-500 text-white'}`}>
            {micOn ? <Mic size={20} /> : <MicOff size={20} />}
          </button>

          <button onClick={handleEndCall}
            className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition shadow-lg">
            <PhoneOff size={24} />
          </button>

          {mediaMode === 'full' && (
            <button onClick={toggleCam}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition
                ${camOn ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-red-500 text-white'}`}>
              {camOn ? <Video size={20} /> : <VideoOff size={20} />}
            </button>
          )}
        </div>

        {callStatus === 'ended' && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center rounded-3xl">
            <p className="text-white font-bold text-lg">Call ended</p>
          </div>
        )}
      </div>
    </div>
  );
}