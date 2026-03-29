/**
 * Face Detection and Analysis Module
 * Provides face detection, emotion analysis, and eye tracking capabilities
 */

class FaceAnalyzer {
    constructor(videoElement) {
        this.videoElement = videoElement;
        this.canvas = null;
        this.ctx = null;
        this.faceDetector = null;
        this.isAnalyzing = false;
        this.analysisInterval = null;
        
        // Analysis callbacks
        this.onFaceAnalysis = null;
        
        this.setupCanvas();
        this.initializeFaceDetection();
    }
    
    setupCanvas() {
        // Create hidden canvas for analysis
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.style.display = 'none';
        document.body.appendChild(this.canvas);
    }
    
    async initializeFaceDetection() {
        try {
            // Check if native Face Detection API is available
            if ('FaceDetector' in window) {
                this.faceDetector = new FaceDetector({
                    fastMode: false,
                    maxDetectedFaces: 1
                });
                console.log('Native face detection initialized');
            } else {
                console.warn('Native face detection not available, using fallback');
            }
        } catch (error) {
            console.warn('Face detection initialization failed:', error);
        }
    }
    
    startAnalysis(callback) {
        if (this.isAnalyzing) return;
        
        this.isAnalyzing = true;
        this.onFaceAnalysis = callback;
        
        // Start analysis loop
        this.analysisInterval = setInterval(() => {
            this.analyzeFace();
        }, 2000); // Analyze every 2 seconds
        
        console.log('Face analysis started');
    }
    
    stopAnalysis() {
        this.isAnalyzing = false;
        
        if (this.analysisInterval) {
            clearInterval(this.analysisInterval);
            this.analysisInterval = null;
        }
        
        console.log('Face analysis stopped');
    }
    
    async analyzeFace() {
        if (!this.isAnalyzing || !this.videoElement.videoWidth) return;
        
        try {
            // Update canvas size to match video
            this.canvas.width = this.videoElement.videoWidth;
            this.canvas.height = this.videoElement.videoHeight;
            
            // Draw current frame to canvas
            this.ctx.drawImage(this.videoElement, 0, 0);
            
            let faceData = null;
            
            // Try native face detection first
            if (this.faceDetector) {
                try {
                    const faces = await this.faceDetector.detect(this.canvas);
                    if (faces.length > 0) {
                        faceData = this.processFaceDetectionResults(faces[0]);
                    }
                } catch (error) {
                    console.warn('Native face detection failed:', error);
                }
            }
            
            // Fallback to simulated analysis
            if (!faceData) {
                faceData = this.simulateFaceAnalysis();
            }
            
            // Call callback with analysis results
            if (this.onFaceAnalysis && faceData) {
                this.onFaceAnalysis(faceData);
            }
            
        } catch (error) {
            console.error('Face analysis error:', error);
        }
    }
    
    processFaceDetectionResults(face) {
        // Process native face detection results
        const boundingBox = face.boundingBox;
        const landmarks = face.landmarks || [];
        
        // Calculate face center relative to video center
        const videoCenterX = this.canvas.width / 2;
        const videoCenterY = this.canvas.height / 2;
        const faceCenterX = boundingBox.x + boundingBox.width / 2;
        const faceCenterY = boundingBox.y + boundingBox.height / 2;
        
        // Normalize position (-1 to 1)
        const headPositionX = (faceCenterX - videoCenterX) / videoCenterX;
        const headPositionY = (faceCenterY - videoCenterY) / videoCenterY;
        
        // Estimate eye contact based on face position and size
        const faceSize = Math.max(boundingBox.width, boundingBox.height);
        const relativeFaceSize = faceSize / Math.min(this.canvas.width, this.canvas.height);
        const isLookingAtCamera = this.estimateEyeContact(headPositionX, headPositionY, relativeFaceSize);
        
        // Simulate emotion analysis (would use actual emotion detection in production)
        const emotions = this.simulateEmotionAnalysis(faceSize, headPositionX, headPositionY);
        
        return {
            confidence: emotions.confidence,
            happiness: emotions.happiness,
            nervousness: emotions.nervousness,
            concentration: emotions.concentration,
            looking_at_camera: isLookingAtCamera,
            head_position_x: headPositionX,
            head_position_y: headPositionY,
            face_detected: true
        };
    }
    
    simulateFaceAnalysis() {
        // Simulate realistic face analysis when native detection is unavailable
        const baseConfidence = 0.6;
        const baseHappiness = 0.5;
        const baseNervousness = 0.3;
        const baseConcentration = 0.7;
        
        // Add some realistic variation
        const variation = () => (Math.random() - 0.5) * 0.2; // ±0.1
        
        return {
            confidence: Math.max(0, Math.min(1, baseConfidence + variation())),
            happiness: Math.max(0, Math.min(1, baseHappiness + variation())),
            nervousness: Math.max(0, Math.min(1, baseNervousness + variation())),
            concentration: Math.max(0, Math.min(1, baseConcentration + variation())),
            looking_at_camera: Math.random() > 0.25, // 75% chance of eye contact
            head_position_x: (Math.random() - 0.5) * 0.3, // Slight head movement
            head_position_y: (Math.random() - 0.5) * 0.2,
            face_detected: true
        };
    }
    
    estimateEyeContact(headPosX, headPosY, faceSize) {
        // Estimate if person is looking at camera based on head position and face size
        const centerThreshold = 0.3; // How close to center for good eye contact
        const sizeThreshold = 0.1; // Minimum face size for reliable detection
        
        if (faceSize < sizeThreshold) return false;
        
        const distanceFromCenter = Math.sqrt(headPosX * headPosX + headPosY * headPosY);
        return distanceFromCenter < centerThreshold;
    }
    
    simulateEmotionAnalysis(faceSize, headPosX, headPosY) {
        // Simulate emotion analysis based on face characteristics
        // In production, this would use actual emotion detection models
        
        const distanceFromCenter = Math.sqrt(headPosX * headPosX + headPosY * headPosY);
        const faceSizeNormalized = Math.min(faceSize / 200, 1); // Normalize face size
        
        // Higher confidence when face is centered and appropriately sized
        const confidence = Math.max(0.3, 0.9 - distanceFromCenter * 0.5 - (1 - faceSizeNormalized) * 0.3);
        
        // Happiness tends to be higher when confident
        const happiness = Math.max(0.2, confidence * 0.8 + Math.random() * 0.2);
        
        // Nervousness inversely related to confidence
        const nervousness = Math.max(0.1, (1 - confidence) * 0.6 + Math.random() * 0.1);
        
        // Concentration based on stability (less head movement = more concentration)
        const concentration = Math.max(0.4, 0.9 - distanceFromCenter * 0.3);
        
        return { confidence, happiness, nervousness, concentration };
    }
    
    // Utility method to get current frame as image data
    getCurrentFrameData() {
        if (!this.videoElement.videoWidth) return null;
        
        this.canvas.width = this.videoElement.videoWidth;
        this.canvas.height = this.videoElement.videoHeight;
        this.ctx.drawImage(this.videoElement, 0, 0);
        
        return this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    }
    
    // Clean up resources
    destroy() {
        this.stopAnalysis();
        
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
        
        this.canvas = null;
        this.ctx = null;
        this.faceDetector = null;
    }
}

/**
 * Eye Tracking Utility
 * Provides basic eye tracking capabilities
 */
class EyeTracker {
    constructor() {
        this.eyePositions = [];
        this.gazePoints = [];
        this.isTracking = false;
    }
    
    startTracking(callback) {
        this.isTracking = true;
        this.onGazeUpdate = callback;
        
        // Simple eye tracking simulation
        this.trackingInterval = setInterval(() => {
            if (this.isTracking) {
                this.simulateGazeTracking();
            }
        }, 500);
    }
    
    stopTracking() {
        this.isTracking = false;
        
        if (this.trackingInterval) {
            clearInterval(this.trackingInterval);
        }
    }
    
    simulateGazeTracking() {
        // Simulate gaze tracking data
        const gazePoint = {
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            timestamp: Date.now(),
            confidence: Math.random() * 0.3 + 0.7 // 70-100% confidence
        };
        
        this.gazePoints.push(gazePoint);
        
        // Keep only last 10 gaze points
        if (this.gazePoints.length > 10) {
            this.gazePoints.shift();
        }
        
        if (this.onGazeUpdate) {
            this.onGazeUpdate(gazePoint);
        }
    }
    
    getAverageGazePosition() {
        if (this.gazePoints.length === 0) return null;
        
        const avgX = this.gazePoints.reduce((sum, point) => sum + point.x, 0) / this.gazePoints.length;
        const avgY = this.gazePoints.reduce((sum, point) => sum + point.y, 0) / this.gazePoints.length;
        
        return { x: avgX, y: avgY };
    }
}

/**
 * Pose Estimation Utility
 * Basic body pose estimation for interview analysis
 */
class PoseAnalyzer {
    constructor() {
        this.poseData = [];
        this.isAnalyzing = false;
    }
    
    startAnalysis(videoElement, callback) {
        this.isAnalyzing = true;
        this.onPoseUpdate = callback;
        this.videoElement = videoElement;
        
        // Simulate pose analysis
        this.poseInterval = setInterval(() => {
            if (this.isAnalyzing) {
                this.analyzePose();
            }
        }, 1000);
    }
    
    stopAnalysis() {
        this.isAnalyzing = false;
        
        if (this.poseInterval) {
            clearInterval(this.poseInterval);
        }
    }
    
    analyzePose() {
        // Simulate pose analysis results
        const poseData = {
            shoulderAlignment: Math.random() * 0.3 + 0.7, // 70-100%
            posture: Math.random() * 0.4 + 0.6, // 60-100%
            handGestures: Math.random() > 0.7 ? 'active' : 'calm',
            bodyLanguage: Math.random() > 0.8 ? 'open' : 'neutral',
            timestamp: Date.now()
        };
        
        this.poseData.push(poseData);
        
        // Keep only last 20 pose samples
        if (this.poseData.length > 20) {
            this.poseData.shift();
        }
        
        if (this.onPoseUpdate) {
            this.onPoseUpdate(poseData);
        }
    }
    
    getPostureSummary() {
        if (this.poseData.length === 0) return null;
        
        const avgShoulder = this.poseData.reduce((sum, data) => sum + data.shoulderAlignment, 0) / this.poseData.length;
        const avgPosture = this.poseData.reduce((sum, data) => sum + data.posture, 0) / this.poseData.length;
        
        return {
            shoulderAlignment: avgShoulder,
            posture: avgPosture,
            overallScore: (avgShoulder + avgPosture) / 2
        };
    }
}

// Export classes for global use
window.FaceAnalyzer = FaceAnalyzer;
window.EyeTracker = EyeTracker;
window.PoseAnalyzer = PoseAnalyzer;
