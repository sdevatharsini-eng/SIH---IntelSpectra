const fs = require('fs').promises;
const path = require('path');

async function createSampleVideoMetadata() {
  try {
    const sampleDir = path.join(__dirname);
    await fs.mkdir(sampleDir, { recursive: true });

    // Create a metadata file for the demo video since we can't include actual video files
    const sampleMetadata = {
      filename: 'demo-surveillance.mp4',
      description: 'Demo surveillance footage for IntelSpectra testing',
      duration: 120, // 2 minutes
      resolution: '1920x1080',
      fps: 30,
      size: '45MB',
      format: 'mp4',
      codec: 'h264',
      created: new Date().toISOString(),
      detections: [
        {
          timestamp: 15.5,
          type: 'person',
          confidence: 0.96,
          bbox: { x: 120, y: 80, width: 200, height: 400 },
          description: 'Person walking through main entrance'
        },
        {
          timestamp: 45.2,
          type: 'vehicle',
          confidence: 0.89,
          bbox: { x: 300, y: 200, width: 400, height: 200 },
          description: 'Vehicle entering parking area'
        },
        {
          timestamp: 78.9,
          type: 'bag',
          confidence: 0.78,
          bbox: { x: 450, y: 350, width: 80, height: 60 },
          description: 'Unattended bag detected'
        },
        {
          timestamp: 95.3,
          type: 'person',
          confidence: 0.94,
          bbox: { x: 200, y: 100, width: 180, height: 380 },
          description: 'Person in restricted area'
        }
      ],
      thumbnails: [
        { timestamp: 0, filename: 'thumb_000.jpg' },
        { timestamp: 30, filename: 'thumb_001.jpg' },
        { timestamp: 60, filename: 'thumb_002.jpg' },
        { timestamp: 90, filename: 'thumb_003.jpg' }
      ],
      analysis: {
        totalFrames: 3600,
        analyzedFrames: 3600,
        threatsDetected: 4,
        averageConfidence: 0.89,
        processingTime: 45000,
        accuracy: 94.7
      }
    };

    const metadataPath = path.join(sampleDir, 'demo-surveillance-metadata.json');
    await fs.writeFile(metadataPath, JSON.stringify(sampleMetadata, null, 2));

    console.log('Sample video metadata created successfully');
    console.log('Location:', metadataPath);

    // Create a README file explaining the sample
    const readmeContent = `# IntelSpectra Sample Video

This directory contains metadata for a demo surveillance video used for testing IntelSpectra's video intelligence capabilities.

## Sample Video Details

- **Filename**: demo-surveillance.mp4
- **Duration**: 2 minutes (120 seconds)
- **Resolution**: 1920x1080 (Full HD)
- **Frame Rate**: 30 FPS
- **Format**: MP4 (H.264 codec)
- **Size**: ~45MB

## Detected Objects

The sample video contains the following pre-analyzed detections:

1. **Person** (15.5s) - Confidence: 96%
   - Walking through main entrance
   - Bounding box: (120, 80, 200x400)

2. **Vehicle** (45.2s) - Confidence: 89%
   - Entering parking area
   - Bounding box: (300, 200, 400x200)

3. **Bag** (78.9s) - Confidence: 78%
   - Unattended bag detected
   - Bounding box: (450, 350, 80x60)

4. **Person** (95.3s) - Confidence: 94%
   - Person in restricted area
   - Bounding box: (200, 100, 180x380)

## Usage

This sample is used by the IntelSpectra backend to demonstrate:
- Video upload and processing
- AI/ML threat detection
- Real-time analysis capabilities
- Forensic search functionality

## Note

In a production environment, you would place actual video files in this directory. For demo purposes, the backend generates mock responses based on this metadata.
`;

    const readmePath = path.join(sampleDir, 'README.md');
    await fs.writeFile(readmePath, readmeContent);

    console.log('Sample README created successfully');

  } catch (error) {
    console.error('Error creating sample video metadata:', error);
  }
}

// Run the script if called directly
if (require.main === module) {
  createSampleVideoMetadata();
}

module.exports = createSampleVideoMetadata;
