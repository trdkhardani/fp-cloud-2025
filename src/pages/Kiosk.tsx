import { useState, useEffect } from "react";
import { Camera, CheckCircle, XCircle, Clock, RefreshCw, Wifi, WifiOff, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import CameraCapture from "@/components/CameraCapture";
import { useFaceAttendance, useHealthCheck, useAttendanceHistory, useAttendanceMode } from "@/hooks/useFaceRecognition";
import { toast } from "sonner";

const Kiosk = () => {
  const [lastResult, setLastResult] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isInCooldown, setIsInCooldown] = useState(false);
  const [cooldownCountdown, setCooldownCountdown] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  
  const { processAttendance, isProcessing } = useFaceAttendance();
  const { data: health, isLoading: healthLoading } = useHealthCheck();
  const { data: attendanceData = [] } = useAttendanceHistory(100); // Get recent attendance records
  const { data: attendanceMode, isLoading: modeLoading } = useAttendanceMode();

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                           window.innerWidth <= 768;
      setIsMobile(isMobileDevice);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

    // Check attendance mode restrictions
    if (!attendanceMode) {
      setLastResult({
        success: false,
        message: "Checking schedule... Please wait."
      });
      return;
    }

    // Block access if outside schedule and not allowed
    if (attendanceMode.mode === 'restricted') {
      setLastResult({
        success: false,
        isRestricted: true,
        message: `Access restricted outside working hours.\nCheck-in: ${attendanceMode.schedule_info.check_in_range}\nCheck-out: ${attendanceMode.schedule_info.check_out_range || 'Not set'}`,
        scheduleInfo: attendanceMode.schedule_info
      });
      
      try {
        const audio = new Audio('/error.mp3');
        audio.play().catch(() => {});
      } catch {}
      return;
    }

    // Determine attendance type based on mode
    let attendanceType: 'check-in' | 'check-out' = 'check-in';
    
    if (attendanceMode.mode === 'check-out') {
      attendanceType = 'check-out';
    } else if (attendanceMode.mode === 'flexible' && attendanceMode.allowed_types.includes('check-out')) {
      // For flexible mode, we could implement logic to auto-detect based on existing records
      // For now, default to check-in unless we add UI selection
      attendanceType = 'check-in';
    }

    try {
      const result = await processAttendance(imageData, attendanceType);
      
      // If face recognition was successful, always start cooldown
      if (result.success) {
        // Check for duplicate check-in but don't let it prevent cooldown
        let alreadyCheckedIn = false;
        if (result.employee && attendanceType === 'check-in') {
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
            liveness_score: result.liveness_score,
            attendanceType,
            scheduleMode: attendanceMode.mode
          });
        } else {
          setLastResult({
            success: true,
            name: result.employee?.name,
            time: new Date().toLocaleTimeString(),
            confidence: result.confidence,
            liveness_score: result.liveness_score,
            attendanceType,
            scheduleMode: attendanceMode.mode,
            requiresConfirmation: attendanceMode.requires_confirmation
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
          is_live: result.is_live,
          attendanceType,
          scheduleMode: attendanceMode.mode
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
        message: "System error. Please try again.",
        scheduleMode: attendanceMode.mode
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
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white overflow-hidden" style={{
      minHeight: isMobile ? '100vh' : '100vh',
      paddingTop: isMobile ? 'env(safe-area-inset-top)' : '0',
      paddingBottom: isMobile ? 'env(safe-area-inset-bottom)' : '0',
      paddingLeft: isMobile ? 'env(safe-area-inset-left)' : '0',
      paddingRight: isMobile ? 'env(safe-area-inset-right)' : '0'
    }}>
      {/* Header - Mobile Optimized */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 sm:p-4 shadow-lg">
        <div className={`flex items-center ${isMobile ? 'flex-col gap-2' : 'justify-between'}`}>
          {/* Logo and Title */}
          <div className="flex items-center space-x-3">
            {/* <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Camera className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold">FaceAttend</h1>
            </div> */}
          </div>
          
          {/* Mobile: Stack time and status vertically */}
          {isMobile ? (
            <div className="flex flex-col items-center gap-2 w-full">
              {/* Time Display */}
              <div className="text-center">
                <div className="text-base font-mono font-bold">
                  {formatTime(currentTime)}
                </div>
                <div className="text-xs text-blue-100">
                  {formatDate(currentTime)}
                </div>
              </div>
              
              {/* Schedule and System Status */}
              <div className="flex items-center gap-2 flex-wrap justify-center">
                {/* Schedule Status */}
                {!modeLoading && attendanceMode && (
                  <Badge 
                    variant="outline" 
                    className={`flex items-center gap-1 text-xs px-2 py-1 ${
                      attendanceMode.mode === 'restricted' ? 'bg-red-600/20 text-red-100 border-red-300/30' :
                      attendanceMode.mode === 'check-in' ? 'bg-green-600/20 text-green-100 border-green-300/30' :
                      attendanceMode.mode === 'check-out' ? 'bg-blue-600/20 text-blue-100 border-blue-300/30' :
                      attendanceMode.mode === 'flexible' ? 'bg-purple-600/20 text-purple-100 border-purple-300/30' :
                      'bg-yellow-600/20 text-yellow-100 border-yellow-300/30'
                    }`}
                  >
                    <Clock className="w-3 h-3" />
                    <span className="hidden sm:inline">
                      {attendanceMode.mode === 'restricted' && 'Closed'}
                      {attendanceMode.mode === 'check-in' && 'Check-in Time'}
                      {attendanceMode.mode === 'check-out' && 'Check-out Time'}
                      {attendanceMode.mode === 'flexible' && 'Open Hours'}
                      {attendanceMode.mode === 'flexible_with_warning' && 'Outside Hours'}
                    </span>
                    <span className="sm:hidden">
                      {attendanceMode.mode === 'restricted' && 'Closed'}
                      {attendanceMode.mode === 'check-in' && 'Check-in'}
                      {attendanceMode.mode === 'check-out' && 'Check-out'}
                      {attendanceMode.mode === 'flexible' && 'Open'}
                      {attendanceMode.mode === 'flexible_with_warning' && 'Outside'}
                    </span>
                  </Badge>
                )}
                
                {/* System Status */}
                <Badge 
                  variant="secondary" 
                  className={`flex items-center gap-1 text-xs px-2 py-1 ${
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
              
              {/* Schedule Message */}
              {attendanceMode && (
                <div className="text-xs text-blue-200 text-center max-w-xs truncate">
                  {attendanceMode.message}
                </div>
              )}
            </div>
          ) : (
            /* Desktop: Horizontal layout */
            <>
              {/* Compact Time Display */}
              <div className="text-center">
                <div className="text-lg font-mono font-bold">
                  {formatTime(currentTime)}
                </div>
                <div className="text-xs text-blue-100">
                  {formatDate(currentTime)}
                </div>
              </div>
              
              {/* Schedule Status */}
              <div className="text-center">
                {!modeLoading && attendanceMode && (
                  <Badge 
                    variant="outline" 
                    className={`flex items-center gap-2 text-xs px-2 py-1 ${
                      attendanceMode.mode === 'restricted' ? 'bg-red-600/20 text-red-100 border-red-300/30' :
                      attendanceMode.mode === 'check-in' ? 'bg-green-600/20 text-green-100 border-green-300/30' :
                      attendanceMode.mode === 'check-out' ? 'bg-blue-600/20 text-blue-100 border-blue-300/30' :
                      attendanceMode.mode === 'flexible' ? 'bg-purple-600/20 text-purple-100 border-purple-300/30' :
                      'bg-yellow-600/20 text-yellow-100 border-yellow-300/30'
                    }`}
                  >
                    <Clock className="w-3 h-3" />
                    {attendanceMode.mode === 'restricted' && 'Closed'}
                    {attendanceMode.mode === 'check-in' && 'Check-in Time'}
                    {attendanceMode.mode === 'check-out' && 'Check-out Time'}
                    {attendanceMode.mode === 'flexible' && 'Open Hours'}
                    {attendanceMode.mode === 'flexible_with_warning' && 'Outside Hours'}
                  </Badge>
                )}
                {attendanceMode && (
                  <div className="text-xs text-blue-200 mt-1">
                    {attendanceMode.message}
                  </div>
                )}
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
            </>
          )}
        </div>
      </div>

      {/* Main Content - Mobile Optimized */}
      <div className={`flex-1 ${isMobile ? 'p-2' : 'p-4'} relative flex items-center justify-center`}>
        <div className={`w-full ${isMobile ? 'max-w-full' : 'max-w-md'} mx-auto`}>
          
          {/* Camera Interface */}
          <Card className="bg-gray-800 border-gray-600">
            <CardContent className={isMobile ? 'p-1' : 'p-2'}>
              {/* Camera */}
              <div className={isInCooldown || (attendanceMode?.mode === 'restricted') ? 'opacity-50 pointer-events-none' : ''}>
                <CameraCapture
                  onCapture={protectedCaptureHandler}
                  isProcessing={isProcessing || isInCooldown || (attendanceMode?.mode === 'restricted')}
                  kioskMode={true}
                />
                
                {/* Cooldown Overlay */}
                {isInCooldown && (
                  <div className="absolute inset-0 bg-blue-500/10 flex items-center justify-center rounded-lg">
                    <div className="text-center bg-gray-900/80 px-3 py-2 rounded-lg">
                      <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400 mx-auto mb-1" />
                      <p className="text-blue-300 text-sm font-medium">{cooldownCountdown}s</p>
                    </div>
                  </div>
                )}
                
                {/* Restricted Mode Overlay */}
                {attendanceMode?.mode === 'restricted' && (
                  <div className="absolute inset-0 bg-red-500/10 flex items-center justify-center rounded-lg">
                    <div className="text-center bg-gray-900/80 px-3 py-2 rounded-lg">
                      <XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-400 mx-auto mb-1" />
                      <p className="text-red-300 text-sm font-medium">Access Restricted</p>
                      <p className="text-red-200 text-xs">Outside working hours</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Simple Centered Result Display - Mobile Optimized */}
      {lastResult && (
        <div className={`fixed ${isMobile ? 'top-1/3' : 'top-1/2'} left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none ${isMobile ? 'px-4' : ''}`}>
          <div 
            className={`${
              lastResult.success 
                ? 'bg-green-500/95 border-green-300/50' 
                : lastResult.alreadyCheckedIn
                ? 'bg-orange-500/95 border-orange-300/50'
                : 'bg-red-500/95 border-red-300/50'
            } backdrop-blur-md border text-white ${isMobile ? 'px-4 py-3' : 'px-6 py-4'} rounded-2xl shadow-2xl 
              animate-in fade-in slide-in-from-bottom-4 duration-300 ease-out ${isMobile ? 'max-w-xs' : ''}`}
          >
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="flex items-center justify-center mb-1">
                {lastResult.success ? (
                  <CheckCircle className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} text-white drop-shadow-lg`} />
                ) : lastResult.alreadyCheckedIn ? (
                  <UserCheck className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} text-white drop-shadow-lg`} />
                ) : (
                  <XCircle className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} text-white drop-shadow-lg`} />
                )}
              </div>
              
              {lastResult.success ? (
                <div className="space-y-1">
                  <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-bold text-white drop-shadow`}>
                    {lastResult.attendanceType === 'check-out' ? 'Goodbye!' : 'Welcome!'}
                  </h3>
                  <p className={`text-white/95 font-medium ${isMobile ? 'text-sm' : ''}`}>{lastResult.name}</p>
                  {lastResult.confidence && (
                    <p className="text-white/80 text-sm">
                      Confidence: {Math.round(lastResult.confidence * 100)}%
                    </p>
                  )}
                  <p className="text-white/70 text-xs">
                    {lastResult.attendanceType === 'check-out' ? 'Checked out' : 'Checked in'} at {lastResult.time}
                  </p>
                  {lastResult.requiresConfirmation && (
                    <p className="text-yellow-200 text-xs">
                      ⚠️ Outside normal hours
                    </p>
                  )}
                  {lastResult.liveness_score && !isMobile && (
                    <p className="text-white/60 text-xs">
                      Security Score: {Math.round(lastResult.liveness_score * 100)}%
                    </p>
                  )}
                </div>
              ) : lastResult.alreadyCheckedIn ? (
                <div className="space-y-1">
                  <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-bold text-white drop-shadow`}>Already Here</h3>
                  <p className={`text-white/95 font-medium ${isMobile ? 'text-sm' : ''}`}>{lastResult.name}</p>
                  <p className="text-white/80 text-sm">You've already checked in today</p>
                  {lastResult.confidence && !isMobile && (
                    <p className="text-white/70 text-xs">
                      Recognition: {Math.round(lastResult.confidence * 100)}%
                    </p>
                  )}
                </div>
              ) : lastResult.isRestricted ? (
                <div className="space-y-1">
                  <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-bold text-white drop-shadow`}>Access Restricted</h3>
                  <p className={`text-white/90 text-sm text-center ${isMobile ? 'whitespace-normal' : 'whitespace-pre-line'}`}>
                    {isMobile ? lastResult.message.replace(/\n/g, ' ') : lastResult.message}
                  </p>
                  <p className="text-white/70 text-xs">
                    Please try during working hours
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-bold text-white drop-shadow`}>
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
                  {lastResult.attendanceType && !isMobile && (
                    <p className="text-white/60 text-xs">
                      Mode: {lastResult.attendanceType} ({lastResult.scheduleMode})
                    </p>
                  )}
                  {lastResult.liveness_score && !isMobile && (
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

      {/* Minimalist Processing Indicator - Mobile Optimized */}
      {isProcessing && !lastResult && (
        <div className={`fixed ${isMobile ? 'top-16' : 'top-4'} ${isMobile ? 'left-1/2 transform -translate-x-1/2' : 'left-4'} z-40`}>
          <div className={`bg-blue-500/90 backdrop-blur-sm text-white ${isMobile ? 'px-4 py-2' : 'px-3 py-2'} rounded-lg shadow-lg flex items-center gap-2`}>
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span className="text-sm">Processing...</span>
          </div>
        </div>
      )}

      {/* Minimalist Cooldown Indicator - Mobile Optimized */}
      {isInCooldown && !lastResult && (
        <div className={`fixed ${isMobile ? 'top-16' : 'top-4'} ${isMobile ? 'left-1/2 transform -translate-x-1/2' : 'left-4'} z-40`}>
          <div className={`bg-blue-500/90 backdrop-blur-sm text-white ${isMobile ? 'px-4 py-2' : 'px-3 py-2'} rounded-lg shadow-lg flex items-center gap-2`}>
            <Clock className="w-4 h-4" />
            <span className="text-sm">Wait {cooldownCountdown}s</span>
          </div>
        </div>
      )}

      {/* Floating Instructions - Mobile Optimized */}
      {!lastResult && !isProcessing && !isInCooldown && (
        <div className={`fixed ${isMobile ? 'bottom-4' : 'bottom-8'} left-1/2 transform -translate-x-1/2 z-30 ${isMobile ? 'px-4' : ''}`}>
          <div className={`bg-gray-800/90 backdrop-blur-sm border border-gray-600 rounded-xl ${isMobile ? 'px-4 py-3' : 'px-6 py-4'} ${isMobile ? 'max-w-sm' : 'max-w-2xl'}`}>
            {attendanceMode?.mode === 'restricted' ? (
              <div className="text-center">
                <h3 className={`${isMobile ? 'text-sm' : 'text-sm'} font-semibold mb-2 text-red-300`}>System Closed</h3>
                <p className={`text-xs text-gray-400 mb-3 ${isMobile ? 'leading-relaxed' : ''}`}>{attendanceMode.message}</p>
                <div className="text-xs text-gray-300 space-y-1">
                  <p>Check-in: {attendanceMode.schedule_info.check_in_range}</p>
                  {attendanceMode.schedule_info.check_out_range && (
                    <p>Check-out: {attendanceMode.schedule_info.check_out_range}</p>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div className={`flex items-center justify-center gap-2 mb-3 ${isMobile ? 'flex-col' : ''}`}>
                  <h3 className={`text-center ${isMobile ? 'text-sm' : 'text-sm'} font-semibold text-white`}>
                    {attendanceMode?.mode === 'check-in' && 'Check-in Time'}
                    {attendanceMode?.mode === 'check-out' && 'Check-out Time'}
                    {attendanceMode?.mode === 'flexible' && 'Open Hours'}
                    {attendanceMode?.mode === 'flexible_with_warning' && 'Outside Normal Hours'}
                    {!attendanceMode && 'Quick Instructions'}
                  </h3>
                  {attendanceMode && (
                    <Badge variant="outline" className="text-xs">
                      {attendanceMode.mode}
                    </Badge>
                  )}
                </div>
                <div className={`grid ${isMobile ? 'grid-cols-1 gap-2' : 'grid-cols-3 gap-4'} text-xs`}>
                  <div className={`flex ${isMobile ? 'flex-row' : 'flex-col'} items-center gap-2 text-center`}>
                    <div className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0`}>
                      <span className="font-bold text-xs">1</span>
                    </div>
                    <p className="text-gray-300">Position face in frame</p>
                  </div>
                  <div className={`flex ${isMobile ? 'flex-row' : 'flex-col'} items-center gap-2 text-center`}>
                    <div className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0`}>
                      <span className="font-bold text-xs">2</span>
                    </div>
                    <p className="text-gray-300">Look at camera</p>
                  </div>
                  <div className={`flex ${isMobile ? 'flex-row' : 'flex-col'} items-center gap-2 text-center`}>
                    <div className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0`}>
                      <span className="font-bold text-xs">3</span>
                    </div>
                    <p className="text-gray-300">Wait for recognition</p>
                  </div>
                </div>
                {attendanceMode?.requires_confirmation && (
                  <p className={`text-yellow-300 text-xs text-center ${isMobile ? 'mt-2' : 'mt-3'}`}>
                    ⚠️ Outside normal hours - confirmation required
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Footer - Mobile Optimized */}
      <div className={`bg-gray-800 ${isMobile ? 'p-2' : 'p-3'} text-center text-xs text-gray-400`}>
        <p>For assistance, please contact administrator</p>
      </div>
    </div>
  );
};

export default Kiosk; 