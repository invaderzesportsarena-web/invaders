import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Users, Shield, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AdminOnlyGuard } from "@/components/AdminOnlyGuard";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface User {
  id: string;
  username: string;
  display_name: string;
  role: string;
  created_at: string;
}

export default function AdminUserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, display_name, role, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: string, username: string) => {
    try {
      const { error } = await supabase.rpc('update_user_role', {
        target_user_id: userId,
        new_role: newRole
      });

      if (error) throw error;

      // Update local state
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ));

      toast({
        title: "Success",
        description: `${username} is now a ${newRole}`,
      });
    } catch (error: any) {
      console.error('Error updating user role:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update user role",
        variant: "destructive"
      });
    }
  };

  const filteredUsers = users.filter(user =>
    user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.display_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'text-red-500';
      case 'moderator':
        return 'text-yellow-500';
      default:
        return 'text-text-secondary';
    }
  };

  if (loading) {
    return (
      <AdminOnlyGuard>
        <div className="container mx-auto py-8 px-4">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-card rounded w-1/3"></div>
            <div className="h-64 bg-card rounded"></div>
          </div>
        </div>
      </AdminOnlyGuard>
    );
  }

  return (
    <AdminOnlyGuard>
      <div className="container mx-auto py-8 px-4">
        <div className="mb-6">
          <Button variant="ghost" asChild className="mb-4">
            <Link to="/admin">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
          
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            User Management
          </h1>
          <p className="text-text-secondary">
            Manage user roles and permissions
          </p>
        </div>

        {/* Search */}
        <Card className="esports-card mb-6">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary w-5 h-5" />
              <Input
                placeholder="Search users by username or display name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Users List */}
        <Card className="esports-card">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-text-secondary" />
              </div>
              <CardTitle className="text-text-primary">All Users ({filteredUsers.length})</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {filteredUsers.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-text-secondary text-lg">
                  {searchTerm ? 'No users found matching your search' : 'No users found'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredUsers.map((user) => (
                  <div key={user.id} className="bg-secondary/30 rounded-2xl p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                          <h3 className="text-lg font-semibold text-text-primary">
                            {user.display_name || user.username}
                          </h3>
                          <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4 text-text-secondary" />
                            <span className={`text-sm font-medium ${getRoleColor(user.role)}`}>
                              {user.role.toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-1 text-sm text-text-secondary">
                          <div>
                            <span className="font-medium">Username:</span> {user.username}
                          </div>
                          <div>
                            <span className="font-medium">Joined:</span> {formatDate(user.created_at)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-3 ml-4">
                        <Select 
                          value={user.role} 
                          onValueChange={(newRole) => {
                            if (newRole !== user.role) {
                              updateUserRole(user.id, newRole, user.username);
                            }
                          }}
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="player">Player</SelectItem>
                            <SelectItem value="moderator">Moderator</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        {user.role !== 'player' && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="outline">
                                Reset to Player
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Reset User Role</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to reset {user.username} to a regular player? 
                                  This will remove all administrative privileges.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => updateUserRole(user.id, 'player', user.username)}
                                >
                                  Reset to Player
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminOnlyGuard>
  );
}