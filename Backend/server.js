const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const videoRoutes = require('./routes/video');
const aiRoutes = require('./routes/ai');
const authRoutes = require('./routes/auth');
const threatRoutes = require('./routes/threats');
const analyticsRoutes = require('./routes/analytics');

const VideoProcessor = require('./services/VideoProcessor');
const ThreatDetector = require('./services/ThreatDetector');
const DatabaseService = require('./services/DatabaseService');
const RedisService = require('./services/RedisService');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Security middleware
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files
app.use('/uploads', express.static('uploads'));
app.use('/samples', express.static('samples'));

// Initialize services
const videoProcessor = new VideoProcessor();
const threatDetector = new ThreatDetector();
const dbService = new DatabaseService();
const redisService = new RedisService();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/video', videoRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/threats', threatRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join-monitoring', (data) => {
    socket.join('monitoring');
    console.log(`Client ${socket.id} joined monitoring room`);
  });

  socket.on('start-live-feed', async (data) => {
    try {
      const { cameraId, settings } = data;
      await videoProcessor.startLiveFeed(cameraId, settings, (frame, detections) => {
        socket.emit('live-frame', {
          cameraId,
          frame: frame.toString('base64'),
          detections,
          timestamp: Date.now()
        });
      });
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  socket.on('stop-live-feed', (data) => {
    const { cameraId } = data;
    videoProcessor.stopLiveFeed(cameraId);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 3001;

// Initialize database and start server
async function startServer() {
  try {
    await dbService.connect();
    await redisService.connect();
    
    server.listen(PORT, () => {
      console.log(`🚀 IntelSpectra Backend running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await dbService.disconnect();
  await redisService.disconnect();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = { app, io };
