
import { useState } from "react";
import { User, Phone, Mail, Plus, Search, Edit } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const EmployeeList = () => {
  const [searchTerm, setSearchTerm] = useState("");

  // Mock employee data
  const employees = [
    {
      id: "EMP001",
      name: "John Doe",
      email: "john.doe@company.com",
      phone: "+1 234 567 8901",
      department: "Engineering",
      position: "Senior Developer",
      status: "active",
      lastSeen: "2 minutes ago",
      faceRegistered: true,
      avatar: "/placeholder.svg"
    },
    {
      id: "EMP002",
      name: "Sarah Wilson",
      email: "sarah.wilson@company.com",
      phone: "+1 234 567 8902",
      department: "Design",
      position: "UI/UX Designer",
      status: "active",
      lastSeen: "1 hour ago",
      faceRegistered: true,
      avatar: "/placeholder.svg"
    },
    {
      id: "EMP003",
      name: "Mike Johnson",
      email: "mike.johnson@company.com",
      phone: "+1 234 567 8903",
      department: "Marketing",
      position: "Marketing Manager",
      status: "active",
      lastSeen: "Currently online",
      faceRegistered: true,
      avatar: "/placeholder.svg"
    },
    {
      id: "EMP004",
      name: "Emma Davis",
      email: "emma.davis@company.com",
      phone: "+1 234 567 8904",
      department: "HR",
      position: "HR Specialist",
      status: "inactive",
      lastSeen: "3 days ago",
      faceRegistered: false,
      avatar: "/placeholder.svg"
    }
  ];

  const filteredEmployees = employees.filter(employee =>
    employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string, faceRegistered: boolean) => {
    if (!faceRegistered) {
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Setup Required</Badge>;
    }
    return status === "active" ? 
      <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge> :
      <Badge className="bg-gray-100 text-gray-800 border-gray-200">Inactive</Badge>;
  };

  return (
    <div className="space-y-4">
      {/* Header with Search and Add Button */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button size="icon" className="bg-gradient-to-r from-blue-500 to-purple-500">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>{filteredEmployees.length} employees found</span>
            <span>{employees.filter(e => e.faceRegistered).length} face profiles registered</span>
          </div>
        </CardContent>
      </Card>

      {/* Employee Cards */}
      <div className="space-y-3">
        {filteredEmployees.map((employee) => (
          <Card key={employee.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start space-x-4">
                {/* Avatar */}
                <Avatar className="w-16 h-16">
                  <AvatarImage src={employee.avatar} alt={employee.name} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                    {employee.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                
                {/* Employee Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">{employee.name}</h3>
                      <p className="text-sm text-gray-500">{employee.id}</p>
                    </div>
                    {getStatusBadge(employee.status, employee.faceRegistered)}
                  </div>
                  
                  <div className="space-y-1 text-sm text-gray-600">
                    <p className="font-medium">{employee.position}</p>
                    <p>{employee.department}</p>
                  </div>
                  
                  <div className="flex items-center space-x-4 mt-3 text-xs text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Mail className="w-3 h-3" />
                      <span className="truncate">{employee.email}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Phone className="w-3 h-3" />
                      <span>{employee.phone}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-3 pt-3 border-t">
                    <span className="text-xs text-gray-500">
                      Last seen: {employee.lastSeen}
                    </span>
                    <div className="flex items-center space-x-2">
                      {!employee.faceRegistered && (
                        <Button size="sm" variant="outline" className="text-xs border-blue-300 text-blue-600">
                          Setup Face ID
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" className="text-xs">
                        <Edit className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {filteredEmployees.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <User className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No employees found</h3>
            <p className="text-gray-500">Try adjusting your search criteria</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EmployeeList;
