import { useState, useRef, useEffect } from "react";
import { Camera, RotateCcw, Zap, ZapOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// MediaPipe Face Detection
declare global {
  interface Window {
    FaceDetector?: any;
    FilesetResolver?: any;
  }
}

interface CameraCaptureProps {
  onCapture: (imageData: string) => void;
  isProcessing: boolean;
  kioskMode?: boolean;
}

const CameraCapture = ({ onCapture, isProcessing, kioskMode = false }: CameraCaptureProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [faceDetector, setFaceDetector] = useState<any>(null);
  const [mediapiperLoaded, setMediapipeLoaded] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [lastDetectionTime, setLastDetectionTime] = useState(0);
  const [activeIntervals, setActiveIntervals] = useState(0);

  // Initialize MediaPipe Face Detection
  useEffect(() => {
    const initializeMediaPipe = async () => {
      try {
        console.log("🔄 Attempting to initialize MediaPipe...");
        
        // Check if already loaded from NPM package
        if (typeof window !== 'undefined') {
          try {
            // Try importing from the installed NPM package first
            const { FaceDetector, FilesetResolver } = await import('@mediapipe/tasks-vision');
            console.log("✅ MediaPipe imported from NPM package");
            
            const vision = await FilesetResolver.forVisionTasks(
              "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
            );

            const detector = await FaceDetector.createFromOptions(vision, {
              baseOptions: {
                modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/latest/blaze_face_short_range.tflite"
              },
              runningMode: "VIDEO",
              minDetectionConfidence: 0.5
            });

            setFaceDetector(detector);
            setMediapipeLoaded(true);
            console.log("✅ MediaPipe Face Detector initialized from NPM");
            return;
          } catch (npmError) {
            console.log("⚠️ NPM import failed, trying CDN:", npmError);
          }
        }

        // Fallback to CDN loading
        if (!window.FaceDetector || !window.FilesetResolver) {
          console.log("📥 Loading MediaPipe from CDN...");
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/vision_bundle.js';
          script.crossOrigin = 'anonymous';
          
          // Add script to head
          document.head.appendChild(script);
          
          // Wait for script to load with timeout
          await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
              reject(new Error("MediaPipe CDN loading timeout"));
            }, 10000); // 10 second timeout
            
            script.onload = () => {
              clearTimeout(timeout);
              console.log("✅ MediaPipe CDN script loaded");
              resolve(true);
            };
            script.onerror = (error) => {
              clearTimeout(timeout);
              reject(error);
            };
          });
        }

        // Initialize face detector
        console.log("🔧 Creating face detector...");
        const vision = await window.FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );

        const detector = await window.FaceDetector.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/latest/blaze_face_short_range.tflite"
          },
          runningMode: "VIDEO",
          minDetectionConfidence: 0.5
        });

        setFaceDetector(detector);
        setMediapipeLoaded(true);
        console.log("✅ MediaPipe Face Detector initialized from CDN");

      } catch (error) {
        console.error("❌ Failed to initialize MediaPipe:", error);
        console.error("Error details:", error.message);
        setMediapipeLoaded(false);
        
        // Show user-friendly error
        console.log("🔄 MediaPipe failed - will use fallback mode without smart detection");
      }
    };

    initializeMediaPipe();
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: kioskMode ? 720 : 720 },  // Portrait: width smaller than height
          height: { ideal: kioskMode ? 1280 : 720 }  // Portrait: height larger than width
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreaming(true);
        setHasPermission(true);
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      setHasPermission(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      setIsStreaming(false);
    }
  };

  const switchCamera = () => {
    stopCamera();
    setFacingMode(prev => prev === "user" ? "environment" : "user");
  };

  const captureImage = () => {
    console.log("📸 CAPTURE IMAGE CALLED - sending to backend!");
    
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL("image/jpeg", 0.8);
        console.log("📤 Sending image to backend via onCapture callback");
        onCapture(imageData);
      }
    } else {
      console.log("❌ Cannot capture: video or canvas not ready");
    }
  };

  // Detect faces using MediaPipe
  const detectFaces = async () => {
    if (!faceDetector || !videoRef.current || !isStreaming || isProcessing) {
      console.log("🚫 Face detection skipped:", {
        faceDetector: !!faceDetector,
        video: !!videoRef.current,
        isStreaming,
        isProcessing
      });
      return false;
    }

    try {
      const currentTime = performance.now();
      
      // Only detect every 500ms to reduce CPU usage
      if (currentTime - lastDetectionTime < 500) {
        console.log("⏱️ Using cached detection result:", faceDetected);
        return faceDetected;
      }

      console.log("🔍 Running MediaPipe face detection...");
      const results = await faceDetector.detectForVideo(videoRef.current, currentTime);
      const hasFace = results.detections && results.detections.length > 0;
      
      console.log("📊 MediaPipe results:", {
        detectionsFound: results.detections?.length || 0,
        hasFace,
        detections: results.detections?.map((d: any) => ({
          confidence: d.categories?.[0]?.score,
          bbox: d.boundingBox
        }))
      });
      
      setFaceDetected(hasFace);
      setLastDetectionTime(currentTime);
      
      return hasFace;
    } catch (error) {
      console.error("❌ Face detection error:", error);
      // On error, return false to prevent unnecessary API calls
      setFaceDetected(false);
      return false;
    }
  };

  // Auto-capture in kiosk mode when face is detected
  useEffect(() => {
    if (kioskMode && isStreaming && !isProcessing && mediapiperLoaded) {
      console.log("🎯 Starting smart face detection mode");
      setActiveIntervals(prev => prev + 1);
      
      const interval = setInterval(async () => {
        const hasFace = await detectFaces();
        
        console.log(`🔍 Face detection result: ${hasFace ? 'FACE DETECTED' : 'NO FACE'}`);
        
        // Only capture if a face is detected
        if (hasFace) {
          console.log("👤 Face detected - sending to backend for recognition");
          captureImage();
        } else {
          console.log("⏭️ No face detected - skipping backend call");
        }
      }, 1000); // Check every 1 second
      
      return () => {
        console.log("🛑 Stopping smart face detection mode");
        setActiveIntervals(prev => prev - 1);
        clearInterval(interval);
      };
    }
  }, [kioskMode, isStreaming, isProcessing, faceDetector, mediapiperLoaded]);

  // Fallback for when MediaPipe fails - TEMPORARILY DISABLED FOR DEBUGGING
  useEffect(() => {
    if (kioskMode && isStreaming && !isProcessing && !mediapiperLoaded) {
      console.log("⚠️ MediaPipe not available - FALLBACK DISABLED FOR DEBUGGING");
      console.log("🚫 No auto-capture will occur until MediaPipe loads");
      // TEMPORARILY DISABLED - uncomment below to enable fallback
      /*
      setActiveIntervals(prev => prev + 1);
      
      const interval = setInterval(() => {
        console.log("📸 Fallback mode - capturing image");
        captureImage();
      }, 3000); // Less frequent fallback
      
      return () => {
        console.log("🛑 Stopping fallback mode");
        setActiveIntervals(prev => prev - 1);
        clearInterval(interval);
      };
      */
    }
  }, [kioskMode, isStreaming, isProcessing, mediapiperLoaded]);

  // Debug logging for state changes
  useEffect(() => {
    console.log("📊 State Update:", {
      kioskMode,
      isStreaming,
      isProcessing,
      mediapiperLoaded,
      faceDetected,
      faceDetectorReady: !!faceDetector,
      activeIntervals
    });
  }, [kioskMode, isStreaming, isProcessing, mediapiperLoaded, faceDetected, faceDetector, activeIntervals]);

  useEffect(() => {
    if (facingMode) {
      startCamera();
    }
    
    return () => {
      stopCamera();
    };
  }, [facingMode]);

  if (hasPermission === false) {
    return (
      <Card className={`${kioskMode ? 'bg-gray-800 border-gray-600' : 'bg-red-50 border-red-200'}`}>
        <CardContent className="p-6 text-center">
          <Camera className={`w-16 h-16 mx-auto mb-4 ${kioskMode ? 'text-gray-400' : 'text-red-400'}`} />
          <h3 className={`text-lg font-semibold mb-2 ${kioskMode ? 'text-white' : 'text-red-800'}`}>
            Camera Access Required
          </h3>
          <p className={`mb-4 ${kioskMode ? 'text-gray-300' : 'text-red-600'}`}>
            Please allow camera access to use face recognition.
          </p>
          <Button 
            onClick={startCamera} 
            variant="outline" 
            className={kioskMode ? 'border-gray-300 text-gray-300' : 'border-red-300 text-red-700'}
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`overflow-hidden ${kioskMode ? 'bg-gray-800 border-gray-600 h-full' : ''}`}>
      <CardContent className={`${kioskMode ? 'p-0 h-full' : 'p-0'}`}>
        <div className={`relative ${kioskMode ? 'h-full' : ''}`}>
          {/* Camera Preview */}
          <div className={`relative bg-black ${kioskMode ? 'aspect-[9/16] w-full max-h-full' : 'aspect-square'} rounded-lg overflow-hidden mx-auto`}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            
            {/* Face Detection Overlay */}
            <div className={`absolute inset-0 border-2 ${
              faceDetected 
                ? 'border-green-300 border-solid' 
                : kioskMode 
                  ? 'border-blue-300 border-dashed' 
                  : 'border-blue-400 border-dashed'
            } opacity-75 ${kioskMode ? 'm-8' : 'm-8'} rounded-lg transition-all duration-300`}></div>
            
            {/* Processing Overlay */}
            {isProcessing && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="text-center text-white">
                  <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-2"></div>
                  <p className={`${kioskMode ? 'text-lg' : 'text-sm'}`}>Recognizing face...</p>
                </div>
              </div>
            )}
            
            {/* Camera Status */}
            <div className="absolute top-4 left-4">
              {isStreaming ? (
                <div className="flex items-center space-x-2 bg-green-500 text-white px-3 py-1 rounded-full text-sm">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  <span>Live</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2 bg-gray-500 text-white px-3 py-1 rounded-full text-sm">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  <span>Offline</span>
                </div>
              )}
            </div>

            {/* Face Detection Status */}
            {kioskMode && mediapiperLoaded && (
              <div className="absolute top-4 right-4">
                <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
                  faceDetected 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gray-500 text-white'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    faceDetected ? 'bg-white animate-pulse' : 'bg-gray-300'
                  }`}></div>
                  <span>{faceDetected ? 'Face Detected' : 'No Face'}</span>
                </div>
              </div>
            )}

            {/* Kiosk Mode Instruction - Move to bottom */}
            {kioskMode && !isProcessing && (
              <div className="absolute bottom-4 left-4 right-4">
                <div className="bg-black/60 text-white px-4 py-2 rounded-lg text-center">
                  {mediapiperLoaded ? (
                    <p className="text-sm">
                      {faceDetected 
                        ? "Face detected - processing recognition..." 
                        : "Smart detection enabled - position your face in the frame"
                      }
                    </p>
                  ) : (
                    <p className="text-sm">Automatic recognition enabled - position your face in the frame</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Camera Controls - Hidden in kiosk mode */}
          {!kioskMode && (
            <div className="p-4 bg-gray-50">
              <div className="flex items-center justify-center space-x-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={switchCamera}
                  disabled={!isStreaming || isProcessing}
                  className="w-12 h-12 rounded-full"
                >
                  <RotateCcw className="w-5 h-5" />
                </Button>
                
                <Button
                  onClick={captureImage}
                  disabled={!isStreaming || isProcessing}
                  className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                  size="icon"
                >
                  <Camera className="w-8 h-8" />
                </Button>
                
                <Button
                  variant="outline"
                  size="icon"
                  onClick={isStreaming ? stopCamera : startCamera}
                  className="w-12 h-12 rounded-full"
                >
                  {isStreaming ? <ZapOff className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
                </Button>
              </div>
              
              <p className="text-center text-sm text-gray-600 mt-3">
                Position your face within the frame and tap the camera button
                {mediapiperLoaded && (
                  <span className="text-green-600 block">✓ Smart face detection enabled</span>
                )}
              </p>
            </div>
          )}
        </div>
        
        {/* Hidden Canvas for Image Capture */}
        <canvas ref={canvasRef} className="hidden" />
      </CardContent>
    </Card>
  );
};

export default CameraCapture;
