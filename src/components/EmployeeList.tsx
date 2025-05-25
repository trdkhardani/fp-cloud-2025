import { useState } from "react";
import { Search, UserPlus, Trash2, Edit, Mail, MapPin, User, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useEmployees, useDeleteEmployee } from "@/hooks/useFaceRecognition";
import { toast } from "sonner";
import AddUserDialog from "./AddUserDialog";
import EditUserDialog from "./EditUserDialog";

const UserList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: users = [], isLoading, error, refetch } = useEmployees();
  const deleteUser = useDeleteEmployee();

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.department && user.department.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleDeleteUser = async (userId: string, userName: string) => {
    try {
      await deleteUser.mutateAsync(userId);
      toast.success("User Deleted", {
        description: `${userName} has been removed from the system.`,
      });
    } catch (error) {
      toast.error("Delete Failed", {
        description: error instanceof Error ? error.message : "Failed to delete user.",
      });
    }
  };

  const getStatusBadge = (user: any) => {
    if (!user.face_enrolled) {
      return <Badge variant="outline" className="text-orange-600 border-orange-600">No Face Profile</Badge>;
    }
    return <Badge variant="default" className="bg-green-600">Active</Badge>;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="w-64">
            <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <h3 className="text-lg font-semibold text-gray-600 mb-2">Failed to load users</h3>
        <p className="text-gray-500 mb-4">Please check your connection and try again.</p>
        <Button onClick={() => refetch()} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <AddUserDialog />
      </div>

      {/* Stats */}
      <div className="flex gap-4 text-sm text-gray-600">
        <span>{filteredUsers.length} users found</span>
        <span>{users.filter(e => e.face_enrolled).length} face profiles registered</span>
      </div>

      {/* User Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUsers.map((user) => (
          <Card key={user.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src="" alt={user.name} />
                    <AvatarFallback className="bg-blue-100 text-blue-600">
                      {user.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  
                  {/* User Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{user.name}</h3>
                      <p className="text-sm text-gray-500">{user.id}</p>
                    </div>
                    {getStatusBadge(user)}
                  </div>
                </div>
              </div>

              {/* Additional Info */}
              <div className="space-y-2 text-sm text-gray-600">
                {user.department && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <p>{user.department}</p>
                  </div>
                )}
                {user.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <span className="truncate">{user.email}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Face enrolled: {user.face_enrolled ? 'Yes' : 'No'}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                <EditUserDialog user={user} />
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete User</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete {user.name}? This action cannot be undone.
                        All face data and attendance records associated with this user will be permanently removed.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDeleteUser(user.id, user.name)}
                        disabled={deleteUser.isPending}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        {deleteUser.isPending ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          'Delete User'
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredUsers.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {users.length === 0 ? "No users enrolled" : "No users found"}
          </h3>
          <p className="text-gray-500 mb-6">
            {users.length === 0
              ? "Get started by adding your first user"
              : "Try adjusting your search terms"}
          </p>
          {users.length === 0 && (
            <AddUserDialog />
          )}
        </div>
      )}
    </div>
  );
};

export default UserList;
