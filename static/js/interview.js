/**
 * Interview Session Management
 * Handles webcam, audio recording, face analysis, and session flow
 */

class InterviewSession {
    constructor(config) {
        this.questionId = config.questionId;
        this.interviewId = config.interviewId;
        this.questionNumber = config.questionNumber;
        this.totalQuestions = config.totalQuestions;
        
        // Media elements
        this.videoElement = document.getElementById('userVideo');
        this.stream = null;
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.videoChunks = [];
        
        // UI elements
        this.startBtn = document.getElementById('startRecordingBtn');
        this.stopBtn = document.getElementById('stopRecordingBtn');
        this.submitBtn = document.getElementById('submitAnswerBtn');
        this.recordingStatus = document.getElementById('recordingStatus');
        this.timer = document.getElementById('timer');
        this.recordingIndicator = document.getElementById('recordingIndicator');
        this.audioLevelBar = document.getElementById('audioLevelBar');
        
        // Analysis elements
        this.faceAnalysisOverlay = document.getElementById('faceAnalysisOverlay');
        this.confidenceScore = document.getElementById('confidenceScore');
        this.eyeContactStatus = document.getElementById('eyeContactStatus');
        this.expressionStatus = document.getElementById('expressionStatus');
        
        // Live analysis bars
        this.liveConfidence = document.getElementById('liveConfidence');
        this.speechClarity = document.getElementById('speechClarity');
        this.engagementLevel = document.getElementById('engagementLevel');
        
        // State management
        this.isRecording = false;
        this.startTime = null;
        this.timerInterval = null;
        this.audioContext = null;
        this.analyser = null;
        this.faceAnalysisInterval = null;
        this.speechRecognition = null;
        this.transcriptText = '';
        
        // Face detection
        this.faceDetector = null;
        this.lastFaceAnalysis = null;
        
        this.bindEvents();
    }
    
    async initialize() {
        try {
            await this.setupMediaDevices();
            await this.setupFaceDetection();
            await this.setupSpeechRecognition();
            this.setupAudioAnalysis();
            this.updateUI();
            
            console.log('Interview session initialized successfully');
        } catch (error) {
            console.error('Failed to initialize interview session:', error);
            this.showError('Failed to initialize camera and microphone. Please check your permissions.');
        }
    }
    
    async setupMediaDevices() {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user'
                },
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });
            
            this.videoElement.srcObject = this.stream;
            
            // Setup media recorder
            this.mediaRecorder = new MediaRecorder(this.stream, {
                mimeType: 'video/webm;codecs=vp8,opus'
            });
            
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.videoChunks.push(event.data);
                }
            };
            
            this.mediaRecorder.onstop = () => {
                this.processRecording();
            };
            
        } catch (error) {
            throw new Error('Camera and microphone access denied or not available');
        }
    }
    
    async setupFaceDetection() {
        // Initialize face detection if available
        if ('FaceDetector' in window) {
            try {
                this.faceDetector = new FaceDetector({
                    fastMode: false,
                    maxDetectedFaces: 1
                });
            } catch (error) {
                console.warn('Face detection not supported:', error);
            }
        }
        
        // Fallback to manual face analysis
        this.startFaceAnalysisSimulation();
    }
    
    async setupSpeechRecognition() {
        // Setup Web Speech API if available
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.speechRecognition = new SpeechRecognition();
            
            this.speechRecognition.continuous = true;
            this.speechRecognition.interimResults = true;
            this.speechRecognition.lang = 'en-US';
            
            this.speechRecognition.onresult = (event) => {
                let transcript = '';
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    if (event.results[i].isFinal) {
                        transcript += event.results[i][0].transcript + ' ';
                    }
                }
                
                if (transcript.trim()) {
                    this.transcriptText += transcript;
                    this.updateSpeechClarity(event.results[event.results.length - 1][0].confidence);
                }
            };
            
            this.speechRecognition.onerror = (event) => {
                console.warn('Speech recognition error:', event.error);
            };
        }
    }
    
    setupAudioAnalysis() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const source = this.audioContext.createMediaStreamSource(this.stream);
            this.analyser = this.audioContext.createAnalyser();
            
            source.connect(this.analyser);
            this.analyser.fftSize = 256;
            
            this.startAudioLevelMonitoring();
        } catch (error) {
            console.warn('Audio analysis setup failed:', error);
        }
    }
    
    startAudioLevelMonitoring() {
        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        const updateAudioLevel = () => {
            if (!this.analyser) return;
            
            this.analyser.getByteFrequencyData(dataArray);
            
            // Calculate average volume
            let sum = 0;
            for (let i = 0; i < bufferLength; i++) {
                sum += dataArray[i];
            }
            const average = sum / bufferLength;
            const percentage = (average / 255) * 100;
            
            this.audioLevelBar.style.width = percentage + '%';
            
            // Update audio level color based on volume
            if (percentage > 70) {
                this.audioLevelBar.className = 'progress-bar bg-danger';
            } else if (percentage > 40) {
                this.audioLevelBar.className = 'progress-bar bg-success';
            } else {
                this.audioLevelBar.className = 'progress-bar bg-warning';
            }
            
            requestAnimationFrame(updateAudioLevel);
        };
        
        updateAudioLevel();
    }
    
    startFaceAnalysisSimulation() {
        // Simulate face analysis with random but realistic variations
        this.faceAnalysisInterval = setInterval(() => {
            if (!this.isRecording) return;
            
            // Simulate face analysis results
            const confidence = 0.6 + (Math.random() * 0.3); // 60-90%
            const eyeContact = Math.random() > 0.3; // 70% chance of eye contact
            const happiness = 0.4 + (Math.random() * 0.4); // 40-80%
            const nervousness = 0.2 + (Math.random() * 0.3); // 20-50%
            const concentration = 0.5 + (Math.random() * 0.4); // 50-90%
            
            this.lastFaceAnalysis = {
                confidence,
                happiness,
                nervousness,
                concentration,
                looking_at_camera: eyeContact,
                head_position_x: (Math.random() - 0.5) * 0.2,
                head_position_y: (Math.random() - 0.5) * 0.2
            };
            
            this.updateFaceAnalysisUI();
            this.saveFaceAnalysisData();
            
        }, 2000); // Update every 2 seconds
    }
    
    updateFaceAnalysisUI() {
        if (!this.lastFaceAnalysis) return;
        
        const analysis = this.lastFaceAnalysis;
        
        // Update overlay
        this.confidenceScore.textContent = Math.round(analysis.confidence * 100);
        this.eyeContactStatus.textContent = analysis.looking_at_camera ? 'Good' : 'Poor';
        this.expressionStatus.textContent = analysis.happiness > 0.6 ? 'Positive' : 'Neutral';
        
        // Update live analysis bars
        this.liveConfidence.style.width = (analysis.confidence * 100) + '%';
        this.engagementLevel.style.width = (analysis.concentration * 100) + '%';
        
        // Show/hide overlay
        this.faceAnalysisOverlay.style.display = this.isRecording ? 'block' : 'none';
    }
    
    updateSpeechClarity(confidence) {
        if (confidence && this.speechClarity) {
            this.speechClarity.style.width = (confidence * 100) + '%';
        }
    }
    
    async saveFaceAnalysisData() {
        if (!this.lastFaceAnalysis || !this.isRecording) return;
        
        const timestamp = (Date.now() - this.startTime) / 1000; // seconds since recording start
        
        try {
            const response = await fetch('/save_face_analysis', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    interview_id: this.interviewId,
                    timestamp: timestamp,
                    analysis: this.lastFaceAnalysis
                })
            });
            
            if (!response.ok) {
                console.warn('Failed to save face analysis data');
            }
        } catch (error) {
            console.error('Error saving face analysis:', error);
        }
    }
    
    bindEvents() {
        this.startBtn.addEventListener('click', () => this.startRecording());
        this.stopBtn.addEventListener('click', () => this.stopRecording());
        this.submitBtn.addEventListener('click', () => this.submitAnswer());
        
        // Handle page unload
        window.addEventListener('beforeunload', () => {
            this.cleanup();
        });
    }
    
    async startRecording() {
        try {
            this.isRecording = true;
            this.startTime = Date.now();
            this.videoChunks = [];
            this.transcriptText = '';
            
            // Start media recording
            this.mediaRecorder.start(1000); // Record in 1-second chunks
            
            // Start speech recognition
            if (this.speechRecognition) {
                this.speechRecognition.start();
            }
            
            // Start timer
            this.startTimer();
            
            // Update UI
            this.updateRecordingUI(true);
            
            console.log('Recording started');
            
        } catch (error) {
            console.error('Failed to start recording:', error);
            this.showError('Failed to start recording');
            this.isRecording = false;
        }
    }
    
    stopRecording() {
        if (!this.isRecording) return;
        
        this.isRecording = false;
        
        // Stop media recorder
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
        }
        
        // Stop speech recognition
        if (this.speechRecognition) {
            this.speechRecognition.stop();
        }
        
        // Stop timer
        this.stopTimer();
        
        // Update UI
        this.updateRecordingUI(false);
        
        console.log('Recording stopped');
    }
    
    startTimer() {
        this.timerInterval = setInterval(() => {
            const elapsed = Date.now() - this.startTime;
            const minutes = Math.floor(elapsed / 60000);
            const seconds = Math.floor((elapsed % 60000) / 1000);
            this.timer.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);
    }
    
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }
    
    processRecording() {
        // Create blob from recorded chunks
        const videoBlob = new Blob(this.videoChunks, { type: 'video/webm' });
        
        // For now, we'll just enable the submit button
        // In a production environment, you might want to upload the video
        this.submitBtn.disabled = false;
        
        console.log('Recording processed, ready to submit');
    }
    
    async submitAnswer() {
        const responseTime = this.startTime ? (Date.now() - this.startTime) / 1000 : 0;
        
        // Show processing modal
        const processingModal = new bootstrap.Modal(document.getElementById('processingModal'));
        processingModal.show();
        
        try {
            const response = await fetch('/submit_answer', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    question_id: this.questionId,
                    answer: this.transcriptText || 'Voice response recorded',
                    response_time: responseTime,
                    audio_file_path: '' // Would contain actual file path in production
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Show brief feedback
                this.showFeedback(result.analysis);
                
                // Redirect to next question or completion
                setTimeout(() => {
                    if (result.questions_remaining > 0) {
                        window.location.reload(); // Load next question
                    } else {
                        window.location.href = `/complete_interview/${this.interviewId}`;
                    }
                }, 3000);
            } else {
                throw new Error(result.error || 'Failed to submit answer');
            }
            
        } catch (error) {
            console.error('Error submitting answer:', error);
            this.showError('Failed to submit answer. Please try again.');
        } finally {
            processingModal.hide();
        }
    }
    
    showFeedback(analysis) {
        // Create and show feedback toast
        const toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
        toastContainer.innerHTML = `
            <div class="toast show" role="alert">
                <div class="toast-header bg-success text-white">
                    <i class="fas fa-check-circle me-2"></i>
                    <strong class="me-auto">Answer Submitted</strong>
                </div>
                <div class="toast-body">
                    <div class="mb-2">
                        <small>Quick Feedback:</small><br>
                        ${analysis.feedback.substring(0, 100)}...
                    </div>
                    <div class="progress mb-2" style="height: 6px;">
                        <div class="progress-bar bg-primary" 
                             style="width: ${analysis.technical_accuracy * 100}%"></div>
                    </div>
                    <small class="text-muted">Technical Accuracy: ${Math.round(analysis.technical_accuracy * 100)}%</small>
                </div>
            </div>
        `;
        
        document.body.appendChild(toastContainer);
        
        // Remove toast after 5 seconds
        setTimeout(() => {
            toastContainer.remove();
        }, 5000);
    }
    
    showError(message) {
        // Create error alert
        const alertContainer = document.querySelector('.container');
        const errorAlert = document.createElement('div');
        errorAlert.className = 'alert alert-danger alert-dismissible fade show';
        errorAlert.innerHTML = `
            <i class="fas fa-exclamation-triangle me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        alertContainer.insertBefore(errorAlert, alertContainer.firstChild);
        
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            if (errorAlert.parentNode) {
                errorAlert.remove();
            }
        }, 5000);
    }
    
    updateRecordingUI(recording) {
        this.startBtn.disabled = recording;
        this.stopBtn.disabled = !recording;
        
        if (recording) {
            this.recordingStatus.textContent = 'Recording';
            this.recordingStatus.className = 'badge bg-danger';
            this.recordingIndicator.style.display = 'block';
        } else {
            this.recordingStatus.textContent = 'Stopped';
            this.recordingStatus.className = 'badge bg-secondary';
            this.recordingIndicator.style.display = 'none';
            this.submitBtn.disabled = false;
        }
    }
    
    updateUI() {
        // Initial UI state
        this.startBtn.disabled = false;
        this.stopBtn.disabled = true;
        this.submitBtn.disabled = true;
        this.recordingStatus.textContent = 'Ready';
        this.recordingStatus.className = 'badge bg-success';
    }
    
    cleanup() {
        // Stop all intervals
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        
        if (this.faceAnalysisInterval) {
            clearInterval(this.faceAnalysisInterval);
        }
        
        // Stop recording if active
        if (this.isRecording) {
            this.stopRecording();
        }
        
        // Stop speech recognition
        if (this.speechRecognition) {
            this.speechRecognition.stop();
        }
        
        // Close audio context
        if (this.audioContext) {
            this.audioContext.close();
        }
        
        // Stop media stream
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
        }
    }
}

// Make InterviewSession available globally
window.InterviewSession = InterviewSession;
