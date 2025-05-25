import { useState, useMemo } from "react";
import { Clock, Calendar, Filter, Search, RefreshCw, AlertCircle, User, Camera } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAttendanceHistory, useAttendancePhoto } from "@/hooks/useFaceRecognition";
import { format, isToday, parseISO } from "date-fns";

// UserPhoto component to show initials only
const UserPhoto = ({ name }: { name: string }) => {
  return (
    <Avatar className="h-12 w-12">
      <AvatarFallback className="bg-blue-100 text-blue-600">
        {name.split(' ').map(n => n[0]).join('').slice(0, 2)}
      </AvatarFallback>
    </Avatar>
  );
};

// AttendancePhoto component to handle attendance captured photos
const AttendancePhoto = ({ attendanceId, type }: { attendanceId: string; type: 'check-in' | 'check-out' }) => {
  const { data: photoUrl, isLoading, error } = useAttendancePhoto(attendanceId);
  
  if (isLoading) {
    return (
      <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !photoUrl) {
    return (
      <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
        <Camera className="w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="relative">
      <img 
        src={photoUrl} 
        alt={`${type} photo`}
        className="w-24 h-24 object-cover rounded-lg border-2 border-gray-200"
      />
      <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full text-xs flex items-center justify-center text-white font-bold ${
        type === 'check-in' ? 'bg-green-500' : 'bg-red-500'
      }`}>
        {type === 'check-in' ? '↓' : '↑'}
      </div>
    </div>
  );
};

const AttendanceHistory = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Fetch real attendance data from the backend
  const { data: attendanceData = [], isLoading, error, refetch } = useAttendanceHistory(100);

  // Transform backend data to component format with attendance grouping
  const processedAttendance = useMemo(() => {
    // Group attendance by employee and date
    const grouped = attendanceData.reduce((acc, record) => {
      const date = format(parseISO(record.timestamp), 'yyyy-MM-dd');
      const key = `${record.employeeId}-${date}`;
      
      if (!acc[key]) {
        acc[key] = {
          id: key,
          employeeId: record.employeeId,
          name: record.employeeName,
          date,
          checkIn: null,
          checkOut: null,
          records: [],
          confidence: 0
        };
      }
      
      acc[key].records.push(record);
      
      // Set check-in/check-out times and find highest confidence
      if (record.type === 'check-in') {
        if (!acc[key].checkIn || parseISO(record.timestamp) < parseISO(acc[key].checkIn.timestamp)) {
          acc[key].checkIn = record;
        }
      } else if (record.type === 'check-out') {
        if (!acc[key].checkOut || parseISO(record.timestamp) > parseISO(acc[key].checkOut.timestamp)) {
          acc[key].checkOut = record;
        }
      }
      
      // Track highest confidence
      acc[key].confidence = Math.max(acc[key].confidence, record.confidence);
      
      return acc;
    }, {});
    
    return Object.values(grouped).map((group: any) => {
      const checkInTime = group.checkIn ? format(parseISO(group.checkIn.timestamp), 'hh:mm a') : '--';
      const checkOutTime = group.checkOut ? format(parseISO(group.checkOut.timestamp), 'hh:mm a') : '--';
      
      // Calculate duration
      let duration = '--';
      let status = 'absent';
      
      if (group.checkIn && group.checkOut) {
        const checkInDate = parseISO(group.checkIn.timestamp);
        const checkOutDate = parseISO(group.checkOut.timestamp);
        const diffMs = checkOutDate.getTime() - checkInDate.getTime();
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        duration = `${hours}h ${minutes}m`;
        status = 'present';
      } else if (group.checkIn) {
        status = isToday(parseISO(group.checkIn.timestamp)) ? 'active' : 'present';
        duration = group.checkOut ? duration : 'Active';
      }
      
      return {
        id: group.id,
        employeeId: group.employeeId,
        name: group.name,
        checkIn: checkInTime,
        checkOut: checkOutTime,
        date: group.date,
        duration,
        status,
        confidence: Math.round(group.confidence * 100), // Convert to percentage for display
        records: group.records
      };
    });
  }, [attendanceData]);

  // Filter by selected date
  const dateFilteredRecords = useMemo(() => {
    return processedAttendance.filter(record => record.date === selectedDate);
  }, [processedAttendance, selectedDate]);

  // Apply search filter
  const filteredRecords = useMemo(() => {
    if (!searchTerm) return dateFilteredRecords;
    
    return dateFilteredRecords.filter(record =>
      record.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [dateFilteredRecords, searchTerm]);

  // Calculate summary stats for selected date
  const summaryStats = useMemo(() => {
    const present = filteredRecords.filter(r => r.status === 'present').length;
    const active = filteredRecords.filter(r => r.status === 'active').length;
    const absent = filteredRecords.filter(r => r.status === 'absent').length;
    
    return { present, active, absent };
  }, [filteredRecords]);

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

  if (error) {
    return (
      <div className="space-y-4">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              <span>Failed to load attendance data</span>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => refetch()}
              className="mt-2"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Date and Search Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 flex-1">
                <Calendar className="w-5 h-5 text-gray-500" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => refetch()}
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by name or user ID..."
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
            <p className="text-2xl font-bold text-green-600">{summaryStats.present}</p>
            <p className="text-sm text-green-700">Present</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{summaryStats.active}</p>
            <p className="text-sm text-blue-700">Active</p>
          </CardContent>
        </Card>
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-600">{summaryStats.absent}</p>
            <p className="text-sm text-red-700">Absent</p>
          </CardContent>
        </Card>
      </div>

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="p-8 text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-gray-400" />
            <p className="text-gray-500">Loading attendance records...</p>
          </CardContent>
        </Card>
      )}

      {/* No Data State */}
      {!isLoading && filteredRecords.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No attendance records</h3>
            <p className="text-gray-500">
              {searchTerm ? 'No records match your search criteria.' : `No attendance records found for ${format(parseISO(selectedDate + 'T00:00:00'), 'MMMM d, yyyy')}.`}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Attendance Records */}
      {!isLoading && filteredRecords.length > 0 && (
        <div className="space-y-3">
          {filteredRecords.map((record) => (
            <Card key={record.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                {/* 3-Column Layout */}
                <div className="grid grid-cols-3 gap-4">
                  {/* Column 1: User Info & Status */}
                  <div className="flex flex-col space-y-3">
                    <div className="flex items-center space-x-3">
                      <UserPhoto name={record.name} />
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{record.name}</h3>
                        <p className="text-sm text-gray-500">{record.employeeId}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      {getStatusBadge(record.status)}
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Duration:</span> {record.duration}
                      </div>
                      {record.records && record.records.length > 2 && (
                        <div className="text-xs text-gray-500">
                          {record.records.length} total records today
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Column 2: Check-in Details */}
                  <div className="flex flex-col items-center space-y-2 text-center border-r border-gray-100 pr-2">
                    <div className="text-sm font-medium text-green-700 mb-1">Check-in</div>
                    
                    {record.records?.find(r => r.type === 'check-in') ? (
                      <>
                        <AttendancePhoto 
                          attendanceId={record.records.find(r => r.type === 'check-in')!.id} 
                          type="check-in" 
                        />
                        <div className="text-sm space-y-1">
                          <div className="flex items-center justify-center space-x-1">
                            <Clock className="w-3 h-3 text-green-500" />
                            <span className="font-medium">{record.checkIn}</span>
                          </div>
                          {record.records.find(r => r.type === 'check-in')!.confidence > 0 && (
                            <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                              {Math.round(record.records.find(r => r.type === 'check-in')!.confidence * 100)}% match
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                          <Camera className="w-8 h-8" />
                        </div>
                        <div className="text-sm text-gray-500">--</div>
                      </>
                    )}
                  </div>

                  {/* Column 3: Check-out Details */}
                  <div className="flex flex-col items-center space-y-2 text-center pl-2">
                    <div className="text-sm font-medium text-red-700 mb-1">Check-out</div>
                    
                    {record.records?.find(r => r.type === 'check-out') ? (
                      <>
                        <AttendancePhoto 
                          attendanceId={record.records.find(r => r.type === 'check-out')!.id} 
                          type="check-out" 
                        />
                        <div className="text-sm space-y-1">
                          <div className="flex items-center justify-center space-x-1">
                            <Clock className="w-3 h-3 text-red-500" />
                            <span className="font-medium">{record.checkOut}</span>
                          </div>
                          {record.records.find(r => r.type === 'check-out')!.confidence > 0 && (
                            <div className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                              {Math.round(record.records.find(r => r.type === 'check-out')!.confidence * 100)}% match
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                          <Camera className="w-8 h-8" />
                        </div>
                        <div className="text-sm text-gray-500">--</div>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AttendanceHistory;
