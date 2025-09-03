import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Users, Check, X, LogOut } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AdminGuard } from "@/components/AdminGuard";
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

interface Registration {
  id: string;
  team_name: string;
  captain_id: string;
  status: 'pending' | 'approved' | 'rejected' | 'withdrawn';
  created_at: string;
  contact_phone: string;
  whatsapp_number: string;
  tournaments: {
    id: string;
    title: string;
    starts_at: string;
  };
  profiles: {
    display_name: string;
  } | null;
}

export default function AdminRegistrations() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTournament, setSelectedTournament] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch registrations with related data
      const { data: registrationsData, error: registrationsError } = await supabase
        .from('registrations')
        .select(`
          *,
          tournaments (id, title, starts_at),
          profiles (display_name)
        `)
        .order('created_at', { ascending: false });

      if (registrationsError) throw registrationsError;

      // Fetch tournaments for filter
      const { data: tournamentsData, error: tournamentsError } = await supabase
        .from('tournaments')
        .select('id, title')
        .order('created_at', { ascending: false });

      if (tournamentsError) throw tournamentsError;

      setRegistrations(registrationsData || []);
      setTournaments(tournamentsData || []);
    } catch (error) {
      console.error('Error fetching registrations:', error);
      toast({
        title: "Error",
        description: "Failed to load registrations",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (registrationId: string, newStatus: 'pending' | 'approved' | 'rejected' | 'withdrawn') => {
    try {
      const { error } = await supabase
        .from('registrations')
        .update({ status: newStatus })
        .eq('id', registrationId);

      if (error) throw error;

      // Update local state
      setRegistrations(prev => 
        prev.map(reg => 
          reg.id === registrationId 
            ? { ...reg, status: newStatus }
            : reg
        )
      );

      toast({
        title: "Success",
        description: `Registration ${newStatus} successfully`,
      });
    } catch (error: any) {
      console.error('Error updating registration:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update registration",
        variant: "destructive"
      });
    }
  };

  const handleBulkApprove = async () => {
    if (selectedTournament === "all") return;
    
    try {
      const { error } = await supabase
        .from('registrations')
        .update({ status: 'approved' })
        .eq('tournament_id', selectedTournament)
        .eq('status', 'pending');

      if (error) throw error;

      // Update local state
      setRegistrations(prev => 
        prev.map(reg => 
          reg.tournaments?.id === selectedTournament && reg.status === 'pending'
            ? { ...reg, status: 'approved' }
            : reg
        )
      );

      toast({
        title: "Success",
        description: "All pending registrations approved",
      });
    } catch (error: any) {
      console.error('Error bulk approving registrations:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to bulk approve registrations",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-warning text-warning-foreground';
      case 'approved': return 'bg-success text-success-foreground';
      case 'rejected': return 'bg-destructive text-destructive-foreground';
      case 'withdrawn': return 'bg-secondary text-secondary-foreground';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredRegistrations = registrations.filter(registration => {
    const tournamentMatch = selectedTournament === "all" || registration.tournaments?.id === selectedTournament;
    const statusMatch = selectedStatus === "all" || registration.status === selectedStatus;
    return tournamentMatch && statusMatch;
  });

  if (loading) {
    return (
      <AdminGuard>
        <div className="container mx-auto py-8 px-4">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-card rounded w-1/3"></div>
            <div className="h-64 bg-card rounded"></div>
          </div>
        </div>
      </AdminGuard>
    );
  }

  return (
    <AdminGuard>
      <div className="container mx-auto py-8 px-4">
        <div className="mb-6">
          <Button variant="ghost" asChild className="mb-4">
            <Link to="/admin">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
          
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            Tournament Registrations
          </h1>
          <p className="text-text-secondary">
            Manage tournament registrations, approvals, and withdrawals
          </p>
        </div>

        {/* Filters and Bulk Actions */}
        <div className="flex gap-4 mb-6 flex-wrap">
          <Select value={selectedTournament} onValueChange={setSelectedTournament}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Filter by tournament" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tournaments</SelectItem>
              {tournaments.map((tournament) => (
                <SelectItem key={tournament.id} value={tournament.id}>
                  {tournament.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="withdrawn">Withdrawn</SelectItem>
            </SelectContent>
          </Select>

          {selectedTournament !== "all" && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90">
                  Approve All Pending
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Bulk Approve Registrations</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to approve all pending registrations for this tournament?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleBulkApprove}>
                    Approve All
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        <Card className="esports-card">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <CardTitle className="text-text-primary">Registration Management</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {filteredRegistrations.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-text-secondary text-lg mb-4">
                  No registrations found
                </p>
                <p className="text-text-muted text-sm">
                  Registrations will appear here when players submit them.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredRegistrations.map((registration) => (
                  <div key={registration.id} className="bg-secondary/30 rounded-2xl p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                          <h3 className="text-lg font-semibold text-text-primary">
                            {registration.team_name}
                          </h3>
                          <Badge className={getStatusColor(registration.status)}>
                            {registration.status.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-text-secondary">
                          <div>
                            <span className="font-medium">Captain:</span> {registration.profiles?.display_name || registration.captain_id}
                          </div>
                          <div>
                            <span className="font-medium">Tournament:</span> {registration.tournaments?.title}
                          </div>
                          <div>
                            <span className="font-medium">Created:</span> {formatDate(registration.created_at)}
                          </div>
                        </div>
                      </div>
                      
                      {registration.status === 'pending' && (
                        <div className="flex gap-2 ml-4">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" className="bg-success hover:bg-success/90">
                                <Check className="w-4 h-4 mr-1" />
                                Approve
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Approve Registration</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to approve the registration for "{registration.team_name}"?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleStatusUpdate(registration.id, 'approved')}>
                                  Approve
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="destructive">
                                <X className="w-4 h-4 mr-1" />
                                Reject
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Reject Registration</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to reject the registration for "{registration.team_name}"?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleStatusUpdate(registration.id, 'rejected')}>
                                  Reject
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      )}
                      
                      {registration.status === 'approved' && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="outline">
                              <LogOut className="w-4 h-4 mr-1" />
                              Withdraw
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Withdraw Registration</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to withdraw the registration for "{registration.team_name}"? This may be restricted if the tournament starts in less than 2 hours.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleStatusUpdate(registration.id, 'withdrawn')}>
                                Withdraw
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminGuard>
  );
}