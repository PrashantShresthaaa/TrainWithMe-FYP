const express    = require('express');
const http       = require('http');
const { Server } = require('socket.io');
const dotenv     = require('dotenv');
const cors       = require('cors');
const connectDB  = require('./config/db');

dotenv.config();
connectDB();

const app        = express();
const httpServer = http.createServer(app);
const io         = new Server(httpServer, {
  cors: { origin: 'http://localhost:5173', methods: ['GET', 'POST'] },
});

app.set('io', io);

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/users',    require('./routes/userRoutes'));
app.use('/api/trainers', require('./routes/trainerRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/sessions', require('./routes/sessionRoutes'));

// Socket.io
io.on('connection', (socket) => {

  // User joins their personal room (for messages + calls)
  socket.on('join', (userId) => {
    socket.join(userId);
  });

  // Typing indicators
  socket.on('typing', ({ toUserId, fromUserName }) => {
    io.to(toUserId).emit('typing', { fromUserName });
  });
  socket.on('stop_typing', ({ toUserId }) => {
    io.to(toUserId).emit('stop_typing');
  });

  // ── WebRTC Signaling ──

  // Step 1: Caller rings the other person
  socket.on('call:initiate', ({ toUserId, fromUserId, fromUserName, roomId, isOfficialSession }) => {
    io.to(toUserId).emit('call:incoming', {
      fromUserId,
      fromUserName,
      roomId,
      isOfficialSession: isOfficialSession || false,
    });
  });

  // Step 2a: Callee picks up — forward remoteUser info so caller can open their tab
  socket.on('call:accepted', ({ toUserId, roomId, remoteUserId, remoteUserName, isOfficialSession }) => {
    io.to(toUserId).emit('call:accepted', { roomId, remoteUserId, remoteUserName, isOfficialSession });
  });

  // Step 2b: Callee rejects — forward name so caller sees who declined
  socket.on('call:declined', ({ toUserId, roomId, fromUserName }) => {
    io.to(toUserId).emit('call:declined', { roomId, fromUserName });
  });

  // Step 3: WebRTC negotiation — ready, offer, answer, ICE
  // Both sides signal ready first; initiator then sends offer
  socket.on('webrtc:ready', ({ toUserId, roomId }) => {
    io.to(toUserId).emit('webrtc:ready', { roomId });
  });

  socket.on('webrtc:offer', ({ toUserId, offer, roomId }) => {
    io.to(toUserId).emit('webrtc:offer', { offer, roomId, fromSocketId: socket.id });
  });

  socket.on('webrtc:answer', ({ toUserId, answer, roomId }) => {
    io.to(toUserId).emit('webrtc:answer', { answer, roomId });
  });

  socket.on('webrtc:ice_candidate', ({ toUserId, candidate, roomId }) => {
    io.to(toUserId).emit('webrtc:ice_candidate', { candidate, roomId });
  });

  // Step 4: Either party ends the call
  socket.on('call:end', ({ toUserId, roomId }) => {
    io.to(toUserId).emit('call:end', { roomId });
  });

  socket.on('disconnect', () => {});
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));