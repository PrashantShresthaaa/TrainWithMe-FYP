const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

dotenv.config();
connectDB();

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: { origin: 'http://localhost:5173', methods: ['GET', 'POST'] },
});

app.set('io', io);

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/trainers', require('./routes/trainerRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/sessions', require('./routes/sessionRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// Error handlers must come after routes
app.use(notFound);
app.use(errorHandler);

// Socket.io
io.on('connection', (socket) => {
  socket.on('join', (userId) => {
    socket.join(userId);
  });

  socket.on('typing', ({ toUserId, fromUserName }) => {
    io.to(toUserId).emit('typing', { fromUserName });
  });

  socket.on('stop_typing', ({ toUserId }) => {
    io.to(toUserId).emit('stop_typing');
  });

  socket.on(
    'call:initiate',
    ({ toUserId, fromUserId, fromUserName, roomId, isOfficialSession }) => {
      io.to(toUserId).emit('call:incoming', {
        fromUserId,
        fromUserName,
        roomId,
        isOfficialSession: isOfficialSession || false,
      });
    }
  );

  socket.on(
    'call:accepted',
    ({ toUserId, roomId, remoteUserId, remoteUserName, isOfficialSession }) => {
      io.to(toUserId).emit('call:accepted', {
        roomId,
        remoteUserId,
        remoteUserName,
        isOfficialSession,
      });
    }
  );

  socket.on('call:declined', ({ toUserId, roomId, fromUserName }) => {
    io.to(toUserId).emit('call:declined', { roomId, fromUserName });
  });

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

  socket.on('call:end', ({ toUserId, roomId }) => {
    io.to(toUserId).emit('call:end', { roomId });
  });

  socket.on('disconnect', () => {});
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));
