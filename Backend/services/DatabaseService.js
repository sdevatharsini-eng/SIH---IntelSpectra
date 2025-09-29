const mongoose = require('mongoose');

class DatabaseService {
  constructor() {
    this.connection = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/intellispectra';
      
      const options = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        bufferMaxEntries: 0,
        bufferCommands: false,
      };

      this.connection = await mongoose.connect(mongoUri, options);
      this.isConnected = true;

      console.log('✅ Connected to MongoDB');

      // Handle connection events
      mongoose.connection.on('error', (error) => {
        console.error('MongoDB connection error:', error);
        this.isConnected = false;
      });

      mongoose.connection.on('disconnected', () => {
        console.log('MongoDB disconnected');
        this.isConnected = false;
      });

      mongoose.connection.on('reconnected', () => {
        console.log('MongoDB reconnected');
        this.isConnected = true;
      });

      // Initialize collections and indexes
      await this.initializeDatabase();

    } catch (error) {
      console.error('Failed to connect to MongoDB:', error);
      throw error;
    }
  }

  async disconnect() {
    try {
      if (this.connection) {
        await mongoose.disconnect();
        this.isConnected = false;
        console.log('Disconnected from MongoDB');
      }
    } catch (error) {
      console.error('Error disconnecting from MongoDB:', error);
      throw error;
    }
  }

  async initializeDatabase() {
    try {
      // Create collections if they don't exist
      const collections = [
        'users',
        'videos',
        'threats',
        'detections',
        'cameras',
        'analytics',
        'alerts',
        'audit_logs'
      ];

      for (const collectionName of collections) {
        const exists = await mongoose.connection.db.listCollections({ name: collectionName }).hasNext();
        if (!exists) {
          await mongoose.connection.db.createCollection(collectionName);
          console.log(`Created collection: ${collectionName}`);
        }
      }

      // Create indexes for better performance
      await this.createIndexes();

      console.log('Database initialization completed');
    } catch (error) {
      console.error('Database initialization error:', error);
      throw error;
    }
  }

  async createIndexes() {
    try {
      const db = mongoose.connection.db;

      // Users collection indexes
      await db.collection('users').createIndex({ email: 1 }, { unique: true });
      await db.collection('users').createIndex({ role: 1 });
      await db.collection('users').createIndex({ isActive: 1 });
      await db.collection('users').createIndex({ createdAt: -1 });

      // Videos collection indexes
      await db.collection('videos').createIndex({ videoId: 1 }, { unique: true });
      await db.collection('videos').createIndex({ uploadedBy: 1 });
      await db.collection('videos').createIndex({ createdAt: -1 });
      await db.collection('videos').createIndex({ status: 1 });

      // Threats collection indexes
      await db.collection('threats').createIndex({ threatId: 1 }, { unique: true });
      await db.collection('threats').createIndex({ cameraId: 1 });
      await db.collection('threats').createIndex({ threatLevel: 1 });
      await db.collection('threats').createIndex({ status: 1 });
      await db.collection('threats').createIndex({ timestamp: -1 });
      await db.collection('threats').createIndex({ 
        cameraId: 1, 
        timestamp: -1 
      });

      // Detections collection indexes
      await db.collection('detections').createIndex({ videoId: 1 });
      await db.collection('detections').createIndex({ cameraId: 1 });
      await db.collection('detections').createIndex({ timestamp: -1 });
      await db.collection('detections').createIndex({ 
        type: 1, 
        confidence: -1 
      });

      // Cameras collection indexes
      await db.collection('cameras').createIndex({ cameraId: 1 }, { unique: true });
      await db.collection('cameras').createIndex({ status: 1 });
      await db.collection('cameras').createIndex({ location: 1 });

      // Analytics collection indexes
      await db.collection('analytics').createIndex({ date: -1 });
      await db.collection('analytics').createIndex({ type: 1 });
      await db.collection('analytics').createIndex({ 
        date: -1, 
        type: 1 
      });

      // Alerts collection indexes
      await db.collection('alerts').createIndex({ alertId: 1 }, { unique: true });
      await db.collection('alerts').createIndex({ severity: 1 });
      await db.collection('alerts').createIndex({ status: 1 });
      await db.collection('alerts').createIndex({ createdAt: -1 });

      // Audit logs collection indexes
      await db.collection('audit_logs').createIndex({ userId: 1 });
      await db.collection('audit_logs').createIndex({ action: 1 });
      await db.collection('audit_logs').createIndex({ timestamp: -1 });
      await db.collection('audit_logs').createIndex({ 
        userId: 1, 
        timestamp: -1 
      });

      console.log('Database indexes created successfully');
    } catch (error) {
      console.error('Error creating indexes:', error);
      throw error;
    }
  }

  async healthCheck() {
    try {
      if (!this.isConnected) {
        throw new Error('Database not connected');
      }

      // Ping the database
      await mongoose.connection.db.admin().ping();
      
      return {
        status: 'healthy',
        connected: this.isConnected,
        readyState: mongoose.connection.readyState,
        host: mongoose.connection.host,
        port: mongoose.connection.port,
        name: mongoose.connection.name
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        connected: false,
        error: error.message
      };
    }
  }

  async getStats() {
    try {
      if (!this.isConnected) {
        throw new Error('Database not connected');
      }

      const db = mongoose.connection.db;
      const stats = await db.stats();
      
      return {
        collections: stats.collections,
        dataSize: stats.dataSize,
        storageSize: stats.storageSize,
        indexes: stats.indexes,
        indexSize: stats.indexSize,
        objects: stats.objects
      };
    } catch (error) {
      console.error('Error getting database stats:', error);
      throw error;
    }
  }

  async cleanup() {
    try {
      if (!this.isConnected) {
        return;
      }

      const db = mongoose.connection.db;
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      // Clean up old audit logs (older than 30 days)
      const auditResult = await db.collection('audit_logs').deleteMany({
        timestamp: { $lt: thirtyDaysAgo }
      });

      // Clean up old analytics data (older than 30 days)
      const analyticsResult = await db.collection('analytics').deleteMany({
        date: { $lt: thirtyDaysAgo }
      });

      // Clean up resolved threats (older than 30 days)
      const threatsResult = await db.collection('threats').deleteMany({
        status: 'resolved',
        timestamp: { $lt: thirtyDaysAgo }
      });

      console.log('Database cleanup completed:', {
        auditLogsDeleted: auditResult.deletedCount,
        analyticsDeleted: analyticsResult.deletedCount,
        threatsDeleted: threatsResult.deletedCount
      });

      return {
        auditLogsDeleted: auditResult.deletedCount,
        analyticsDeleted: analyticsResult.deletedCount,
        threatsDeleted: threatsResult.deletedCount
      };
    } catch (error) {
      console.error('Database cleanup error:', error);
      throw error;
    }
  }

  getConnection() {
    return this.connection;
  }

  isHealthy() {
    return this.isConnected && mongoose.connection.readyState === 1;
  }
}

module.exports = DatabaseService;
