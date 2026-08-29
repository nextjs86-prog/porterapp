require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const socketHandler = require('./utils/socketHandler');
const { apiLimiter } = require('./middleware/rateLimit');

// Native mobile apps (customer-app, driver-app) don't send an Origin header,
// so they're unaffected by this — this only restricts browser-based access
// (e.g. the admin panel, or any other website trying to call the API).
const ALLOWED_ORIGINS = [
  'https://porterapp.vercel.app',
  'http://localhost:3000',
];
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
};

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

// Middleware
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(mongoSanitize());
app.use('/api', apiLimiter);

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
