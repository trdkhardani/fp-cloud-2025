import { useState } from "react";
import { User, Phone, Mail, Search, Edit, Trash2, Eye, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useEmployees, useDeleteEmployee } from "@/hooks/useFaceRecognition";
import { toast } from "sonner";
import AddUserDialog from "./AddUserDialog";

const EmployeeList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: employees = [], isLoading, error, refetch } = useEmployees();
  const deleteEmployee = useDeleteEmployee();

  const filteredEmployees = employees.filter(employee =>
    employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (employee.department && employee.department.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleDeleteEmployee = async (employeeId: string, employeeName: string) => {
    try {
      await deleteEmployee.mutateAsync(employeeId);
      toast.success("Employee Deleted", {
        description: `${employeeName} has been removed from the system.`,
      });
    } catch (error) {
      toast.error("Delete Failed", {
        description: error instanceof Error ? error.message : "Failed to delete employee.",
      });
    }
  };

  const getStatusBadge = (employee: any) => {
    if (!employee.face_enrolled) {
      return <Badge variant="destructive" className="flex items-center gap-1">
        <XCircle className="w-3 h-3" />
        No Face Data
      </Badge>;
    }
    return <Badge variant="default" className="flex items-center gap-1 bg-green-100 text-green-800 border-green-200">
      <CheckCircle className="w-3 h-3" />
      Enrolled
    </Badge>;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="p-4">
            <div className="h-10 bg-gray-200 rounded animate-pulse mb-4"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-1/3"></div>
          </CardContent>
        </Card>
        
        {[1, 2, 3].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="flex items-start space-x-4">
                <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/6"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <XCircle className="w-16 h-16 mx-auto mb-4 text-red-300" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Failed to load employees</h3>
          <p className="text-gray-500 mb-4">Could not connect to the server</p>
          <Button onClick={() => refetch()} variant="outline">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

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
            <AddUserDialog onUserAdded={() => refetch()} />
          </div>
          
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>{filteredEmployees.length} employees found</span>
            <span>{employees.filter(e => e.face_enrolled).length} face profiles registered</span>
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
                  <AvatarImage src="" alt={employee.name} />
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
                    {getStatusBadge(employee)}
                  </div>
                  
                  <div className="space-y-1 text-sm text-gray-600">
                    {employee.department && (
                      <p>{employee.department}</p>
                    )}
                    {employee.email && (
                      <div className="flex items-center space-x-1">
                        <Mail className="w-3 h-3" />
                        <span className="truncate">{employee.email}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between mt-3 pt-3 border-t">
                    <span className="text-xs text-gray-500">
                      Face enrolled: {employee.face_enrolled ? 'Yes' : 'No'}
                    </span>
                    <div className="flex items-center space-x-2">
                      {!employee.face_enrolled && (
                        <AddUserDialog 
                          trigger={
                            <Button size="sm" variant="outline" className="text-xs border-blue-300 text-blue-600">
                              Setup Face ID
                            </Button>
                          }
                          onUserAdded={() => refetch()}
                        />
                      )}
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="ghost" className="text-xs text-red-600 hover:text-red-700">
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Employee</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete {employee.name}? This action cannot be undone.
                              All face data and attendance records associated with this employee will be permanently removed.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteEmployee(employee.id, employee.name)}
                              disabled={deleteEmployee.isPending}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              {deleteEmployee.isPending ? (
                                <>
                                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                  Deleting...
                                </>
                              ) : (
                                'Delete Employee'
                              )}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {filteredEmployees.length === 0 && !isLoading && (
        <Card>
          <CardContent className="p-8 text-center">
            <User className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              {employees.length === 0 ? "No employees enrolled" : "No employees found"}
            </h3>
            <p className="text-gray-500 mb-4">
              {employees.length === 0 
                ? "Get started by adding your first employee" 
                : "Try adjusting your search criteria"
              }
            </p>
            {employees.length === 0 && (
              <AddUserDialog onUserAdded={() => refetch()} />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EmployeeList;
