
import { useState } from "react";
import { Clock, Calendar, Filter, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const AttendanceHistory = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Mock attendance data
  const attendanceRecords = [
    {
      id: 1,
      employeeId: "EMP001",
      name: "John Doe",
      checkIn: "09:15 AM",
      checkOut: "06:30 PM",
      date: "2024-01-15",
      duration: "9h 15m",
      status: "present",
      confidence: 98.5
    },
    {
      id: 2,
      employeeId: "EMP002",
      name: "Sarah Wilson",
      checkIn: "08:45 AM",
      checkOut: "05:15 PM",
      date: "2024-01-15",
      duration: "8h 30m",
      status: "present",
      confidence: 96.2
    },
    {
      id: 3,
      employeeId: "EMP003",
      name: "Mike Johnson",
      checkIn: "09:30 AM",
      checkOut: "--",
      date: "2024-01-15",
      duration: "Active",
      status: "active",
      confidence: 97.8
    },
    {
      id: 4,
      employeeId: "EMP004",
      name: "Emma Davis",
      checkIn: "--",
      checkOut: "--",
      date: "2024-01-15",
      duration: "--",
      status: "absent",
      confidence: 0
    }
  ];

  const filteredRecords = attendanceRecords.filter(record =>
    record.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "present":
        return <Badge className="bg-green-100 text-green-800 border-green-200">Present</Badge>;
      case "active":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Active</Badge>;
      case "absent":
        return <Badge className="bg-red-100 text-red-800 border-red-200">Absent</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Date and Search Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-gray-500" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by name or employee ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">3</p>
            <p className="text-sm text-green-700">Present</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">1</p>
            <p className="text-sm text-blue-700">Active</p>
          </CardContent>
        </Card>
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-600">1</p>
            <p className="text-sm text-red-700">Absent</p>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Records */}
      <div className="space-y-3">
        {filteredRecords.map((record) => (
          <Card key={record.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{record.name}</h3>
                  <p className="text-sm text-gray-500">{record.employeeId}</p>
                </div>
                {getStatusBadge(record.status)}
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-green-500" />
                  <span className="text-gray-600">In:</span>
                  <span className="font-medium">{record.checkIn}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-red-500" />
                  <span className="text-gray-600">Out:</span>
                  <span className="font-medium">{record.checkOut}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between mt-3 pt-3 border-t">
                <span className="text-sm text-gray-600">
                  Duration: <span className="font-medium">{record.duration}</span>
                </span>
                {record.confidence > 0 && (
                  <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                    {record.confidence}% match
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AttendanceHistory;
