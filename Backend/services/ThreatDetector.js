const tf = require('@tensorflow/tfjs-node');
const sharp = require('sharp');
const path = require('path');

class ThreatDetector {
  constructor() {
    this.models = new Map();
    this.isInitialized = false;
    this.detectionClasses = {
      person: 0,
      bicycle: 1,
      car: 2,
      motorcycle: 3,
      airplane: 4,
      bus: 5,
      train: 6,
      truck: 7,
      boat: 8,
      traffic_light: 9,
      fire_hydrant: 10,
      stop_sign: 11,
      parking_meter: 12,
      bench: 13,
      bird: 14,
      cat: 15,
      dog: 16,
      horse: 17,
      sheep: 18,
      cow: 19,
      elephant: 20,
      bear: 21,
      zebra: 22,
      giraffe: 23,
      backpack: 24,
      umbrella: 25,
      handbag: 26,
      tie: 27,
      suitcase: 28,
      frisbee: 29,
      skis: 30,
      snowboard: 31,
      sports_ball: 32,
      kite: 33,
      baseball_bat: 34,
      baseball_glove: 35,
      skateboard: 36,
      surfboard: 37,
      tennis_racket: 38,
      bottle: 39,
      wine_glass: 40,
      cup: 41,
      fork: 42,
      knife: 43,
      spoon: 44,
      bowl: 45,
      banana: 46,
      apple: 47,
      sandwich: 48,
      orange: 49,
      broccoli: 50,
      carrot: 51,
      hot_dog: 52,
      pizza: 53,
      donut: 54,
      cake: 55,
      chair: 56,
      couch: 57,
      potted_plant: 58,
      bed: 59,
      dining_table: 60,
      toilet: 61,
      tv: 62,
      laptop: 63,
      mouse: 64,
      remote: 65,
      keyboard: 66,
      cell_phone: 67,
      microwave: 68,
      oven: 69,
      toaster: 70,
      sink: 71,
      refrigerator: 72,
      book: 73,
      clock: 74,
      vase: 75,
      scissors: 76,
      teddy_bear: 77,
      hair_drier: 78,
      toothbrush: 79
    };
    
    this.threatCategories = {
      high: ['knife', 'scissors', 'baseball_bat'],
      medium: ['backpack', 'suitcase', 'handbag'],
      low: ['person', 'car', 'bicycle']
    };
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      // For demo purposes, we'll use a mock model
      // In production, you would load actual TensorFlow models
      console.log('Initializing AI models...');
      
      // Mock model loading
      this.models.set('object_detection', {
        predict: this.mockObjectDetection.bind(this),
        isLoaded: true
      });
      
      this.models.set('face_recognition', {
        predict: this.mockFaceRecognition.bind(this),
        isLoaded: true
      });

      this.isInitialized = true;
      console.log('AI models initialized successfully');
    } catch (error) {
      console.error('Failed to initialize AI models:', error);
      throw error;
    }
  }

  async analyzeFrame(imageBuffer, options = {}) {
    await this.initialize();

    const startTime = Date.now();
    
    try {
      // Preprocess image
      const processedImage = await this.preprocessImage(imageBuffer);
      
      // Run object detection
      const detections = await this.detectObjects(processedImage, options);
      
      // Classify threat levels
      const classifiedDetections = this.classifyThreats(detections);
      
      // Calculate overall confidence
      const overallConfidence = this.calculateOverallConfidence(classifiedDetections);
      
      const processingTime = Date.now() - startTime;

      return {
        detections: classifiedDetections,
        overallConfidence,
        processingTime,
        timestamp: options.timestamp || Date.now(),
        frameInfo: {
          width: processedImage.width,
          height: processedImage.height,
          channels: processedImage.channels
        }
      };
    } catch (error) {
      console.error('Frame analysis error:', error);
      throw error;
    }
  }

  async preprocessImage(imageBuffer) {
    try {
      const image = sharp(imageBuffer);
      const metadata = await image.metadata();
      
      // Resize to standard input size (416x416 for YOLO-style models)
      const processedBuffer = await image
        .resize(416, 416, { fit: 'fill' })
        .rgb()
        .raw()
        .toBuffer();

      return {
        data: processedBuffer,
        width: 416,
        height: 416,
        channels: 3,
        originalWidth: metadata.width,
        originalHeight: metadata.height
      };
    } catch (error) {
      console.error('Image preprocessing error:', error);
      throw error;
    }
  }

  async detectObjects(processedImage, options = {}) {
    const model = this.models.get('object_detection');
    if (!model || !model.isLoaded) {
      throw new Error('Object detection model not loaded');
    }

    // Mock detection results for demo
    return await model.predict(processedImage, options);
  }

  async mockObjectDetection(processedImage, options = {}) {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 50));

    // Generate mock detections based on options
    const mockDetections = [];
    
    if (options.detectPersons !== false) {
      mockDetections.push({
        class: 'person',
        confidence: 0.92 + Math.random() * 0.07,
        bbox: {
          x: 50 + Math.random() * 200,
          y: 30 + Math.random() * 100,
          width: 80 + Math.random() * 40,
          height: 180 + Math.random() * 60
        }
      });
    }

    if (options.detectVehicles !== false && Math.random() > 0.6) {
      mockDetections.push({
        class: 'car',
        confidence: 0.85 + Math.random() * 0.1,
        bbox: {
          x: 200 + Math.random() * 150,
          y: 150 + Math.random() * 100,
          width: 120 + Math.random() * 80,
          height: 80 + Math.random() * 40
        }
      });
    }

    if (options.detectObjects !== false && Math.random() > 0.7) {
      const objectTypes = ['backpack', 'handbag', 'suitcase'];
      const randomObject = objectTypes[Math.floor(Math.random() * objectTypes.length)];
      
      mockDetections.push({
        class: randomObject,
        confidence: 0.75 + Math.random() * 0.15,
        bbox: {
          x: 300 + Math.random() * 100,
          y: 200 + Math.random() * 150,
          width: 40 + Math.random() * 30,
          height: 30 + Math.random() * 20
        }
      });
    }

    // Occasionally add high-threat items
    if (Math.random() > 0.9) {
      mockDetections.push({
        class: 'knife',
        confidence: 0.68 + Math.random() * 0.2,
        bbox: {
          x: 150 + Math.random() * 200,
          y: 100 + Math.random() * 200,
          width: 20 + Math.random() * 15,
          height: 60 + Math.random() * 30
        }
      });
    }

    return mockDetections;
  }

  classifyThreats(detections) {
    return detections.map(detection => {
      let threatLevel = 'low';
      let riskScore = 0.1;

      // Determine threat level based on object class
      if (this.threatCategories.high.includes(detection.class)) {
        threatLevel = 'high';
        riskScore = 0.8 + Math.random() * 0.2;
      } else if (this.threatCategories.medium.includes(detection.class)) {
        threatLevel = 'medium';
        riskScore = 0.4 + Math.random() * 0.3;
      } else if (this.threatCategories.low.includes(detection.class)) {
        threatLevel = 'low';
        riskScore = 0.1 + Math.random() * 0.2;
      }

      // Adjust risk score based on confidence
      riskScore *= detection.confidence;

      return {
        ...detection,
        threatLevel,
        riskScore,
        id: this.generateDetectionId(),
        timestamp: Date.now()
      };
    });
  }

  calculateOverallConfidence(detections) {
    if (detections.length === 0) return 0;
    
    const totalConfidence = detections.reduce((sum, det) => sum + det.confidence, 0);
    return totalConfidence / detections.length;
  }

  async recognizeFaces(imageBuffer, knownFaces = []) {
    await this.initialize();

    const model = this.models.get('face_recognition');
    if (!model || !model.isLoaded) {
      throw new Error('Face recognition model not loaded');
    }

    // Mock face recognition for demo
    return await model.predict(imageBuffer, knownFaces);
  }

  async mockFaceRecognition(imageBuffer, knownFaces = []) {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 100));

    const mockFaces = [
      {
        id: 'face_001',
        bbox: { x: 120, y: 80, width: 100, height: 120 },
        confidence: 0.94,
        landmarks: {
          leftEye: { x: 140, y: 120 },
          rightEye: { x: 180, y: 120 },
          nose: { x: 160, y: 140 },
          mouth: { x: 160, y: 170 }
        },
        encoding: new Array(128).fill(0).map(() => Math.random())
      }
    ];

    const matches = [];
    const unknownFaces = [];

    mockFaces.forEach(face => {
      let bestMatch = null;
      let bestDistance = Infinity;

      knownFaces.forEach(knownFace => {
        const distance = this.calculateFaceDistance(face.encoding, knownFace.encoding);
        if (distance < bestDistance && distance < 0.6) {
          bestDistance = distance;
          bestMatch = knownFace;
        }
      });

      if (bestMatch) {
        matches.push({
          face,
          match: bestMatch,
          distance: bestDistance,
          confidence: 1 - bestDistance
        });
      } else {
        unknownFaces.push(face);
      }
    });

    return {
      faces: mockFaces,
      matches,
      unknownFaces,
      averageConfidence: mockFaces.reduce((sum, f) => sum + f.confidence, 0) / mockFaces.length
    };
  }

  calculateFaceDistance(encoding1, encoding2) {
    // Simple Euclidean distance calculation
    let sum = 0;
    for (let i = 0; i < encoding1.length; i++) {
      sum += Math.pow(encoding1[i] - encoding2[i], 2);
    }
    return Math.sqrt(sum);
  }

  async trackObjects(frames, options = {}) {
    // Mock object tracking implementation
    const tracks = [];
    let trackId = 1;

    frames.forEach((frame, frameIndex) => {
      // Simulate tracking logic
      if (Math.random() > 0.3) {
        tracks.push({
          id: `track_${trackId++}`,
          frameIndex,
          timestamp: frame.timestamp,
          class: 'person',
          confidence: 0.85 + Math.random() * 0.1,
          bbox: {
            x: 100 + Math.random() * 200,
            y: 50 + Math.random() * 150,
            width: 80 + Math.random() * 40,
            height: 180 + Math.random() * 60
          },
          velocity: {
            x: (Math.random() - 0.5) * 10,
            y: (Math.random() - 0.5) * 5
          },
          isActive: true
        });
      }
    });

    return {
      tracks,
      averageConfidence: tracks.reduce((sum, t) => sum + t.confidence, 0) / tracks.length || 0
    };
  }

  async detectAnomalies(videoData, options = {}) {
    // Mock anomaly detection
    const anomalies = [];

    if (Math.random() > 0.7) {
      anomalies.push({
        type: 'abandoned_object',
        confidence: 0.82,
        timestamp: Date.now() - Math.random() * 60000,
        location: { x: 200, y: 150, width: 50, height: 40 },
        description: 'Unattended bag detected for extended period'
      });
    }

    if (Math.random() > 0.8) {
      anomalies.push({
        type: 'unusual_behavior',
        confidence: 0.76,
        timestamp: Date.now() - Math.random() * 30000,
        location: { x: 300, y: 100, width: 80, height: 200 },
        description: 'Person loitering in restricted area'
      });
    }

    const riskLevel = anomalies.length > 0 ? 
      (anomalies.some(a => a.confidence > 0.8) ? 'high' : 'medium') : 'low';

    return {
      detections: anomalies,
      overallRiskLevel: riskLevel,
      recommendations: this.generateRecommendations(anomalies)
    };
  }

  generateRecommendations(anomalies) {
    const recommendations = [];

    anomalies.forEach(anomaly => {
      switch (anomaly.type) {
        case 'abandoned_object':
          recommendations.push('Investigate unattended object immediately');
          recommendations.push('Alert security personnel to the location');
          break;
        case 'unusual_behavior':
          recommendations.push('Monitor individual closely');
          recommendations.push('Consider approaching for identification');
          break;
        default:
          recommendations.push('Continue monitoring the situation');
      }
    });

    return [...new Set(recommendations)]; // Remove duplicates
  }

  generateDetectionId() {
    return `det_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async getVideoAnalysis(videoId) {
    // Mock video analysis retrieval
    return {
      videoId,
      totalFrames: 1800,
      analyzedFrames: 1800,
      detections: [
        {
          timestamp: 15.5,
          type: 'person',
          confidence: 0.94,
          threatLevel: 'low',
          bbox: { x: 120, y: 80, width: 100, height: 200 }
        },
        {
          timestamp: 45.2,
          type: 'vehicle',
          confidence: 0.89,
          threatLevel: 'low',
          bbox: { x: 300, y: 200, width: 150, height: 100 }
        },
        {
          timestamp: 78.9,
          type: 'backpack',
          confidence: 0.76,
          threatLevel: 'medium',
          bbox: { x: 450, y: 350, width: 60, height: 80 }
        }
      ],
      summary: {
        totalThreats: 3,
        highRiskThreats: 0,
        mediumRiskThreats: 1,
        lowRiskThreats: 2,
        averageConfidence: 0.86
      },
      processingTime: 45000,
      analyzedAt: new Date().toISOString()
    };
  }
}

module.exports = ThreatDetector;
