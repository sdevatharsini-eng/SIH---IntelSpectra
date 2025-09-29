const express = require('express');
const ThreatDetector = require('../services/ThreatDetector');
const auth = require('../middleware/auth');

const router = express.Router();
const threatDetector = new ThreatDetector();

// Get all threats with filtering and pagination
router.get('/', auth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      threatLevel,
      dateFrom,
      dateTo,
      cameraId,
      status = 'all'
    } = req.query;

    // Mock threat data for demo
    const mockThreats = [
      {
        id: 'threat_001',
        type: 'person',
        threatLevel: 'medium',
        confidence: 0.89,
        status: 'active',
        timestamp: new Date(Date.now() - 3600000), // 1 hour ago
        cameraId: 'cam_001',
        location: { x: 120, y: 80, width: 100, height: 200 },
        description: 'Unidentified person in restricted area',
        riskScore: 0.75,
        actions: ['alert_sent', 'security_notified']
      },
      {
        id: 'threat_002',
        type: 'abandoned_object',
        threatLevel: 'high',
        confidence: 0.94,
        status: 'investigating',
        timestamp: new Date(Date.now() - 1800000), // 30 minutes ago
        cameraId: 'cam_003',
        location: { x: 300, y: 200, width: 60, height: 40 },
        description: 'Suspicious bag left unattended for 25 minutes',
        riskScore: 0.92,
        actions: ['alert_sent', 'security_dispatched', 'area_cordoned']
      },
      {
        id: 'threat_003',
        type: 'weapon',
        threatLevel: 'critical',
        confidence: 0.87,
        status: 'resolved',
        timestamp: new Date(Date.now() - 7200000), // 2 hours ago
        cameraId: 'cam_002',
        location: { x: 450, y: 150, width: 30, height: 80 },
        description: 'Potential weapon detected',
        riskScore: 0.95,
        actions: ['immediate_alert', 'security_dispatched', 'authorities_contacted', 'resolved']
      },
      {
        id: 'threat_004',
        type: 'vehicle',
        threatLevel: 'low',
        confidence: 0.76,
        status: 'monitoring',
        timestamp: new Date(Date.now() - 900000), // 15 minutes ago
        cameraId: 'cam_004',
        location: { x: 200, y: 300, width: 150, height: 100 },
        description: 'Vehicle in no-parking zone',
        riskScore: 0.45,
        actions: ['alert_logged']
      }
    ];

    // Apply filters
    let filteredThreats = mockThreats;

    if (threatLevel && threatLevel !== 'all') {
      filteredThreats = filteredThreats.filter(t => t.threatLevel === threatLevel);
    }

    if (status && status !== 'all') {
      filteredThreats = filteredThreats.filter(t => t.status === status);
    }

    if (cameraId) {
      filteredThreats = filteredThreats.filter(t => t.cameraId === cameraId);
    }

    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      filteredThreats = filteredThreats.filter(t => t.timestamp >= fromDate);
    }

    if (dateTo) {
      const toDate = new Date(dateTo);
      filteredThreats = filteredThreats.filter(t => t.timestamp <= toDate);
    }

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedThreats = filteredThreats.slice(startIndex, endIndex);

    res.json({
      success: true,
      threats: paginatedThreats,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(filteredThreats.length / limit),
        totalItems: filteredThreats.length,
        itemsPerPage: parseInt(limit)
      },
      summary: {
        total: filteredThreats.length,
        critical: filteredThreats.filter(t => t.threatLevel === 'critical').length,
        high: filteredThreats.filter(t => t.threatLevel === 'high').length,
        medium: filteredThreats.filter(t => t.threatLevel === 'medium').length,
        low: filteredThreats.filter(t => t.threatLevel === 'low').length,
        active: filteredThreats.filter(t => t.status === 'active').length,
        resolved: filteredThreats.filter(t => t.status === 'resolved').length
      }
    });

  } catch (error) {
    console.error('Threats retrieval error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get specific threat details
router.get('/:threatId', auth, async (req, res) => {
  try {
    const { threatId } = req.params;

    // Mock threat detail
    const threatDetail = {
      id: threatId,
      type: 'abandoned_object',
      threatLevel: 'high',
      confidence: 0.94,
      status: 'investigating',
      timestamp: new Date(Date.now() - 1800000),
      cameraId: 'cam_003',
      location: { x: 300, y: 200, width: 60, height: 40 },
      description: 'Suspicious bag left unattended for 25 minutes',
      riskScore: 0.92,
      actions: [
        {
          type: 'alert_sent',
          timestamp: new Date(Date.now() - 1800000),
          user: 'system',
          details: 'Automatic alert generated'
        },
        {
          type: 'security_notified',
          timestamp: new Date(Date.now() - 1740000),
          user: 'operator_001',
          details: 'Security team notified via radio'
        },
        {
          type: 'security_dispatched',
          timestamp: new Date(Date.now() - 1680000),
          user: 'security_chief',
          details: 'Unit 3 dispatched to investigate'
        }
      ],
      relatedEvents: [
        {
          id: 'event_001',
          type: 'person_detected',
          timestamp: new Date(Date.now() - 2100000),
          description: 'Person placed object and left area'
        }
      ],
      evidence: [
        {
          type: 'video_clip',
          url: '/api/video/evidence/threat_002_clip.mp4',
          timestamp: new Date(Date.now() - 1800000),
          duration: 30
        },
        {
          type: 'screenshot',
          url: '/api/video/evidence/threat_002_screenshot.jpg',
          timestamp: new Date(Date.now() - 1800000)
        }
      ]
    };

    res.json({
      success: true,
      threat: threatDetail
    });

  } catch (error) {
    console.error('Threat detail error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update threat status
router.put('/:threatId/status', auth, async (req, res) => {
  try {
    const { threatId } = req.params;
    const { status, notes, userId } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const validStatuses = ['active', 'investigating', 'resolved', 'false_positive'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Mock status update
    const updatedThreat = {
      id: threatId,
      status,
      updatedAt: new Date(),
      updatedBy: userId || req.user.userId,
      notes
    };

    res.json({
      success: true,
      message: 'Threat status updated successfully',
      threat: updatedThreat
    });

  } catch (error) {
    console.error('Threat status update error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add action to threat
router.post('/:threatId/actions', auth, async (req, res) => {
  try {
    const { threatId } = req.params;
    const { actionType, details, userId } = req.body;

    if (!actionType) {
      return res.status(400).json({ error: 'Action type is required' });
    }

    const newAction = {
      id: `action_${Date.now()}`,
      type: actionType,
      timestamp: new Date(),
      user: userId || req.user.userId,
      details: details || '',
      threatId
    };

    res.json({
      success: true,
      message: 'Action added successfully',
      action: newAction
    });

  } catch (error) {
    console.error('Add action error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get threat statistics
router.get('/stats/summary', auth, async (req, res) => {
  try {
    const { period = '24h' } = req.query;

    // Mock statistics
    const stats = {
      period,
      totalThreats: 47,
      newThreats: 12,
      resolvedThreats: 8,
      activeThreats: 15,
      falsePositives: 3,
      averageResponseTime: 4.2, // minutes
      threatsByLevel: {
        critical: 2,
        high: 8,
        medium: 18,
        low: 19
      },
      threatsByType: {
        person: 20,
        vehicle: 12,
        abandoned_object: 8,
        weapon: 3,
        suspicious_behavior: 4
      },
      threatsByCamera: {
        cam_001: 12,
        cam_002: 8,
        cam_003: 15,
        cam_004: 7,
        cam_005: 5
      },
      hourlyDistribution: Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        count: Math.floor(Math.random() * 5) + 1
      })),
      responseMetrics: {
        averageDetectionTime: 1.8, // seconds
        averageAlertTime: 0.3, // seconds
        averageResponseTime: 4.2 // minutes
      }
    };

    res.json({
      success: true,
      stats,
      generatedAt: new Date()
    });

  } catch (error) {
    console.error('Threat statistics error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Export threat data
router.get('/export/:format', auth, async (req, res) => {
  try {
    const { format } = req.params;
    const { dateFrom, dateTo, threatLevel, status } = req.query;

    if (!['json', 'csv', 'pdf'].includes(format)) {
      return res.status(400).json({ error: 'Invalid export format' });
    }

    // Mock export data
    const exportData = {
      exportId: `export_${Date.now()}`,
      format,
      filters: { dateFrom, dateTo, threatLevel, status },
      recordCount: 47,
      generatedAt: new Date(),
      downloadUrl: `/api/threats/download/export_${Date.now()}.${format}`
    };

    res.json({
      success: true,
      message: 'Export generated successfully',
      export: exportData
    });

  } catch (error) {
    console.error('Threat export error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
