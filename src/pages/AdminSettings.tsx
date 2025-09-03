import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Settings, MessageCircle, Plus, Edit, Trash2 } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Tournament {
  id: string;
  title: string;
}

interface WhatsAppInvite {
  id: string;
  tournament_id: string;
  invite_link: string;
  notes?: string;
  active: boolean;
  created_at: string;
  tournaments?: {
    title: string;
  };
}

interface PlatformStats {
  totalUsers: number;
  activeTournaments: number;
  totalRevenue: number;
  pendingActions: number;
}

export default function AdminSettings() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [whatsappInvites, setWhatsappInvites] = useState<WhatsAppInvite[]>([]);
  const [stats, setStats] = useState<PlatformStats>({
    totalUsers: 0,
    activeTournaments: 0,
    totalRevenue: 0,
    pendingActions: 0
  });
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingInvite, setEditingInvite] = useState<WhatsAppInvite | null>(null);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    tournament_id: '',
    invite_link: '',
    notes: '',
    active: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch tournaments
      const { data: tournamentsData, error: tournamentsError } = await supabase
        .from('tournaments')
        .select('id, title')
        .order('created_at', { ascending: false });

      if (tournamentsError) throw tournamentsError;

      // Fetch WhatsApp invites
      const { data: invitesData, error: invitesError } = await supabase
        .from('whatsapp_invites')
        .select(`
          *,
          tournaments (title)
        `)
        .order('created_at', { ascending: false });

      if (invitesError) throw invitesError;

      // Fetch platform stats
      await fetchStats();

      setTournaments(tournamentsData || []);
      setWhatsappInvites(invitesData || []);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load settings data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Total users
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Active tournaments
      const { count: activeTournamentsCount } = await supabase
        .from('tournaments')
        .select('*', { count: 'exact', head: true })
        .in('state', ['registration_open', 'locked', 'in_progress']);

      // Total revenue (sum of approved positive transactions)
      const { data: revenueData } = await supabase
        .from('zcred_transactions')
        .select('amount')
        .eq('status', 'approved')
        .gt('amount', 0);

      const totalRevenue = revenueData?.reduce((sum, t) => sum + t.amount, 0) || 0;

      // Pending actions
      const { count: pendingDeposits } = await supabase
        .from('zcred_deposit_forms')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'submitted');

      const { count: pendingWithdrawals } = await supabase
        .from('zcred_withdrawal_forms')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'submitted');

      const { count: pendingRegistrations } = await supabase
        .from('registrations')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      const pendingActions = (pendingDeposits || 0) + (pendingWithdrawals || 0) + (pendingRegistrations || 0);

      setStats({
        totalUsers: usersCount || 0,
        activeTournaments: activeTournamentsCount || 0,
        totalRevenue,
        pendingActions
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingInvite) {
        const { error } = await supabase
          .from('whatsapp_invites')
          .update({
            invite_link: formData.invite_link,
            notes: formData.notes,
            active: formData.active
          })
          .eq('id', editingInvite.id);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "WhatsApp invite updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('whatsapp_invites')
          .insert([formData]);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "WhatsApp invite created successfully",
        });
      }

      setIsDialogOpen(false);
      setEditingInvite(null);
      setFormData({
        tournament_id: '',
        invite_link: '',
        notes: '',
        active: true
      });
      fetchData();
    } catch (error: any) {
      console.error('Error saving invite:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save WhatsApp invite",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (invite: WhatsAppInvite) => {
    setEditingInvite(invite);
    setFormData({
      tournament_id: invite.tournament_id,
      invite_link: invite.invite_link,
      notes: invite.notes || '',
      active: invite.active
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (inviteId: string) => {
    try {
      const { error } = await supabase
        .from('whatsapp_invites')
        .delete()
        .eq('id', inviteId);

      if (error) throw error;

      setWhatsappInvites(prev => prev.filter(i => i.id !== inviteId));
      
      toast({
        title: "Success",
        description: "WhatsApp invite deleted successfully",
      });
    } catch (error: any) {
      console.error('Error deleting invite:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete WhatsApp invite",
        variant: "destructive"
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

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
            System Settings
          </h1>
          <p className="text-text-secondary">
            Configure platform settings and preferences
          </p>
        </div>

        {/* Platform Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card className="esports-card">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary mb-1">
                  {stats.totalUsers}
                </div>
                <div className="text-sm text-text-secondary">Total Users</div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="esports-card">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-success mb-1">
                  {stats.activeTournaments}
                </div>
                <div className="text-sm text-text-secondary">Active Tournaments</div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="esports-card">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-accent mb-1">
                  {stats.totalRevenue} ZC
                </div>
                <div className="text-sm text-text-secondary">Total Revenue</div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="esports-card">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-warning mb-1">
                  {stats.pendingActions}
                </div>
                <div className="text-sm text-text-secondary">Pending Actions</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* WhatsApp Invites Management */}
        <Card className="esports-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-text-secondary" />
                </div>
                <CardTitle className="text-text-primary">WhatsApp Invites</CardTitle>
              </div>
              
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-primary hover:bg-primary/90">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Invite
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>
                      {editingInvite ? 'Edit WhatsApp Invite' : 'Add WhatsApp Invite'}
                    </DialogTitle>
                  </DialogHeader>
                  
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="tournament">Tournament</Label>
                      <Select 
                        value={formData.tournament_id} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, tournament_id: value }))}
                        disabled={!!editingInvite}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select tournament" />
                        </SelectTrigger>
                        <SelectContent>
                          {tournaments.map((tournament) => (
                            <SelectItem key={tournament.id} value={tournament.id}>
                              {tournament.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="invite_link">WhatsApp Invite Link</Label>
                      <Input
                        id="invite_link"
                        value={formData.invite_link}
                        onChange={(e) => setFormData(prev => ({ ...prev, invite_link: e.target.value }))}
                        placeholder="https://chat.whatsapp.com/..."
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="notes">Notes (optional)</Label>
                      <Input
                        id="notes"
                        value={formData.notes}
                        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Additional notes about this invite"
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="active"
                        checked={formData.active}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked }))}
                      />
                      <Label htmlFor="active">Active (visible to users)</Label>
                    </div>
                    
                    <div className="flex gap-2 justify-end pt-4">
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" className="bg-primary hover:bg-primary/90">
                        {editingInvite ? 'Update' : 'Create'} Invite
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {whatsappInvites.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-text-secondary text-lg mb-4">
                  No WhatsApp invites configured
                </p>
                <p className="text-text-muted text-sm">
                  Add invite links for tournaments to allow participants to join group chats.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {whatsappInvites.map((invite) => (
                  <div key={invite.id} className="bg-secondary/30 rounded-2xl p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                          <h3 className="text-lg font-semibold text-text-primary">
                            {invite.tournaments?.title || 'Unknown Tournament'}
                          </h3>
                          <Switch checked={invite.active} disabled />
                        </div>
                        <div className="space-y-1 text-sm text-text-secondary">
                          <div>
                            <span className="font-medium">Link:</span>{' '}
                            <a 
                              href={invite.invite_link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-primary hover:underline truncate inline-block max-w-xs"
                            >
                              {invite.invite_link}
                            </a>
                          </div>
                          {invite.notes && (
                            <div>
                              <span className="font-medium">Notes:</span> {invite.notes}
                            </div>
                          )}
                          <div>
                            <span className="font-medium">Created:</span> {formatDate(invite.created_at)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 ml-4">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(invite)}>
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="destructive">
                              <Trash2 className="w-4 h-4 mr-1" />
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete WhatsApp Invite</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this WhatsApp invite? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(invite.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
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