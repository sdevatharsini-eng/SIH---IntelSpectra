const express = require('express');
const ThreatDetector = require('../services/ThreatDetector');
const AIModelManager = require('../services/AIModelManager');
const auth = require('../middleware/auth');

const router = express.Router();
const threatDetector = new ThreatDetector();
const aiModelManager = new AIModelManager();

// Real-time frame analysis
router.post('/analyze-frame', auth, async (req, res) => {
  try {
    const { frameData, cameraId, timestamp } = req.body;
    
    if (!frameData) {
      return res.status(400).json({ error: 'Frame data is required' });
    }

    // Convert base64 to buffer
    const imageBuffer = Buffer.from(frameData, 'base64');
    
    // Analyze frame for threats
    const analysis = await threatDetector.analyzeFrame(imageBuffer, {
      cameraId,
      timestamp: timestamp || Date.now(),
      detectPersons: true,
      detectVehicles: true,
      detectObjects: true,
      detectFaces: true,
      detectWeapons: true
    });

    res.json({
      success: true,
      analysis,
      processingTime: analysis.processingTime,
      confidence: analysis.overallConfidence
    });

  } catch (error) {
    console.error('Frame analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Batch frame analysis
router.post('/analyze-batch', auth, async (req, res) => {
  try {
    const { frames, options = {} } = req.body;
    
    if (!frames || !Array.isArray(frames)) {
      return res.status(400).json({ error: 'Frames array is required' });
    }

    const batchResults = await Promise.all(
      frames.map(async (frame, index) => {
        try {
          const imageBuffer = Buffer.from(frame.data, 'base64');
          const analysis = await threatDetector.analyzeFrame(imageBuffer, {
            frameIndex: index,
            timestamp: frame.timestamp,
            ...options
          });
          return { frameIndex: index, success: true, analysis };
        } catch (error) {
          return { frameIndex: index, success: false, error: error.message };
        }
      })
    );

    const successCount = batchResults.filter(r => r.success).length;
    const totalThreats = batchResults.reduce((acc, r) => 
      acc + (r.success ? r.analysis.detections.length : 0), 0
    );

    res.json({
      success: true,
      results: batchResults,
      summary: {
        totalFrames: frames.length,
        successfulAnalysis: successCount,
        failedAnalysis: frames.length - successCount,
        totalThreatsDetected: totalThreats
      }
    });

  } catch (error) {
    console.error('Batch analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get AI model information
router.get('/models', auth, async (req, res) => {
  try {
    const models = await aiModelManager.getAvailableModels();
    res.json({
      success: true,
      models: models.map(model => ({
        id: model.id,
        name: model.name,
        version: model.version,
        type: model.type,
        accuracy: model.accuracy,
        speed: model.speed,
        isLoaded: model.isLoaded,
        supportedDetections: model.supportedDetections
      }))
    });
  } catch (error) {
    console.error('Models retrieval error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Load specific AI model
router.post('/models/:modelId/load', auth, async (req, res) => {
  try {
    const { modelId } = req.params;
    const { priority = 'normal' } = req.body;
    
    const result = await aiModelManager.loadModel(modelId, { priority });
    
    res.json({
      success: true,
      message: `Model ${modelId} loaded successfully`,
      loadTime: result.loadTime,
      memoryUsage: result.memoryUsage
    });
  } catch (error) {
    console.error('Model loading error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Unload AI model
router.post('/models/:modelId/unload', auth, async (req, res) => {
  try {
    const { modelId } = req.params;
    
    await aiModelManager.unloadModel(modelId);
    
    res.json({
      success: true,
      message: `Model ${modelId} unloaded successfully`
    });
  } catch (error) {
    console.error('Model unloading error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get AI performance metrics
router.get('/metrics', auth, async (req, res) => {
  try {
    const metrics = await aiModelManager.getPerformanceMetrics();
    
    res.json({
      success: true,
      metrics: {
        totalInferences: metrics.totalInferences,
        averageInferenceTime: metrics.averageInferenceTime,
        accuracyRate: metrics.accuracyRate,
        memoryUsage: metrics.memoryUsage,
        cpuUsage: metrics.cpuUsage,
        gpuUsage: metrics.gpuUsage,
        modelsLoaded: metrics.modelsLoaded,
        queueSize: metrics.queueSize,
        lastUpdated: metrics.lastUpdated
      }
    });
  } catch (error) {
    console.error('Metrics retrieval error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Face recognition endpoint
router.post('/face-recognition', auth, async (req, res) => {
  try {
    const { imageData, knownFaces = [] } = req.body;
    
    if (!imageData) {
      return res.status(400).json({ error: 'Image data is required' });
    }

    const imageBuffer = Buffer.from(imageData, 'base64');
    const faceResults = await threatDetector.recognizeFaces(imageBuffer, knownFaces);
    
    res.json({
      success: true,
      faces: faceResults.faces,
      matches: faceResults.matches,
      unknownFaces: faceResults.unknownFaces,
      confidence: faceResults.averageConfidence
    });

  } catch (error) {
    console.error('Face recognition error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Object tracking endpoint
router.post('/track-objects', auth, async (req, res) => {
  try {
    const { frames, trackingOptions = {} } = req.body;
    
    if (!frames || !Array.isArray(frames)) {
      return res.status(400).json({ error: 'Frames array is required' });
    }

    const trackingResults = await threatDetector.trackObjects(frames, {
      trackPersons: true,
      trackVehicles: true,
      trackObjects: true,
      minConfidence: 0.7,
      maxDistance: 100,
      ...trackingOptions
    });

    res.json({
      success: true,
      tracks: trackingResults.tracks,
      summary: {
        totalTracks: trackingResults.tracks.length,
        activeTracks: trackingResults.tracks.filter(t => t.isActive).length,
        averageConfidence: trackingResults.averageConfidence
      }
    });

  } catch (error) {
    console.error('Object tracking error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Anomaly detection
router.post('/detect-anomalies', auth, async (req, res) => {
  try {
    const { videoData, baselineData, sensitivity = 0.8 } = req.body;
    
    const anomalies = await threatDetector.detectAnomalies(videoData, {
      baseline: baselineData,
      sensitivity,
      detectionTypes: ['motion', 'crowd', 'abandoned_object', 'unusual_behavior']
    });

    res.json({
      success: true,
      anomalies: anomalies.detections,
      riskLevel: anomalies.overallRiskLevel,
      recommendations: anomalies.recommendations
    });

  } catch (error) {
    console.error('Anomaly detection error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
