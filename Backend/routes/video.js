const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const VideoProcessor = require('../services/VideoProcessor');
const ThreatDetector = require('../services/ThreatDetector');
const auth = require('../middleware/auth');

const router = express.Router();
const videoProcessor = new VideoProcessor();
const threatDetector = new ThreatDetector();

// Configure multer for video uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/videos');
    try {
      await fs.mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/mkv'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only video files are allowed.'));
    }
  }
});

// Upload and process video
router.post('/upload', auth, upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file provided' });
    }

    const videoId = uuidv4();
    const videoPath = req.file.path;
    const { settings = {} } = req.body;

    // Start video processing
    const processingJob = await videoProcessor.processVideo(videoId, videoPath, {
      extractFrames: true,
      detectThreats: true,
      generateThumbnails: true,
      ...settings
    });

    res.json({
      success: true,
      videoId,
      jobId: processingJob.id,
      message: 'Video uploaded successfully. Processing started.',
      estimatedTime: processingJob.estimatedTime
    });

  } catch (error) {
    console.error('Video upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get video processing status
router.get('/status/:videoId', auth, async (req, res) => {
  try {
    const { videoId } = req.params;
    const status = await videoProcessor.getProcessingStatus(videoId);
    
    if (!status) {
      return res.status(404).json({ error: 'Video not found' });
    }

    res.json(status);
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get video analysis results
router.get('/analysis/:videoId', auth, async (req, res) => {
  try {
    const { videoId } = req.params;
    const analysis = await threatDetector.getVideoAnalysis(videoId);
    
    if (!analysis) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    res.json(analysis);
  } catch (error) {
    console.error('Analysis retrieval error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Search video content
router.post('/search', auth, async (req, res) => {
  try {
    const { query, filters = {}, pagination = {} } = req.body;
    
    const searchResults = await videoProcessor.searchVideoContent({
      query,
      filters: {
        dateRange: filters.dateRange,
        threatTypes: filters.threatTypes,
        confidenceThreshold: filters.confidenceThreshold || 0.7,
        ...filters
      },
      pagination: {
        page: pagination.page || 1,
        limit: pagination.limit || 20,
        ...pagination
      }
    });

    res.json(searchResults);
  } catch (error) {
    console.error('Video search error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get video thumbnails
router.get('/thumbnails/:videoId', auth, async (req, res) => {
  try {
    const { videoId } = req.params;
    const { timestamp } = req.query;
    
    const thumbnail = await videoProcessor.getThumbnail(videoId, timestamp);
    
    if (!thumbnail) {
      return res.status(404).json({ error: 'Thumbnail not found' });
    }

    res.set('Content-Type', 'image/jpeg');
    res.send(thumbnail);
  } catch (error) {
    console.error('Thumbnail retrieval error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Stream video
router.get('/stream/:videoId', auth, async (req, res) => {
  try {
    const { videoId } = req.params;
    const range = req.headers.range;
    
    const videoStream = await videoProcessor.streamVideo(videoId, range);
    
    if (!videoStream) {
      return res.status(404).json({ error: 'Video not found' });
    }

    res.writeHead(206, videoStream.headers);
    videoStream.stream.pipe(res);
  } catch (error) {
    console.error('Video streaming error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete video
router.delete('/:videoId', auth, async (req, res) => {
  try {
    const { videoId } = req.params;
    await videoProcessor.deleteVideo(videoId);
    
    res.json({
      success: true,
      message: 'Video deleted successfully'
    });
  } catch (error) {
    console.error('Video deletion error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get sample video for demo
router.get('/sample', async (req, res) => {
  try {
    const samplePath = path.join(__dirname, '../samples/demo-surveillance.mp4');
    
    // Check if sample exists, if not create a placeholder
    try {
      await fs.access(samplePath);
    } catch {
      // Create sample directory if it doesn't exist
      await fs.mkdir(path.dirname(samplePath), { recursive: true });
      
      // For demo purposes, we'll return metadata for a simulated video
      return res.json({
        success: true,
        sampleVideo: {
          id: 'demo-sample-001',
          name: 'Demo Surveillance Footage',
          duration: 120, // 2 minutes
          resolution: '1920x1080',
          fps: 30,
          size: '45MB',
          detections: [
            {
              type: 'person',
              confidence: 0.96,
              timestamp: 15.5,
              bbox: { x: 120, y: 80, width: 200, height: 400 }
            },
            {
              type: 'vehicle',
              confidence: 0.89,
              timestamp: 45.2,
              bbox: { x: 300, y: 200, width: 400, height: 200 }
            },
            {
              type: 'suspicious_bag',
              confidence: 0.78,
              timestamp: 78.9,
              bbox: { x: 450, y: 350, width: 80, height: 60 }
            }
          ],
          thumbnails: [
            '/api/video/thumbnails/demo-sample-001?t=0',
            '/api/video/thumbnails/demo-sample-001?t=30',
            '/api/video/thumbnails/demo-sample-001?t=60',
            '/api/video/thumbnails/demo-sample-001?t=90'
          ]
        }
      });
    }

    // If sample exists, stream it
    const stat = await fs.stat(samplePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'video/mp4',
      });
      
      const stream = require('fs').createReadStream(samplePath, { start, end });
      stream.pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4',
      });
      
      const stream = require('fs').createReadStream(samplePath);
      stream.pipe(res);
    }
  } catch (error) {
    console.error('Sample video error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
