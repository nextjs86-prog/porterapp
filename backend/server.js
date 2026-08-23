require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const socketHandler = require('./utils/socketHandler');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Attach io to requests
app.use((req, _res, next) => {
  req.io = io;
  next();
});

// Connect DB
connectDB();

// Routes
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/customer',  require('./routes/customer'));
app.use('/api/driver',    require('./routes/driver'));
app.use('/api/order',     require('./routes/order'));
app.use('/api/payment',   require('./routes/payment'));
app.use('/api/admin',     require('./routes/admin'));

// Health check
app.get('/health', (_req, res) => res.json({ status: 'OK', timestamp: new Date() }));

// Socket.io
socketHandler(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
