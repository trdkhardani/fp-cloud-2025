import { useState, useEffect } from "react";
import { Camera, CheckCircle, XCircle, Clock, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import CameraCapture from "@/components/CameraCapture";
import { useFaceAttendance, useHealthCheck } from "@/hooks/useFaceRecognition";
import { toast } from "sonner";

const Kiosk = () => {
  const [lastResult, setLastResult] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const { processAttendance, isProcessing } = useFaceAttendance();
  const { data: health, isLoading: healthLoading } = useHealthCheck();

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Clear result after 5 seconds
  useEffect(() => {
    if (lastResult) {
      const timeout = setTimeout(() => {
        setLastResult(null);
      }, 5000);
      return () => clearTimeout(timeout);
    }
  }, [lastResult]);

  const handleFaceCapture = async (imageData: string) => {
    try {
      const result = await processAttendance(imageData, 'check-in');
      
      if (result.success) {
        setLastResult({
          success: true,
          name: result.employee?.name,
          time: new Date().toLocaleTimeString(),
          confidence: result.confidence
        });
        
        // Play success sound (if available)
        try {
          const audio = new Audio('/success.mp3');
          audio.play().catch(() => {}); // Ignore errors
        } catch {}
        
      } else {
        setLastResult({
          success: false,
          message: result.message || "Face not recognized"
        });
        
        // Play error sound (if available)
        try {
          const audio = new Audio('/error.mp3');
          audio.play().catch(() => {}); // Ignore errors
        } catch {}
      }
    } catch (error) {
      console.error("Face recognition failed:", error);
      setLastResult({
        success: false,
        message: "System error. Please try again."
      });
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getSystemStatus = () => {
    if (healthLoading) return { status: 'checking', color: 'yellow' };
    if (!health?.deepface_available) return { status: 'offline', color: 'red' };
    return { status: 'online', color: 'green' };
  };

  const systemStatus = getSystemStatus();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white overflow-hidden">
      {/* Header - More Compact */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Camera className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">FaceAttend</h1>
              <p className="text-blue-100 text-xs">Face Recognition System</p>
            </div>
          </div>
          
          {/* Compact Time Display */}
          <div className="text-center">
            <div className="text-lg font-mono font-bold">
              {formatTime(currentTime)}
            </div>
            <div className="text-xs text-blue-100">
              {formatDate(currentTime)}
            </div>
          </div>
          
          {/* System Status */}
          <div className="flex items-center gap-3">
            <Badge 
              variant="secondary" 
              className={`flex items-center gap-2 text-xs px-2 py-1 ${
                systemStatus.color === 'green' ? 'bg-green-600/20 text-green-100 border-green-300/30' :
                systemStatus.color === 'red' ? 'bg-red-600/20 text-red-100 border-red-300/30' :
                'bg-yellow-600/20 text-yellow-100 border-yellow-300/30'
              }`}
            >
              {systemStatus.color === 'green' ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              {systemStatus.status === 'online' ? 'Online' : 
               systemStatus.status === 'offline' ? 'Offline' : 'Checking...'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content - Portrait Camera Optimized */}
      <div className="flex-1 p-4 relative flex items-center justify-center">
        <div className="w-full max-w-md mx-auto">
          
          {/* Portrait Camera Interface */}
          <Card className="bg-gray-800 border-gray-600">
            <CardContent className="p-4">
              {!lastResult && !isProcessing && (
                <div className="text-center mb-4">
                  <h2 className="text-xl font-bold mb-1">Position Your Face</h2>
                  <p className="text-gray-300 text-sm">
                    Look directly at the camera and ensure good lighting
                  </p>
                </div>
              )}
              
              {/* Portrait Camera */}
              <div>
                <CameraCapture
                  onCapture={handleFaceCapture}
                  isProcessing={isProcessing}
                  kioskMode={true}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Floating Result Display - Smaller and at Top */}
      {lastResult && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none">
          <div 
            className={`${
              lastResult.success 
                ? 'bg-green-500/95 border-green-400' 
                : 'bg-red-500/95 border-red-400'
            } backdrop-blur-sm border-2 rounded-xl shadow-2xl animate-in slide-in-from-top-2 duration-500 pointer-events-auto max-w-xs mx-4`}
          >
            <div className="text-center py-4 px-4">
              <div className="flex items-center justify-center mb-2">
                {lastResult.success ? (
                  <CheckCircle className="w-8 h-8 text-white drop-shadow-lg" />
                ) : (
                  <XCircle className="w-8 h-8 text-white drop-shadow-lg" />
                )}
              </div>
              
              {lastResult.success ? (
                <div>
                  <h2 className="text-lg font-bold mb-1 text-white drop-shadow">Welcome!</h2>
                  <p className="text-sm mb-1 text-white">{lastResult.name}</p>
                  <p className="text-xs opacity-90 text-white">Checked in at {lastResult.time}</p>
                  {lastResult.confidence && (
                    <p className="text-xs opacity-75 mt-1 text-white">
                      Confidence: {lastResult.confidence}%
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <h2 className="text-lg font-bold mb-1 text-white drop-shadow">Access Denied</h2>
                  <p className="text-sm text-white mb-1">{lastResult.message}</p>
                  <p className="text-xs opacity-75 text-white">
                    Please try again or contact administrator
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Floating Processing Indicator */}
      {isProcessing && !lastResult && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-40">
          <div className="bg-blue-500/95 backdrop-blur-sm text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-3">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span className="text-sm font-medium">Recognizing face...</span>
          </div>
        </div>
      )}

      {/* Floating Instructions - Only show when no result and not processing */}
      {!lastResult && !isProcessing && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-30">
          <div className="bg-gray-800/90 backdrop-blur-sm border border-gray-600 rounded-xl px-6 py-4 max-w-2xl">
            <h3 className="text-center text-sm font-semibold mb-3 text-white">Quick Instructions</h3>
            <div className="grid grid-cols-3 gap-4 text-xs">
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="font-bold text-xs">1</span>
                </div>
                <p className="text-gray-300">Position face in frame</p>
              </div>
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="font-bold text-xs">2</span>
                </div>
                <p className="text-gray-300">Look at camera</p>
              </div>
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="font-bold text-xs">3</span>
                </div>
                <p className="text-gray-300">Wait for recognition</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="bg-gray-800 p-3 text-center text-xs text-gray-400">
        <p>For assistance, please contact security at ext. 2911</p>
      </div>
    </div>
  );
};

export default Kiosk; 