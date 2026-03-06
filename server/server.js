const express = require('express');
const dotenv  = require('dotenv');
const cors    = require('cors');
const http    = require('http');          // ← NEW
const { Server } = require('socket.io'); // ← NEW
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();

// ── Middleware ──
app.use(express.json());
app.use(cors());

// ── Routes ──
app.use('/api/users',    require('./routes/userRoutes'));
app.use('/api/trainers', require('./routes/trainerRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/messages', require('./routes/messageRoutes')); // ← NEW

app.get('/', (req, res) => res.send('TrainWithMe API is running...'));

// ── Error Handler ──
app.use((err, req, res, next) => {
  const statusCode = res.statusCode ? res.statusCode : 500;
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

// ── Create HTTP server & attach Socket.io ──
const httpServer = http.createServer(app);      // ← NEW: wrap express in http server

const io = new Server(httpServer, {             // ← NEW: create socket.io server
  cors: {
    origin: 'http://localhost:5173',            // your Vite frontend URL
    methods: ['GET', 'POST'],
  },
});

// Make io accessible inside controllers via req.app.get('io')
app.set('io', io);                              // ← NEW

// ── Socket.io connection handler ──
io.on('connection', (socket) => {
  console.log('🔌 Socket connected:', socket.id);

  // Each user joins a room named after their userId
  // Frontend emits: socket.emit('join', userId)
  socket.on('join', (userId) => {
    socket.join(userId);
    console.log(`👤 User ${userId} joined their room`);
  });

  // Typing indicators (optional but nice)
  socket.on('typing', ({ toUserId, fromUserName }) => {
    io.to(toUserId).emit('typing', { fromUserName });
  });

  socket.on('stop_typing', ({ toUserId }) => {
    io.to(toUserId).emit('stop_typing');
  });

  socket.on('disconnect', () => {
    console.log('❌ Socket disconnected:', socket.id);
  });
});

// ── Start server ──
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {               // ← use httpServer not app.listen
  console.log(`🚀 Server running on port ${PORT}`);
});