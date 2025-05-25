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
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Camera className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">FaceAttend</h1>
              <p className="text-blue-100 text-sm">Face Recognition System</p>
            </div>
          </div>
          
          {/* System Status */}
          <div className="flex items-center gap-3">
            <Badge 
              variant="secondary" 
              className={`flex items-center gap-2 text-sm px-3 py-1 ${
                systemStatus.color === 'green' ? 'bg-green-600/20 text-green-100 border-green-300/30' :
                systemStatus.color === 'red' ? 'bg-red-600/20 text-red-100 border-red-300/30' :
                'bg-yellow-600/20 text-yellow-100 border-yellow-300/30'
              }`}
            >
              {systemStatus.color === 'green' ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              {systemStatus.status === 'online' ? 'System Online' : 
               systemStatus.status === 'offline' ? 'System Offline' : 'Checking...'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Time Display */}
          <Card className="bg-gradient-to-r from-gray-800 to-gray-700 border-gray-600 text-center py-6">
            <CardContent>
              <div className="text-4xl font-mono font-bold mb-2">
                {formatTime(currentTime)}
              </div>
              <div className="text-lg text-gray-300">
                {formatDate(currentTime)}
              </div>
            </CardContent>
          </Card>

          {/* Result Display */}
          {lastResult && (
            <Card className={`${
              lastResult.success 
                ? 'bg-gradient-to-r from-green-600 to-green-500 border-green-400' 
                : 'bg-gradient-to-r from-red-600 to-red-500 border-red-400'
            } animate-in slide-in-from-top-2 duration-500`}>
              <CardContent className="text-center py-8">
                <div className="flex items-center justify-center mb-4">
                  {lastResult.success ? (
                    <CheckCircle className="w-16 h-16 text-white" />
                  ) : (
                    <XCircle className="w-16 h-16 text-white" />
                  )}
                </div>
                
                {lastResult.success ? (
                  <div>
                    <h2 className="text-3xl font-bold mb-2">Welcome!</h2>
                    <p className="text-xl mb-2">{lastResult.name}</p>
                    <p className="text-lg opacity-90">Checked in at {lastResult.time}</p>
                    {lastResult.confidence && (
                      <p className="text-sm opacity-75 mt-2">
                        Confidence: {lastResult.confidence}%
                      </p>
                    )}
                  </div>
                ) : (
                  <div>
                    <h2 className="text-3xl font-bold mb-2">Access Denied</h2>
                    <p className="text-lg">{lastResult.message}</p>
                    <p className="text-sm opacity-75 mt-2">
                      Please try again or contact security
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Camera Interface */}
          <Card className="bg-gray-800 border-gray-600">
            <CardContent className="p-6">
              {!lastResult && (
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold mb-2">
                    {isProcessing ? "Processing..." : "Position Your Face"}
                  </h2>
                  <p className="text-gray-300">
                    Look directly at the camera and ensure good lighting
                  </p>
                </div>
              )}
              
              <CameraCapture
                onCapture={handleFaceCapture}
                isProcessing={isProcessing}
                kioskMode={true}
              />
              
              {isProcessing && (
                <div className="flex items-center justify-center mt-6 gap-3">
                  <RefreshCw className="w-6 h-6 animate-spin" />
                  <span className="text-lg">Recognizing face...</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Instructions */}
          {!lastResult && !isProcessing && (
            <Card className="bg-gray-800/50 border-gray-600">
              <CardContent className="text-center py-6">
                <h3 className="text-lg font-semibold mb-3">Instructions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="font-bold">1</span>
                    </div>
                    <p>Position your face in the camera frame</p>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="font-bold">2</span>
                    </div>
                    <p>Look directly at the camera</p>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="font-bold">3</span>
                    </div>
                    <p>Wait for automatic recognition</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-800 p-4 text-center text-sm text-gray-400">
        <p>For assistance, please contact security at ext. 2911</p>
      </div>
    </div>
  );
};

export default Kiosk; 