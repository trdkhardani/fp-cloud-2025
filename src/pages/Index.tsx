import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Camera, 
  Users, 
  History, 
  Settings, 
  CheckCircle, 
  XCircle, 
  Wifi, 
  WifiOff,
  LogOut,
  Shield,
  Monitor
} from "lucide-react";

import CameraCapture from "@/components/CameraCapture";
import UserList from "@/components/UserList";
import AttendanceHistory from "@/components/AttendanceHistory";
import ConfigPage from "@/components/ConfigPage";
import Logo from "@/components/ui/logo";
import { useITScenceAttendance, useEmployees, useAttendanceHistory, useHealthCheck } from "@/hooks/useFaceRecognition";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const Index = () => {
  const [lastResult, setLastResult] = useState<any>(null);
  const { user, logout } = useAuth();
  
  const { processAttendance, isProcessing } = useITScenceAttendance();
  const { data: employees = [] } = useEmployees();
  const { data: attendance = [] } = useAttendanceHistory();
  const { data: health, isLoading: healthLoading } = useHealthCheck();

  const handleFaceCapture = async (imageData: string) => {
    try {
      const result = await processAttendance(imageData, 'check-in');
      setLastResult(result);
      
      if (result.success) {
        toast.success("Attendance recorded!", {
          description: `${result.employee?.name} checked in successfully.`,
        });
      } else {
        toast.error("Recognition failed", {
          description: result.message,
        });
      }
    } catch (error) {
      console.error("Face recognition failed:", error);
      toast.error("System error", {
        description: "Face recognition system encountered an error.",
      });
    }
  };

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully", {
      description: "You have been logged out of the admin panel.",
    });
  };

  const handleKioskMode = () => {
    window.open('/kiosk', '_blank');
  };

  const todayAttendance = attendance.filter(record => {
    const today = new Date().toDateString();
    const recordDate = new Date(record.timestamp).toDateString();
    return today === recordDate;
  });

  const getSystemStatus = () => {
    if (healthLoading) return { status: 'checking', color: 'yellow', icon: WifiOff };
    if (!health?.deepface_available) return { status: 'offline', color: 'red', icon: WifiOff };
    return { status: 'online', color: 'green', icon: Wifi };
  };

  const systemStatus = getSystemStatus();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Logo size="md" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">ITScence Admin</h1>
                <p className="text-sm text-gray-500">ITS Smart Presence Management</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* System Status */}
              <Badge 
                variant="secondary" 
                className={`flex items-center gap-2 ${
                  systemStatus.color === 'green' ? 'bg-green-100 text-green-800 border-green-200' :
                  systemStatus.color === 'red' ? 'bg-red-100 text-red-800 border-red-200' :
                  'bg-yellow-100 text-yellow-800 border-yellow-200'
                }`}
              >
                <systemStatus.icon className="w-3 h-3" />
                {systemStatus.status === 'online' ? 'System Online' : 
                 systemStatus.status === 'offline' ? 'System Offline' : 'Checking...'}
              </Badge>

              {/* User Info */}
              <div className="flex items-center gap-2 text-sm">
                <Shield className="w-4 h-4 text-gray-500" />
                <span className="text-gray-700">{user?.username}</span>
              </div>

              {/* Kiosk Mode Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleKioskMode}
                className="flex items-center gap-2"
              >
                <Monitor className="w-4 h-4" />
                Open Kiosk
              </Button>

              {/* Logout Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex items-center gap-2 hover:bg-red-50 hover:border-red-200 hover:text-red-700"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        <Tabs defaultValue="camera" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto">
            <TabsTrigger value="camera" className="flex items-center gap-2">
              <Camera className="w-4 h-4" />
              Camera
            </TabsTrigger>
            <TabsTrigger value="employees" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="w-4 h-4" />
              History
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Camera Tab */}
          <TabsContent value="camera">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Camera Capture */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Camera className="w-5 h-5" />
                      Face Recognition
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CameraCapture
                      onCapture={handleFaceCapture}
                      isProcessing={isProcessing}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Last Result */}
                {lastResult && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-sm">
                        {lastResult.success ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-600" />
                        )}
                        Last Recognition
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {lastResult.success ? (
                        <div className="space-y-2">
                          <p className="font-medium">{lastResult.employee?.name}</p>
                          <p className="text-sm text-gray-600">{lastResult.employee?.department}</p>
                          <p className="text-xs text-gray-500">
                            Confidence: {lastResult.confidence * 100}%
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-red-600">{lastResult.message}</p>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Statistics */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Today's Statistics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Check-ins</span>
                      <span className="font-medium">{todayAttendance.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total Users</span>
                      <span className="font-medium">{employees.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">System Status</span>
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${
                          systemStatus.color === 'green' ? 'bg-green-100 text-green-800' :
                          systemStatus.color === 'red' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {systemStatus.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="employees">
            <UserList />
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <AttendanceHistory />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <ConfigPage />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
