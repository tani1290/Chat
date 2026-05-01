require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { createClient } = require('redis');
const { createAdapter } = require('@socket.io/redis-adapter');
const jwt = require('jsonwebtoken');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const conversationRoutes = require('./routes/conversations');
const messageRoutes = require('./routes/messages');
const connectionRoutes = require('./routes/connections');
const postRoutes = require('./routes/posts');

const User = require('./models/User');
const Message = require('./models/Message');
const Conversation = require('./models/Conversation');

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/connections', connectionRoutes);
app.use('/api/posts', postRoutes);

// Socket.io Setup
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const pubClient = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
const subClient = pubClient.duplicate();

Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
  io.adapter(createAdapter(pubClient, subClient));
  console.log('Redis Adapter connected');
}).catch(err => console.error("Redis error:", err));

// Middleware for Socket Auth
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error'));
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretkey_chat_app_123');
    socket.user = decoded;
    next();
  } catch (err) {
    return next(new Error('Authentication error'));
  }
});

io.on('connection', async (socket) => {
  console.log(`User connected: ${socket.user.username} (${socket.id})`);
  
  // Update user online status
  await User.findByIdAndUpdate(socket.user._id, { isOnline: true });
  socket.broadcast.emit('user_status', { userId: socket.user._id, isOnline: true });

  // Join personal room for private events
  socket.join(socket.user._id);

  // Join conversation rooms
  const conversations = await Conversation.find({ participants: socket.user._id });
  conversations.forEach(conv => {
    socket.join(conv._id.toString());
  });

  socket.on('send_message', async (data) => {
    const { conversationId, text, attachment } = data;
    try {
      const message = new Message({
        conversationId,
        senderId: socket.user._id,
        text: text || '',
        attachment: attachment || '',
        status: 'sent'
      });
      await message.save();
      
      await Conversation.findByIdAndUpdate(conversationId, { lastMessage: message._id });

      const populatedMessage = await message.populate('senderId', 'username email');

      // Broadcast to room
      io.to(conversationId).emit('receive_message', populatedMessage);

      // Publish to Redis for Python microservice notifications
      pubClient.publish('notifications', JSON.stringify({
        type: 'new_message',
        conversationId,
        senderId: socket.user._id,
        text,
        timestamp: new Date()
      }));

    } catch (err) {
      console.error(err);
    }
  });

  socket.on('typing', (data) => {
    socket.to(data.conversationId).emit('typing', {
      conversationId: data.conversationId,
      userId: socket.user._id,
      isTyping: data.isTyping
    });
  });

  socket.on('read_receipt', async (data) => {
    // data: { messageId, conversationId }
    try {
      await Message.findByIdAndUpdate(data.messageId, { status: 'seen' });
      socket.to(data.conversationId).emit('message_seen', {
        messageId: data.messageId,
        conversationId: data.conversationId,
        userId: socket.user._id
      });
    } catch(err) {
      console.error(err);
    }
  });

  socket.on('disconnect', async () => {
    console.log(`User disconnected: ${socket.user.username}`);
    await User.findByIdAndUpdate(socket.user._id, { isOnline: false, lastSeen: Date.now() });
    socket.broadcast.emit('user_status', { userId: socket.user._id, isOnline: false, lastSeen: Date.now() });
  });
});

const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/chatdb')
  .then(() => {
    console.log('Connected to MongoDB');
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => console.error(err));
