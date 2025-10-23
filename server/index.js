const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/whiteboard';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Models
const BoardSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true },
  canvasData: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const MessageSchema = new mongoose.Schema({
  roomId: { type: String, required: true },
  username: { type: String, required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const Board = mongoose.model('Board', BoardSchema);
const Message = mongoose.model('Message', MessageSchema);

// Store active users per room
const activeUsers = new Map();

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join room
  socket.on('join-room', async (roomId, username) => {
    socket.join(roomId);
    socket.roomId = roomId;
    socket.username = username || `User-${socket.id.substring(0, 6)}`;

    // Add user to active users
    if (!activeUsers.has(roomId)) {
      activeUsers.set(roomId, new Map());
    }
    activeUsers.get(roomId).set(socket.id, {
      id: socket.id,
      username: socket.username,
      color: getRandomColor()
    });

    // Send current users to all clients in room
    io.to(roomId).emit('users-updated', Array.from(activeUsers.get(roomId).values()));

    // Load existing board data
    try {
      const board = await Board.findOne({ roomId });
      if (board) {
        socket.emit('board-loaded', board.canvasData);
      }
    } catch (error) {
      console.error('Error loading board:', error);
    }

    // Load recent messages
    try {
      const messages = await Message.find({ roomId }).sort({ timestamp: -1 }).limit(50);
      socket.emit('messages-loaded', messages.reverse());
    } catch (error) {
      console.error('Error loading messages:', error);
    }

    console.log(`${socket.username} joined room ${roomId}`);
  });

  // Handle drawing events
  socket.on('drawing', (data) => {
    socket.to(socket.roomId).emit('drawing', data);
  });

  // Handle chat messages
  socket.on('chat-message', async (message) => {
    try {
      const newMessage = new Message({
        roomId: socket.roomId,
        username: socket.username,
        message: message
      });
      await newMessage.save();
      
      io.to(socket.roomId).emit('chat-message', {
        username: socket.username,
        message: message,
        timestamp: newMessage.timestamp
      });
    } catch (error) {
      console.error('Error saving message:', error);
    }
  });

  // Save board state
  socket.on('save-board', async (canvasData) => {
    try {
      await Board.findOneAndUpdate(
        { roomId: socket.roomId },
        { 
          canvasData: canvasData,
          updatedAt: new Date()
        },
        { upsert: true, new: true }
      );
    } catch (error) {
      console.error('Error saving board:', error);
    }
  });

  // Handle user typing indicator
  socket.on('typing', (isTyping) => {
    socket.to(socket.roomId).emit('user-typing', {
      username: socket.username,
      isTyping: isTyping
    });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    if (socket.roomId && activeUsers.has(socket.roomId)) {
      activeUsers.get(socket.roomId).delete(socket.id);
      
      // If no users left, clean up
      if (activeUsers.get(socket.roomId).size === 0) {
        activeUsers.delete(socket.roomId);
      } else {
        // Send updated user list
        io.to(socket.roomId).emit('users-updated', Array.from(activeUsers.get(socket.roomId).values()));
      }
    }
    console.log('User disconnected:', socket.id);
  });
});

// Utility function to generate random colors
function getRandomColor() {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
