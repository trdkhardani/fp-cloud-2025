
import { useState, useRef, useEffect } from "react";
import { Camera, Users, Clock, CheckCircle, XCircle, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import CameraCapture from "@/components/CameraCapture";
import AttendanceHistory from "@/components/AttendanceHistory";
import EmployeeList from "@/components/EmployeeList";

const Index = () => {
  const [activeTab, setActiveTab] = useState("camera");
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [lastAttendance, setLastAttendance] = useState(null);

  const handleFaceCapture = async (imageData: string) => {
    setIsRecognizing(true);
    
    // Simulate API call to your DeepFace backend
    try {
      // This is where you'll integrate with your DeepFace API
      // const response = await fetch('/api/recognize-face', {
      //   method: 'POST',
      //   body: JSON.stringify({ image: imageData }),
      //   headers: { 'Content-Type': 'application/json' }
      // });
      
      // Simulated response for demo
      setTimeout(() => {
        const mockEmployee = {
          id: "EMP001",
          name: "John Doe",
          time: new Date().toLocaleTimeString(),
          type: "check-in",
          confidence: 98.5
        };
        setLastAttendance(mockEmployee);
        setIsRecognizing(false);
      }, 2000);
      
    } catch (error) {
      console.error("Face recognition failed:", error);
      setIsRecognizing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Camera className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">FaceAttend</h1>
              <p className="text-blue-100 text-sm">Smart Attendance System</p>
            </div>
          </div>
          <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
            Live
          </Badge>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white shadow-sm border-b">
        <div className="flex">
          <button
            onClick={() => setActiveTab("camera")}
            className={`flex-1 py-4 px-2 text-center font-medium transition-colors ${
              activeTab === "camera"
                ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                : "text-gray-600"
            }`}
          >
            <Camera className="w-5 h-5 mx-auto mb-1" />
            Camera
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex-1 py-4 px-2 text-center font-medium transition-colors ${
              activeTab === "history"
                ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                : "text-gray-600"
            }`}
          >
            <Clock className="w-5 h-5 mx-auto mb-1" />
            History
          </button>
          <button
            onClick={() => setActiveTab("employees")}
            className={`flex-1 py-4 px-2 text-center font-medium transition-colors ${
              activeTab === "employees"
                ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                : "text-gray-600"
            }`}
          >
            <Users className="w-5 h-5 mx-auto mb-1" />
            Employees
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Last Attendance Alert */}
        {lastAttendance && (
          <Card className="border-green-200 bg-green-50 animate-in slide-in-from-top-2 duration-500">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <div className="flex-1">
                  <p className="font-semibold text-green-800">{lastAttendance.name}</p>
                  <p className="text-sm text-green-600">
                    {lastAttendance.type === "check-in" ? "Checked In" : "Checked Out"} at {lastAttendance.time}
                  </p>
                  <p className="text-xs text-green-500">Confidence: {lastAttendance.confidence}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tab Content */}
        {activeTab === "camera" && (
          <div className="space-y-6">
            <CameraCapture
              onCapture={handleFaceCapture}
              isProcessing={isRecognizing}
            />
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                <CardContent className="p-4 text-center">
                  <Clock className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-2xl font-bold">47</p>
                  <p className="text-sm text-blue-100">Today's Check-ins</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                <CardContent className="p-4 text-center">
                  <Users className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-2xl font-bold">52</p>
                  <p className="text-sm text-purple-100">Total Employees</p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === "history" && <AttendanceHistory />}
        {activeTab === "employees" && <EmployeeList />}
      </div>
    </div>
  );
};

export default Index;
