const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');
const ThreatDetector = require('./ThreatDetector');

// Set ffmpeg path
ffmpeg.setFfmpegPath(ffmpegStatic);

class VideoProcessor {
  constructor() {
    this.activeJobs = new Map();
    this.liveFeeds = new Map();
    this.threatDetector = new ThreatDetector();
  }

  async processVideo(videoId, videoPath, options = {}) {
    const jobId = uuidv4();
    const job = {
      id: jobId,
      videoId,
      status: 'processing',
      progress: 0,
      startTime: Date.now(),
      options
    };

    this.activeJobs.set(jobId, job);

    try {
      // Get video metadata
      const metadata = await this.getVideoMetadata(videoPath);
      job.metadata = metadata;
      job.estimatedTime = this.calculateProcessingTime(metadata);

      // Create output directories
      const outputDir = path.join(__dirname, '../output', videoId);
      await fs.mkdir(outputDir, { recursive: true });

      // Extract frames if requested
      if (options.extractFrames) {
        await this.extractFrames(videoPath, outputDir, job);
      }

      // Generate thumbnails
      if (options.generateThumbnails) {
        await this.generateThumbnails(videoPath, outputDir, job);
      }

      // Detect threats if requested
      if (options.detectThreats) {
        await this.detectThreatsInVideo(videoPath, outputDir, job);
      }

      job.status = 'completed';
      job.progress = 100;
      job.endTime = Date.now();
      job.processingTime = job.endTime - job.startTime;

      return job;

    } catch (error) {
      job.status = 'failed';
      job.error = error.message;
      job.endTime = Date.now();
      throw error;
    }
  }

  async getVideoMetadata(videoPath) {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(videoPath, (err, metadata) => {
        if (err) {
          reject(err);
        } else {
          const videoStream = metadata.streams.find(s => s.codec_type === 'video');
          resolve({
            duration: metadata.format.duration,
            size: metadata.format.size,
            bitrate: metadata.format.bit_rate,
            width: videoStream?.width,
            height: videoStream?.height,
            fps: eval(videoStream?.r_frame_rate) || 30,
            codec: videoStream?.codec_name
          });
        }
      });
    });
  }

  async extractFrames(videoPath, outputDir, job) {
    const framesDir = path.join(outputDir, 'frames');
    await fs.mkdir(framesDir, { recursive: true });

    return new Promise((resolve, reject) => {
      const frameRate = job.options.frameRate || 1; // Extract 1 frame per second
      
      ffmpeg(videoPath)
        .outputOptions([
          `-vf fps=${frameRate}`,
          '-q:v 2'
        ])
        .output(path.join(framesDir, 'frame_%04d.jpg'))
        .on('progress', (progress) => {
          job.progress = Math.min(progress.percent * 0.4, 40); // 40% for frame extraction
        })
        .on('end', () => {
          console.log('Frame extraction completed');
          resolve();
        })
        .on('error', (err) => {
          console.error('Frame extraction error:', err);
          reject(err);
        })
        .run();
    });
  }

  async generateThumbnails(videoPath, outputDir, job) {
    const thumbnailsDir = path.join(outputDir, 'thumbnails');
    await fs.mkdir(thumbnailsDir, { recursive: true });

    const duration = job.metadata.duration;
    const thumbnailCount = 10;
    const interval = duration / thumbnailCount;

    const promises = [];
    for (let i = 0; i < thumbnailCount; i++) {
      const timestamp = i * interval;
      const promise = this.generateThumbnailAtTime(videoPath, thumbnailsDir, timestamp, i);
      promises.push(promise);
    }

    await Promise.all(promises);
    job.progress = Math.min(job.progress + 20, 60); // Add 20% for thumbnails
  }

  async generateThumbnailAtTime(videoPath, outputDir, timestamp, index) {
    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .seekInput(timestamp)
        .outputOptions(['-vframes 1', '-q:v 2'])
        .output(path.join(outputDir, `thumb_${String(index).padStart(3, '0')}.jpg`))
        .on('end', resolve)
        .on('error', reject)
        .run();
    });
  }

  async detectThreatsInVideo(videoPath, outputDir, job) {
    const framesDir = path.join(outputDir, 'frames');
    const analysisDir = path.join(outputDir, 'analysis');
    await fs.mkdir(analysisDir, { recursive: true });

    try {
      // Get all frame files
      const frameFiles = await fs.readdir(framesDir);
      const imageFiles = frameFiles.filter(f => f.endsWith('.jpg')).sort();

      const detections = [];
      let processedFrames = 0;

      for (const frameFile of imageFiles) {
        const framePath = path.join(framesDir, frameFile);
        const frameBuffer = await fs.readFile(framePath);
        
        // Extract timestamp from filename
        const frameNumber = parseInt(frameFile.match(/\d+/)[0]);
        const timestamp = frameNumber / (job.options.frameRate || 1);

        // Analyze frame for threats
        const analysis = await this.threatDetector.analyzeFrame(frameBuffer, {
          timestamp,
          frameNumber,
          detectPersons: true,
          detectVehicles: true,
          detectObjects: true,
          detectFaces: true
        });

        if (analysis.detections.length > 0) {
          detections.push({
            timestamp,
            frameNumber,
            frameFile,
            detections: analysis.detections
          });
        }

        processedFrames++;
        job.progress = Math.min(60 + (processedFrames / imageFiles.length) * 40, 100);
      }

      // Save analysis results
      const analysisFile = path.join(analysisDir, 'threat_analysis.json');
      await fs.writeFile(analysisFile, JSON.stringify({
        videoId: job.videoId,
        totalFrames: imageFiles.length,
        threatsDetected: detections.length,
        detections,
        processingTime: Date.now() - job.startTime,
        timestamp: new Date().toISOString()
      }, null, 2));

      job.threatAnalysis = {
        totalThreats: detections.length,
        analysisFile
      };

    } catch (error) {
      console.error('Threat detection error:', error);
      throw error;
    }
  }

  async startLiveFeed(cameraId, settings, callback) {
    if (this.liveFeeds.has(cameraId)) {
      throw new Error(`Live feed already active for camera ${cameraId}`);
    }

    // For demo purposes, we'll simulate a live feed using a sample video
    const sampleVideoPath = path.join(__dirname, '../samples/demo-surveillance.mp4');
    
    // Check if sample video exists, create a simulated feed if not
    try {
      await fs.access(sampleVideoPath);
    } catch {
      // Simulate live feed with generated frames
      return this.simulateLiveFeed(cameraId, settings, callback);
    }

    const feedProcess = ffmpeg(sampleVideoPath)
      .inputOptions(['-re', '-stream_loop -1']) // Real-time, loop indefinitely
      .outputOptions([
        '-f image2pipe',
        '-vcodec mjpeg',
        '-q:v 2',
        '-r 5' // 5 FPS for demo
      ])
      .pipe();

    let frameBuffer = Buffer.alloc(0);

    feedProcess.on('data', async (chunk) => {
      frameBuffer = Buffer.concat([frameBuffer, chunk]);
      
      // Look for JPEG markers to extract complete frames
      const startMarker = Buffer.from([0xFF, 0xD8]);
      const endMarker = Buffer.from([0xFF, 0xD9]);
      
      let startIndex = frameBuffer.indexOf(startMarker);
      let endIndex = frameBuffer.indexOf(endMarker);
      
      if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
        const frameData = frameBuffer.slice(startIndex, endIndex + 2);
        frameBuffer = frameBuffer.slice(endIndex + 2);
        
        try {
          // Analyze frame for threats
          const analysis = await this.threatDetector.analyzeFrame(frameData, {
            cameraId,
            timestamp: Date.now(),
            detectPersons: true,
            detectVehicles: true,
            detectObjects: true
          });

          callback(frameData, analysis.detections);
        } catch (error) {
          console.error('Live feed analysis error:', error);
        }
      }
    });

    feedProcess.on('error', (error) => {
      console.error('Live feed error:', error);
      this.liveFeeds.delete(cameraId);
    });

    this.liveFeeds.set(cameraId, {
      process: feedProcess,
      startTime: Date.now(),
      settings
    });
  }

  async simulateLiveFeed(cameraId, settings, callback) {
    // Simulate live feed with mock data
    const mockDetections = [
      { type: 'person', confidence: 0.95, bbox: { x: 100, y: 50, width: 80, height: 200 } },
      { type: 'vehicle', confidence: 0.88, bbox: { x: 300, y: 200, width: 150, height: 100 } },
      { type: 'bag', confidence: 0.76, bbox: { x: 450, y: 300, width: 40, height: 30 } }
    ];

    const interval = setInterval(async () => {
      // Generate a mock frame (1x1 pixel JPEG for demo)
      const mockFrame = await sharp({
        create: {
          width: 640,
          height: 480,
          channels: 3,
          background: { r: 50, g: 50, b: 50 }
        }
      })
      .jpeg()
      .toBuffer();

      // Randomly select some detections
      const activeDetections = mockDetections.filter(() => Math.random() > 0.5);
      
      callback(mockFrame, activeDetections);
    }, 200); // 5 FPS

    this.liveFeeds.set(cameraId, {
      interval,
      startTime: Date.now(),
      settings
    });
  }

  stopLiveFeed(cameraId) {
    const feed = this.liveFeeds.get(cameraId);
    if (feed) {
      if (feed.process) {
        feed.process.kill();
      }
      if (feed.interval) {
        clearInterval(feed.interval);
      }
      this.liveFeeds.delete(cameraId);
    }
  }

  async getProcessingStatus(videoId) {
    // Find job by videoId
    for (const [jobId, job] of this.activeJobs.entries()) {
      if (job.videoId === videoId) {
        return {
          jobId,
          videoId,
          status: job.status,
          progress: job.progress,
          startTime: job.startTime,
          endTime: job.endTime,
          processingTime: job.processingTime,
          error: job.error,
          metadata: job.metadata,
          threatAnalysis: job.threatAnalysis
        };
      }
    }
    return null;
  }

  async searchVideoContent(options) {
    // Mock implementation for demo
    const mockResults = [
      {
        videoId: 'video-001',
        timestamp: 45.2,
        type: 'person',
        confidence: 0.94,
        description: 'Person detected in restricted area',
        thumbnail: '/api/video/thumbnails/video-001?t=45.2'
      },
      {
        videoId: 'video-002',
        timestamp: 128.7,
        type: 'vehicle',
        confidence: 0.89,
        description: 'Suspicious vehicle loitering',
        thumbnail: '/api/video/thumbnails/video-002?t=128.7'
      }
    ];

    return {
      results: mockResults,
      totalCount: mockResults.length,
      page: options.pagination.page,
      limit: options.pagination.limit,
      processingTime: 45
    };
  }

  async getThumbnail(videoId, timestamp) {
    // Mock thumbnail generation
    const thumbnail = await sharp({
      create: {
        width: 320,
        height: 240,
        channels: 3,
        background: { r: 30, g: 30, b: 30 }
      }
    })
    .jpeg()
    .toBuffer();

    return thumbnail;
  }

  async streamVideo(videoId, range) {
    // Mock video streaming implementation
    return null; // Would implement actual video streaming logic
  }

  async deleteVideo(videoId) {
    // Clean up video files and data
    const outputDir = path.join(__dirname, '../output', videoId);
    try {
      await fs.rmdir(outputDir, { recursive: true });
    } catch (error) {
      console.error('Error deleting video files:', error);
    }

    // Remove from active jobs
    for (const [jobId, job] of this.activeJobs.entries()) {
      if (job.videoId === videoId) {
        this.activeJobs.delete(jobId);
        break;
      }
    }
  }

  calculateProcessingTime(metadata) {
    // Estimate processing time based on video duration and resolution
    const baseTime = metadata.duration * 2; // 2 seconds per video second
    const resolutionFactor = (metadata.width * metadata.height) / (1920 * 1080);
    return Math.ceil(baseTime * resolutionFactor);
  }
}

module.exports = VideoProcessor;
