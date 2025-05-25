import { useState, useEffect } from "react";
import { Camera, CheckCircle, XCircle, Clock, RefreshCw, Wifi, WifiOff, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import CameraCapture from "@/components/CameraCapture";
import { useFaceAttendance, useHealthCheck, useAttendanceHistory } from "@/hooks/useFaceRecognition";
import { toast } from "sonner";

const Kiosk = () => {
  const [lastResult, setLastResult] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isInCooldown, setIsInCooldown] = useState(false);
  const [cooldownCountdown, setCooldownCountdown] = useState(0);
  
  const { processAttendance, isProcessing } = useFaceAttendance();
  const { data: health, isLoading: healthLoading } = useHealthCheck();
  const { data: attendanceData = [] } = useAttendanceHistory(100); // Get recent attendance records

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Clear result after showing it - longer durations for centered elegant display
  useEffect(() => {
    if (lastResult) {
      const timeout = setTimeout(() => {
        setLastResult(null);
      }, lastResult.success ? 3500 : 4500); // 3.5s for success, 4.5s for errors
      return () => clearTimeout(timeout);
    }
  }, [lastResult]);

  // Cooldown countdown timer - simplified and more robust
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isInCooldown) {
      interval = setInterval(() => {
        setCooldownCountdown(prev => {
          const newValue = prev - 1;
          
          if (newValue <= 0) {
            setIsInCooldown(false);
            return 0;
          }
          
          return newValue;
        });
      }, 1000);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isInCooldown]); // Only trigger when cooldown state changes

  // Check if user has already checked in today
  const hasCheckedInToday = (employeeId: string): boolean => {
    const today = new Date().toISOString().split('T')[0];
    
    const todayCheckIns = attendanceData.filter(record => {
      const recordDate = record.timestamp.split('T')[0];
      const isMatchingEmployee = record.employeeId === employeeId;
      const isMatchingDate = recordDate === today;
      const isCheckIn = record.type === 'check-in';
      
      return isMatchingEmployee && isCheckIn && isMatchingDate;
    });
    
    return todayCheckIns.length > 0;
  };

  const handleFaceCapture = async (imageData: string) => {
    // Prevent capture during cooldown
    if (isInCooldown) {
      return;
    }

    try {
      const result = await processAttendance(imageData, 'check-in');
      
      // If face recognition was successful, always start cooldown
      if (result.success) {
        // Check for duplicate check-in but don't let it prevent cooldown
        let alreadyCheckedIn = false;
        if (result.employee) {
          alreadyCheckedIn = hasCheckedInToday(result.employee.id);
        }
        
        // Set the result message
        if (alreadyCheckedIn) {
          setLastResult({
            success: false,
            alreadyCheckedIn: true,
            name: result.employee?.name,
            message: "You have already checked in today!",
            confidence: result.confidence,
            liveness_score: result.liveness_score
          });
        } else {
          setLastResult({
            success: true,
            name: result.employee?.name,
            time: new Date().toLocaleTimeString(),
            confidence: result.confidence,
            liveness_score: result.liveness_score
          });
        }
        
        // Always start cooldown after any successful recognition
        setTimeout(() => {
          setCooldownCountdown(3);
          setIsInCooldown(true);
        }, 100);
        
        // Play sound
        try {
          const audio = new Audio(alreadyCheckedIn ? '/info.mp3' : '/success.mp3');
          audio.play().catch(() => {});
        } catch {}
        
      } else {
        // Check if this is an anti-spoofing failure
        const isAntiSpoofingFailure = result.message?.includes('Anti-spoofing failed') || 
                                     result.message?.includes('photo') ||
                                     result.message?.includes('fake') ||
                                     result.is_live === false;
        
        setLastResult({
          success: false,
          isAntiSpoofing: isAntiSpoofingFailure,
          message: result.message || "Face not recognized",
          liveness_score: result.liveness_score,
          is_live: result.is_live
        });
        
        // Play error sound
        try {
          const audio = new Audio('/error.mp3');
          audio.play().catch(() => {});
        } catch {}
      }
    } catch (error) {
      console.error("Face recognition error:", error);
      setLastResult({
        success: false,
        message: "System error. Please try again."
      });
    }
  };

  // Create a protected capture handler that enforces cooldown
  const protectedCaptureHandler = (imageData: string) => {
    if (isInCooldown) {
      return;
    }
    handleFaceCapture(imageData);
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
              {/* Portrait Camera */}
              <div className={isInCooldown ? 'opacity-50 pointer-events-none' : ''}>
                <CameraCapture
                  onCapture={protectedCaptureHandler}
                  isProcessing={isProcessing || isInCooldown}
                  kioskMode={true}
                />
                
                {/* Cooldown Overlay */}
                {isInCooldown && (
                  <div className="absolute inset-0 bg-blue-500/10 flex items-center justify-center rounded-lg">
                    <div className="text-center bg-gray-900/80 px-4 py-2 rounded-lg">
                      <Clock className="w-6 h-6 text-blue-400 mx-auto mb-1" />
                      <p className="text-blue-300 text-sm font-medium">{cooldownCountdown}s</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Simple Centered Result Display */}
      {lastResult && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none">
          <div 
            className={`${
              lastResult.success 
                ? 'bg-green-500/95 border-green-300/50' 
                : lastResult.alreadyCheckedIn
                ? 'bg-orange-500/95 border-orange-300/50'
                : 'bg-red-500/95 border-red-300/50'
            } backdrop-blur-md border text-white px-6 py-4 rounded-2xl shadow-2xl 
              animate-in fade-in slide-in-from-bottom-4 duration-300 ease-out`}
          >
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="flex items-center justify-center mb-1">
                {lastResult.success ? (
                  <CheckCircle className="w-8 h-8 text-white drop-shadow-lg" />
                ) : lastResult.alreadyCheckedIn ? (
                  <UserCheck className="w-8 h-8 text-white drop-shadow-lg" />
                ) : (
                  <XCircle className="w-8 h-8 text-white drop-shadow-lg" />
                )}
              </div>
              
              {lastResult.success ? (
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-white drop-shadow">Welcome!</h3>
                  <p className="text-white/95 font-medium">{lastResult.name}</p>
                  {lastResult.confidence && (
                    <p className="text-white/80 text-sm">
                      Confidence: {Math.round(lastResult.confidence * 100)}%
                    </p>
                  )}
                  <p className="text-white/70 text-xs">
                    Checked in at {lastResult.time}
                  </p>
                  {lastResult.liveness_score && (
                    <p className="text-white/60 text-xs">
                      Security Score: {Math.round(lastResult.liveness_score * 100)}%
                    </p>
                  )}
                </div>
              ) : lastResult.alreadyCheckedIn ? (
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-white drop-shadow">Already Here</h3>
                  <p className="text-white/95 font-medium">{lastResult.name}</p>
                  <p className="text-white/80 text-sm">You've already checked in today</p>
                  {lastResult.confidence && (
                    <p className="text-white/70 text-xs">
                      Recognition: {Math.round(lastResult.confidence * 100)}%
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-white drop-shadow">
                    {lastResult.isAntiSpoofing ? "Photo Detected" : "Not Recognized"}
                  </h3>
                  <p className="text-white/90 text-sm">
                    {lastResult.isAntiSpoofing 
                      ? "Please use live camera, not photos"
                      : lastResult.message || "Face not found in system"}
                  </p>
                  <p className="text-white/70 text-xs">
                    {lastResult.isAntiSpoofing 
                      ? "Position yourself in front of the camera"
                      : "Please try again or contact administrator"}
                  </p>
                  {lastResult.liveness_score && (
                    <p className="text-white/60 text-xs">
                      Security Score: {Math.round(lastResult.liveness_score * 100)}%
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Minimalist Processing Indicator */}
      {isProcessing && !lastResult && (
        <div className="fixed top-4 left-4 z-40">
          <div className="bg-blue-500/90 backdrop-blur-sm text-white px-3 py-2 rounded-lg shadow-lg flex items-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span className="text-sm">Processing...</span>
          </div>
        </div>
      )}

      {/* Minimalist Cooldown Indicator */}
      {isInCooldown && !lastResult && (
        <div className="fixed top-4 left-4 z-40">
          <div className="bg-blue-500/90 backdrop-blur-sm text-white px-3 py-2 rounded-lg shadow-lg flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span className="text-sm">Wait {cooldownCountdown}s</span>
          </div>
        </div>
      )}

      {/* Floating Instructions - Only show when no result and not processing and not in cooldown */}
      {!lastResult && !isProcessing && !isInCooldown && (
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