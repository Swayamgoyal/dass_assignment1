const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

// Load environment variables
dotenv.config();

const app = express();

// Create HTTP server and attach Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('✅ MongoDB Connected Successfully'))
  .catch((err) => console.error('❌ MongoDB Connection Error:', err));

// Basic route for testing
app.get('/', (req, res) => {
  res.json({ message: 'Felicity Event Management System API' });
});

// Seed admin account on startup
const seedAdmin = require('./scripts/seedAdmin');
mongoose.connection.once('open', async () => {
  await seedAdmin();
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/participant/onboarding', require('./routes/onboarding'));
app.use('/api/participant', require('./routes/participant'));
app.use('/api/organizer', require('./routes/organizer'));
app.use('/api/organizer/events', require('./routes/events'));
app.use('/api/events', require('./routes/publicEvents'));

// Registration routes
const { protectedRoutes, publicRoutes } = require('./routes/registrations');
app.use('/api/registrations', protectedRoutes);
app.use('/api/registrations', publicRoutes);

// Admin routes (Phase 7)
app.use('/api/admin', require('./routes/admin'));

// Team routes (Phase 8)
app.use('/api/teams', require('./routes/teams'));

// Feedback routes (Phase 8)
app.use('/api/feedback', require('./routes/feedback'));

// Chat routes (Phase 8 - Team Chat)
app.use('/api/chat', require('./routes/chat'));

// =============================================
// Socket.IO — Team Chat
// =============================================
const TeamMessage = require('./models/TeamMessage');
const Team = require('./models/Team');

// Socket.IO Authentication Middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication required'));
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId;
    socket.userName = decoded.firstName
      ? `${decoded.firstName} ${decoded.lastName || ''}`.trim()
      : 'User';
    next();
  } catch (err) {
    next(new Error('Invalid token'));
  }
});

// Track online users per team room
const teamOnlineUsers = new Map(); // teamId -> Set of { socketId, userId, userName }

io.on('connection', (socket) => {
  console.log(`🔌 Socket connected: ${socket.userId}`);

  // Join a team chat room
  socket.on('joinTeamRoom', async (teamId) => {
    try {
      // Verify membership
      const team = await Team.findById(teamId);
      if (!team) return socket.emit('error', { message: 'Team not found' });

      const isMember = team.members.some(
        m => m.participantId.toString() === socket.userId && m.status === 'accepted'
      );
      if (!isMember) return socket.emit('error', { message: 'Not a team member' });

      socket.join(`team_${teamId}`);
      socket.currentTeam = teamId;

      // Track online user
      if (!teamOnlineUsers.has(teamId)) {
        teamOnlineUsers.set(teamId, new Map());
      }
      teamOnlineUsers.get(teamId).set(socket.id, {
        userId: socket.userId,
        userName: socket.userName
      });

      // Broadcast online users to room
      const onlineList = Array.from(teamOnlineUsers.get(teamId).values());
      // Deduplicate by userId
      const unique = [...new Map(onlineList.map(u => [u.userId, u])).values()];
      io.to(`team_${teamId}`).emit('onlineUsers', unique);

      console.log(`👤 ${socket.userId} joined team room ${teamId}`);
    } catch (err) {
      console.error('Join room error:', err);
      socket.emit('error', { message: 'Failed to join room' });
    }
  });

  // Send a message
  socket.on('sendMessage', async ({ teamId, message }) => {
    try {
      if (!message || !message.trim()) return;
      if (!socket.currentTeam || socket.currentTeam !== teamId) return;

      // Save message to database
      const newMessage = new TeamMessage({
        teamId,
        senderId: socket.userId,
        senderName: socket.userName,
        message: message.trim(),
        messageType: 'text'
      });
      await newMessage.save();

      // Broadcast to all team members in the room
      io.to(`team_${teamId}`).emit('newMessage', {
        _id: newMessage._id,
        teamId: newMessage.teamId,
        senderId: newMessage.senderId,
        senderName: newMessage.senderName,
        message: newMessage.message,
        messageType: newMessage.messageType,
        timestamp: newMessage.timestamp
      });
    } catch (err) {
      console.error('Send message error:', err);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Typing indicators
  socket.on('typing', (teamId) => {
    socket.to(`team_${teamId}`).emit('userTyping', {
      userId: socket.userId,
      userName: socket.userName
    });
  });

  socket.on('stopTyping', (teamId) => {
    socket.to(`team_${teamId}`).emit('userStoppedTyping', {
      userId: socket.userId
    });
  });

  // Leave room
  socket.on('leaveTeamRoom', (teamId) => {
    socket.leave(`team_${teamId}`);
    if (teamOnlineUsers.has(teamId)) {
      teamOnlineUsers.get(teamId).delete(socket.id);
      const onlineList = Array.from(teamOnlineUsers.get(teamId).values());
      const unique = [...new Map(onlineList.map(u => [u.userId, u])).values()];
      io.to(`team_${teamId}`).emit('onlineUsers', unique);
    }
    socket.currentTeam = null;
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log(`🔌 Socket disconnected: ${socket.userId}`);
    // Clean up from all team rooms
    if (socket.currentTeam) {
      const teamId = socket.currentTeam;
      if (teamOnlineUsers.has(teamId)) {
        teamOnlineUsers.get(teamId).delete(socket.id);
        const onlineList = Array.from(teamOnlineUsers.get(teamId).values());
        const unique = [...new Map(onlineList.map(u => [u.userId, u])).values()];
        io.to(`team_${teamId}`).emit('onlineUsers', unique);
      }
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
