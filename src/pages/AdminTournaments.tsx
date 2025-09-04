import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AdminGuard } from "@/components/AdminGuard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Lock, Play, CheckCircle, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Tournament {
  id: string;
  title: string;
  game: string | null;
  state: string;
  starts_at: string | null;
  reg_starts_at: string | null;
  reg_closes_at: string | null;
  entry_fee_credits: number;
  slots: number | null;
  created_at: string;
  rules_md: string | null;
  format: string;
  cover_url: string | null;
}

interface TournamentFormData {
  title: string;
  game: string;
  rules_md: string;
  starts_at: string;
  reg_starts_at: string;
  reg_closes_at: string;
  entry_fee_credits: number;
  slots: number;
  state: "draft" | "registration_open" | "locked" | "in_progress" | "completed";
  cover_url: string;
}

const initialFormData: TournamentFormData = {
  title: "",
  game: "",
  rules_md: "",
  starts_at: "",
  reg_starts_at: "",
  reg_closes_at: "",
  entry_fee_credits: 0,
  slots: 0,
  state: "registration_open",
  cover_url: ""
};

const stateColors = {
  registration_open: "bg-green-500/10 text-green-400 border-green-500/20",
  locked: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  in_progress: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  completed: "bg-gray-500/10 text-gray-400 border-gray-500/20"
};

const stateLabels = {
  registration_open: "Open",
  locked: "Locked",
  in_progress: "In Progress",
  completed: "Completed"
};

export default function AdminTournaments() {
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<TournamentFormData>(initialFormData);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      const { data, error } = await supabase
        .from('tournaments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTournaments(data || []);
    } catch (error) {
      console.error('Error fetching tournaments:', error);
      toast({
        title: "Error",
        description: "Failed to fetch tournaments",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    
    try {
      let cover_url = formData.cover_url;

      // Upload cover image if a new file is selected
      if (coverFile) {
        const fileExt = coverFile.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('covers')
          .upload(fileName, coverFile);

        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('covers')
          .getPublicUrl(fileName);
        
        cover_url = publicUrl;
      }
      
      const payload = {
        ...formData,
        cover_url,
        entry_fee_credits: parseInt(formData.entry_fee_credits.toString()) || 0,
        slots: parseInt(formData.slots.toString()) || null,
        starts_at: formData.starts_at || null,
        reg_starts_at: formData.reg_starts_at || null,
        reg_closes_at: formData.reg_closes_at || null,
        state: formData.state as "draft" | "registration_open" | "locked" | "in_progress" | "completed"
      };

      if (editingId) {
        const { error } = await supabase
          .from('tournaments')
          .update(payload)
          .eq('id', editingId);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Tournament updated successfully"
        });
      } else {
        const { error } = await supabase
          .from('tournaments')
          .insert(payload);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Tournament created successfully"
        });
      }

      setDialogOpen(false);
      setFormData(initialFormData);
      setCoverFile(null);
      setEditingId(null);
      fetchTournaments();
    } catch (error: any) {
      console.error('Error saving tournament:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save tournament",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (tournament: Tournament) => {
    setFormData({
      title: tournament.title,
      game: tournament.game || "",
      rules_md: tournament.rules_md || "",
      starts_at: tournament.starts_at ? format(new Date(tournament.starts_at), "yyyy-MM-dd'T'HH:mm") : "",
      reg_starts_at: tournament.reg_starts_at ? format(new Date(tournament.reg_starts_at), "yyyy-MM-dd'T'HH:mm") : "",
      reg_closes_at: tournament.reg_closes_at ? format(new Date(tournament.reg_closes_at), "yyyy-MM-dd'T'HH:mm") : "",
      entry_fee_credits: tournament.entry_fee_credits,
      slots: tournament.slots || 0,
      state: tournament.state as "draft" | "registration_open" | "locked" | "in_progress" | "completed",
      cover_url: tournament.cover_url || ""
    });
    setEditingId(tournament.id);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('tournaments')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Tournament deleted successfully"
      });
      
      fetchTournaments();
    } catch (error: any) {
      console.error('Error deleting tournament:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete tournament",
        variant: "destructive"
      });
    }
  };

  const handleStateChange = async (id: string, newState: string) => {
    try {
      const { error } = await supabase
        .from('tournaments')
        .update({ state: newState as "draft" | "registration_open" | "locked" | "in_progress" | "completed" })
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: `Tournament state updated to ${stateLabels[newState as keyof typeof stateLabels]}`
      });
      
      fetchTournaments();
    } catch (error: any) {
      console.error('Error updating tournament state:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update tournament state",
        variant: "destructive"
      });
    }
  };

  const openCreateDialog = () => {
    setFormData(initialFormData);
    setCoverFile(null);
    setEditingId(null);
    setDialogOpen(true);
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
      <div className="container mx-auto py-8 px-4 space-y-6">
        {/* Back Navigation */}
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate(-1)} className="flex items-center space-x-2">
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Tournaments Management</h1>
            <p className="text-muted-foreground mt-2">Create and manage tournaments</p>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog} className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Create Tournament
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingId ? "Edit Tournament" : "Create Tournament"}
                </DialogTitle>
                <DialogDescription>
                  {editingId ? "Update tournament details" : "Create a new tournament"}
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="game">Game</Label>
                    <Input
                      id="game"
                      value={formData.game}
                      onChange={(e) => setFormData({ ...formData, game: e.target.value })}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="rules_md">Rules (Markdown)</Label>
                  <Textarea
                    id="rules_md"
                    value={formData.rules_md}
                    onChange={(e) => setFormData({ ...formData, rules_md: e.target.value })}
                    rows={4}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="reg_starts_at">Registration Starts At</Label>
                    <Input
                      id="reg_starts_at"
                      type="datetime-local"
                      value={formData.reg_starts_at}
                      onChange={(e) => setFormData({ ...formData, reg_starts_at: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="reg_closes_at">Registration Closes At</Label>
                    <Input
                      id="reg_closes_at"
                      type="datetime-local"
                      value={formData.reg_closes_at}
                      onChange={(e) => setFormData({ ...formData, reg_closes_at: e.target.value })}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="starts_at">Tournament Starts At</Label>
                    <Input
                      id="starts_at"
                      type="datetime-local"
                      value={formData.starts_at}
                      onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="slots">Total Slots</Label>
                    <Input
                      id="slots"
                      type="number"
                      min="0"
                      value={formData.slots}
                      onChange={(e) => setFormData({ ...formData, slots: parseInt(e.target.value) || 0 })}
                      placeholder="Maximum participants"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="entry_fee_credits">Entry Fee (Credits)</Label>
                    <Input
                      id="entry_fee_credits"
                      type="number"
                      min="0"
                      value={formData.entry_fee_credits}
                      onChange={(e) => setFormData({ ...formData, entry_fee_credits: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Select value={formData.state} onValueChange={(value) => setFormData({ ...formData, state: value as "draft" | "registration_open" | "locked" | "in_progress" | "completed" })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="registration_open">Registration Open</SelectItem>
                        <SelectItem value="locked">Locked</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {/* Cover Image Upload */}
                <div>
                  <Label htmlFor="cover">Cover Image</Label>
                  <Input
                    id="cover"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                  />
                  {formData.cover_url && (
                    <div className="mt-2">
                      <img 
                        src={formData.cover_url} 
                        alt="Current cover" 
                        className="w-32 h-20 object-cover rounded border"
                      />
                      <p className="text-sm text-muted-foreground mt-1">Current cover image</p>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={uploading} className="bg-primary hover:bg-primary/90">
                    {uploading ? "Uploading..." : editingId ? "Update" : "Create"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>All Tournaments</CardTitle>
            <CardDescription>
              Manage tournament lifecycle and settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            {tournaments.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No tournaments found</p>
                <Button onClick={openCreateDialog} className="mt-4 bg-primary hover:bg-primary/90">
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Tournament
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Game</TableHead>
                      <TableHead>State</TableHead>
                      <TableHead>Slots</TableHead>
                      <TableHead>Reg Starts</TableHead>
                      <TableHead>Reg Closes</TableHead>
                      <TableHead>Starts At</TableHead>
                      <TableHead>Entry Fee</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tournaments.map((tournament) => (
                      <TableRow key={tournament.id}>
                        <TableCell className="font-medium">{tournament.title}</TableCell>
                        <TableCell>{tournament.game || "-"}</TableCell>
                        <TableCell>
                          <Badge className={stateColors[tournament.state as keyof typeof stateColors]}>
                            {stateLabels[tournament.state as keyof typeof stateLabels]}
                          </Badge>
                        </TableCell>
                        <TableCell>{tournament.slots || "-"}</TableCell>
                        <TableCell>
                          {tournament.reg_starts_at ? format(new Date(tournament.reg_starts_at), "MMM dd, HH:mm") : "-"}
                        </TableCell>
                        <TableCell>
                          {tournament.reg_closes_at ? format(new Date(tournament.reg_closes_at), "MMM dd, HH:mm") : "-"}
                        </TableCell>
                        <TableCell>
                          {tournament.starts_at ? format(new Date(tournament.starts_at), "MMM dd, HH:mm") : "-"}
                        </TableCell>
                        <TableCell>{tournament.entry_fee_credits} ZC</TableCell>
                        <TableCell>{format(new Date(tournament.created_at), "MMM dd, HH:mm")}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            {tournament.state === 'registration_open' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStateChange(tournament.id, 'locked')}
                              >
                                <Lock className="w-3 h-3" />
                              </Button>
                            )}
                            {tournament.state === 'locked' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStateChange(tournament.id, 'in_progress')}
                              >
                                <Play className="w-3 h-3" />
                              </Button>
                            )}
                            {tournament.state === 'in_progress' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStateChange(tournament.id, 'completed')}
                              >
                                <CheckCircle className="w-3 h-3" />
                              </Button>
                            )}
                            
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(tournament)}
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="outline">
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Tournament</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{tournament.title}"? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(tournament.id)}>
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminGuard>
  );
}