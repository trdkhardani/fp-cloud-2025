
import { useState, useRef, useEffect } from "react";
import { Camera, RotateCcw, Zap, ZapOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface CameraCaptureProps {
  onCapture: (imageData: string) => void;
  isProcessing: boolean;
}

const CameraCapture = ({ onCapture, isProcessing }: CameraCaptureProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 720 },
          height: { ideal: 720 }
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
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL("image/jpeg", 0.8);
        onCapture(imageData);
      }
    }
  };

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
      <Card className="bg-red-50 border-red-200">
        <CardContent className="p-6 text-center">
          <Camera className="w-16 h-16 mx-auto mb-4 text-red-400" />
          <h3 className="text-lg font-semibold text-red-800 mb-2">Camera Access Required</h3>
          <p className="text-red-600 mb-4">Please allow camera access to use face recognition.</p>
          <Button onClick={startCamera} variant="outline" className="border-red-300 text-red-700">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="relative">
          {/* Camera Preview */}
          <div className="relative bg-black aspect-square rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            
            {/* Face Detection Overlay */}
            <div className="absolute inset-0 border-2 border-blue-400 border-dashed opacity-50 m-8 rounded-lg"></div>
            
            {/* Processing Overlay */}
            {isProcessing && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="text-center text-white">
                  <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-2"></div>
                  <p className="text-sm">Recognizing face...</p>
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
          </div>

          {/* Camera Controls */}
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
            </p>
          </div>
        </div>
        
        {/* Hidden Canvas for Image Capture */}
        <canvas ref={canvasRef} className="hidden" />
      </CardContent>
    </Card>
  );
};

export default CameraCapture;
