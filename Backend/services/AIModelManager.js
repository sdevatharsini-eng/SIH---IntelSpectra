const tf = require('@tensorflow/tfjs-node');
const path = require('path');
const fs = require('fs').promises;

class AIModelManager {
  constructor() {
    this.models = new Map();
    this.modelConfigs = new Map();
    this.performanceMetrics = {
      totalInferences: 0,
      totalInferenceTime: 0,
      accuracyScores: [],
      memoryUsage: 0,
      lastUpdated: new Date()
    };
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      console.log('Initializing AI Model Manager...');
      
      // Load model configurations
      await this.loadModelConfigurations();
      
      // Load default models
      await this.loadDefaultModels();
      
      this.isInitialized = true;
      console.log('AI Model Manager initialized successfully');
    } catch (error) {
      console.error('Failed to initialize AI Model Manager:', error);
      throw error;
    }
  }

  async loadModelConfigurations() {
    // Define available models and their configurations
    const modelConfigs = [
      {
        id: 'object_detection_v1',
        name: 'Object Detection Model v1',
        version: '1.0.0',
        type: 'object_detection',
        path: './models/object_detection_v1',
        accuracy: 94.7,
        speed: 'fast',
        supportedDetections: ['person', 'vehicle', 'bag', 'weapon'],
        inputShape: [416, 416, 3],
        outputClasses: 80,
        confidenceThreshold: 0.5,
        nmsThreshold: 0.4,
        isDefault: true
      },
      {
        id: 'face_recognition_v1',
        name: 'Face Recognition Model v1',
        version: '1.0.0',
        type: 'face_recognition',
        path: './models/face_recognition_v1',
        accuracy: 96.2,
        speed: 'medium',
        supportedDetections: ['face', 'face_landmarks'],
        inputShape: [160, 160, 3],
        outputDimensions: 512,
        isDefault: true
      },
      {
        id: 'anomaly_detection_v1',
        name: 'Anomaly Detection Model v1',
        version: '1.0.0',
        type: 'anomaly_detection',
        path: './models/anomaly_detection_v1',
        accuracy: 89.3,
        speed: 'slow',
        supportedDetections: ['unusual_behavior', 'crowd_anomaly', 'abandoned_object'],
        inputShape: [224, 224, 3],
        sequenceLength: 16,
        isDefault: false
      },
      {
        id: 'weapon_detection_v1',
        name: 'Weapon Detection Model v1',
        version: '1.0.0',
        type: 'weapon_detection',
        path: './models/weapon_detection_v1',
        accuracy: 91.8,
        speed: 'fast',
        supportedDetections: ['knife', 'gun', 'weapon'],
        inputShape: [320, 320, 3],
        outputClasses: 10,
        isDefault: false
      }
    ];

    modelConfigs.forEach(config => {
      this.modelConfigs.set(config.id, config);
    });

    console.log(`Loaded ${modelConfigs.length} model configurations`);
  }

  async loadDefaultModels() {
    try {
      // Load default models
      const defaultModels = Array.from(this.modelConfigs.values())
        .filter(config => config.isDefault);

      for (const config of defaultModels) {
        try {
          await this.loadModel(config.id, { priority: 'high' });
        } catch (error) {
          console.warn(`Failed to load default model ${config.id}:`, error.message);
          // Create mock model for demo purposes
          await this.createMockModel(config);
        }
      }
    } catch (error) {
      console.error('Error loading default models:', error);
      // Create mock models for demo
      await this.createMockModels();
    }
  }

  async loadModel(modelId, options = {}) {
    const startTime = Date.now();
    
    try {
      const config = this.modelConfigs.get(modelId);
      if (!config) {
        throw new Error(`Model configuration not found: ${modelId}`);
      }

      if (this.models.has(modelId)) {
        console.log(`Model ${modelId} is already loaded`);
        return {
          loadTime: 0,
          memoryUsage: this.getModelMemoryUsage(modelId)
        };
      }

      console.log(`Loading model: ${modelId}`);

      // Check if model files exist
      const modelPath = path.resolve(config.path);
      try {
        await fs.access(modelPath);
        
        // Load actual TensorFlow model
        const model = await tf.loadLayersModel(`file://${modelPath}/model.json`);
        
        this.models.set(modelId, {
          model,
          config,
          isLoaded: true,
          loadedAt: new Date(),
          inferenceCount: 0,
          totalInferenceTime: 0,
          lastUsed: new Date()
        });
        
      } catch (fileError) {
        console.warn(`Model files not found for ${modelId}, creating mock model`);
        await this.createMockModel(config);
      }

      const loadTime = Date.now() - startTime;
      const memoryUsage = this.getModelMemoryUsage(modelId);

      console.log(`Model ${modelId} loaded successfully in ${loadTime}ms`);

      return { loadTime, memoryUsage };
    } catch (error) {
      console.error(`Failed to load model ${modelId}:`, error);
      throw error;
    }
  }

  async createMockModel(config) {
    // Create a mock model for demo purposes
    const mockModel = {
      predict: this.createMockPredict(config),
      dispose: () => {},
      summary: () => console.log(`Mock model: ${config.name}`)
    };

    this.models.set(config.id, {
      model: mockModel,
      config,
      isLoaded: true,
      isMock: true,
      loadedAt: new Date(),
      inferenceCount: 0,
      totalInferenceTime: 0,
      lastUsed: new Date()
    });

    console.log(`Created mock model: ${config.id}`);
  }

  async createMockModels() {
    // Create mock models for all configurations
    for (const [modelId, config] of this.modelConfigs.entries()) {
      await this.createMockModel(config);
    }
  }

  createMockPredict(config) {
    return async (input) => {
      // Simulate inference time
      const inferenceStart = Date.now();
      await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
      const inferenceTime = Date.now() - inferenceStart;

      // Update metrics
      const modelData = this.models.get(config.id);
      if (modelData) {
        modelData.inferenceCount++;
        modelData.totalInferenceTime += inferenceTime;
        modelData.lastUsed = new Date();
      }

      this.performanceMetrics.totalInferences++;
      this.performanceMetrics.totalInferenceTime += inferenceTime;

      // Generate mock predictions based on model type
      switch (config.type) {
        case 'object_detection':
          return this.generateMockObjectDetections(config);
        case 'face_recognition':
          return this.generateMockFaceRecognition(config);
        case 'anomaly_detection':
          return this.generateMockAnomalyDetection(config);
        case 'weapon_detection':
          return this.generateMockWeaponDetection(config);
        default:
          return tf.tensor2d([[0.5, 0.3, 0.2]]);
      }
    };
  }

  generateMockObjectDetections(config) {
    const numDetections = Math.floor(Math.random() * 5) + 1;
    const detections = [];

    for (let i = 0; i < numDetections; i++) {
      detections.push([
        Math.random() * 0.4 + 0.6, // confidence
        Math.random() * 400,       // x
        Math.random() * 300,       // y
        Math.random() * 100 + 50,  // width
        Math.random() * 100 + 50,  // height
        Math.floor(Math.random() * config.outputClasses) // class
      ]);
    }

    return tf.tensor2d(detections);
  }

  generateMockFaceRecognition(config) {
    // Generate mock face embeddings
    const embeddings = Array.from({ length: config.outputDimensions }, () => 
      (Math.random() - 0.5) * 2
    );
    return tf.tensor2d([embeddings]);
  }

  generateMockAnomalyDetection(config) {
    // Generate anomaly scores
    const anomalyScore = Math.random();
    const isAnomalous = anomalyScore > 0.7;
    
    return tf.tensor2d([[anomalyScore, isAnomalous ? 1 : 0]]);
  }

  generateMockWeaponDetection(config) {
    const hasWeapon = Math.random() > 0.8;
    const confidence = hasWeapon ? 0.7 + Math.random() * 0.3 : Math.random() * 0.4;
    
    return tf.tensor2d([[confidence, hasWeapon ? 1 : 0]]);
  }

  async unloadModel(modelId) {
    try {
      const modelData = this.models.get(modelId);
      if (!modelData) {
        throw new Error(`Model not found: ${modelId}`);
      }

      if (modelData.model && modelData.model.dispose) {
        modelData.model.dispose();
      }

      this.models.delete(modelId);
      console.log(`Model ${modelId} unloaded successfully`);
    } catch (error) {
      console.error(`Failed to unload model ${modelId}:`, error);
      throw error;
    }
  }

  async getAvailableModels() {
    return Array.from(this.modelConfigs.values()).map(config => ({
      ...config,
      isLoaded: this.models.has(config.id),
      stats: this.models.has(config.id) ? this.getModelStats(config.id) : null
    }));
  }

  getModelStats(modelId) {
    const modelData = this.models.get(modelId);
    if (!modelData) return null;

    return {
      inferenceCount: modelData.inferenceCount,
      totalInferenceTime: modelData.totalInferenceTime,
      averageInferenceTime: modelData.inferenceCount > 0 ? 
        modelData.totalInferenceTime / modelData.inferenceCount : 0,
      lastUsed: modelData.lastUsed,
      loadedAt: modelData.loadedAt,
      memoryUsage: this.getModelMemoryUsage(modelId)
    };
  }

  getModelMemoryUsage(modelId) {
    // Mock memory usage calculation
    const modelData = this.models.get(modelId);
    if (!modelData) return 0;

    const config = modelData.config;
    const inputSize = config.inputShape.reduce((a, b) => a * b, 1);
    const estimatedSize = inputSize * 4 * 2; // Rough estimate in bytes
    
    return Math.floor(estimatedSize / 1024 / 1024); // Convert to MB
  }

  async getPerformanceMetrics() {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    return {
      totalInferences: this.performanceMetrics.totalInferences,
      averageInferenceTime: this.performanceMetrics.totalInferences > 0 ? 
        this.performanceMetrics.totalInferenceTime / this.performanceMetrics.totalInferences : 0,
      accuracyRate: this.performanceMetrics.accuracyScores.length > 0 ?
        this.performanceMetrics.accuracyScores.reduce((a, b) => a + b, 0) / this.performanceMetrics.accuracyScores.length : 0,
      memoryUsage: {
        rss: Math.floor(memoryUsage.rss / 1024 / 1024),
        heapTotal: Math.floor(memoryUsage.heapTotal / 1024 / 1024),
        heapUsed: Math.floor(memoryUsage.heapUsed / 1024 / 1024),
        external: Math.floor(memoryUsage.external / 1024 / 1024)
      },
      cpuUsage: {
        user: cpuUsage.user,
        system: cpuUsage.system
      },
      gpuUsage: this.getGPUUsage(),
      modelsLoaded: this.models.size,
      queueSize: 0, // Mock queue size
      lastUpdated: new Date()
    };
  }

  getGPUUsage() {
    // Mock GPU usage - in production, you'd use actual GPU monitoring
    return {
      utilization: Math.floor(Math.random() * 60) + 20,
      memory: Math.floor(Math.random() * 40) + 30,
      temperature: Math.floor(Math.random() * 20) + 65
    };
  }

  async predict(modelId, input, options = {}) {
    const modelData = this.models.get(modelId);
    if (!modelData || !modelData.isLoaded) {
      throw new Error(`Model not loaded: ${modelId}`);
    }

    const startTime = Date.now();
    
    try {
      const result = await modelData.model.predict(input);
      const inferenceTime = Date.now() - startTime;
      
      // Update performance metrics
      this.updatePerformanceMetrics(modelId, inferenceTime, options.accuracy);
      
      return {
        result,
        inferenceTime,
        modelId,
        timestamp: new Date()
      };
    } catch (error) {
      console.error(`Prediction error for model ${modelId}:`, error);
      throw error;
    }
  }

  updatePerformanceMetrics(modelId, inferenceTime, accuracy = null) {
    this.performanceMetrics.totalInferences++;
    this.performanceMetrics.totalInferenceTime += inferenceTime;
    
    if (accuracy !== null) {
      this.performanceMetrics.accuracyScores.push(accuracy);
      // Keep only the last 1000 accuracy scores
      if (this.performanceMetrics.accuracyScores.length > 1000) {
        this.performanceMetrics.accuracyScores = this.performanceMetrics.accuracyScores.slice(-1000);
      }
    }
    
    this.performanceMetrics.lastUpdated = new Date();
  }

  async optimizeModels() {
    // Unload unused models to free memory
    const now = Date.now();
    const unusedThreshold = 30 * 60 * 1000; // 30 minutes

    for (const [modelId, modelData] of this.models.entries()) {
      if (now - modelData.lastUsed.getTime() > unusedThreshold && !modelData.config.isDefault) {
        console.log(`Unloading unused model: ${modelId}`);
        await this.unloadModel(modelId);
      }
    }
  }

  async healthCheck() {
    try {
      const loadedModels = this.models.size;
      const totalModels = this.modelConfigs.size;
      const memoryUsage = process.memoryUsage();
      
      return {
        status: 'healthy',
        modelsLoaded: loadedModels,
        totalModels: totalModels,
        memoryUsage: Math.floor(memoryUsage.heapUsed / 1024 / 1024),
        isInitialized: this.isInitialized,
        lastOptimization: new Date()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }
}

module.exports = AIModelManager;
