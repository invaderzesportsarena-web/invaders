import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Trophy, Upload, Trash2, Edit } from "lucide-react";
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

interface ResultMedia {
  id: string;
  tournament_id: string;
  title?: string;
  image_url: string;
  thumb_url?: string;
  visible: boolean;
  created_at: string;
}

export default function AdminResults() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<string>("");
  const [resultMedia, setResultMedia] = useState<ResultMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editingMedia, setEditingMedia] = useState<ResultMedia | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchTournaments();
  }, []);

  useEffect(() => {
    if (selectedTournament) {
      fetchResultMedia();
    } else {
      setResultMedia([]);
    }
  }, [selectedTournament]);

  const fetchTournaments = async () => {
    try {
      const { data, error } = await supabase
        .from('tournaments')
        .select('id, title')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTournaments(data || []);
      
      if (data && data.length > 0) {
        setSelectedTournament(data[0].id);
      }
    } catch (error: any) {
      console.error('Error fetching tournaments:', error);
      toast({
        title: "Error",
        description: "Failed to load tournaments",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchResultMedia = async () => {
    if (!selectedTournament) return;

    try {
      const { data, error } = await supabase
        .from('results_media')
        .select('*')
        .eq('tournament_id', selectedTournament)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setResultMedia(data || []);
    } catch (error: any) {
      console.error('Error fetching results media:', error);
      toast({
        title: "Error",
        description: "Failed to load results media",
        variant: "destructive"
      });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !selectedTournament) return;

    setUploading(true);
    
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${selectedTournament}_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from('results_jpg')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('results_jpg')
          .getPublicUrl(fileName);

        // Insert into results_media table
        const { error: insertError } = await supabase
          .from('results_media')
          .insert({
            tournament_id: selectedTournament,
            title: file.name.split('.')[0], // Use filename without extension as title
            image_url: publicUrl,
            visible: true
          });

        if (insertError) throw insertError;
      });

      await Promise.all(uploadPromises);
      
      toast({
        title: "Success",
        description: `${files.length} file(s) uploaded successfully`,
      });
      
      fetchResultMedia();
    } catch (error: any) {
      console.error('Error uploading files:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to upload files",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const handleEditMedia = (media: ResultMedia) => {
    setEditingMedia(media);
    setEditTitle(media.title || '');
    setIsEditDialogOpen(true);
  };

  const handleUpdateMedia = async () => {
    if (!editingMedia) return;

    try {
      const { error } = await supabase
        .from('results_media')
        .update({ title: editTitle })
        .eq('id', editingMedia.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Media updated successfully",
      });
      
      setIsEditDialogOpen(false);
      setEditingMedia(null);
      fetchResultMedia();
    } catch (error: any) {
      console.error('Error updating media:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update media",
        variant: "destructive"
      });
    }
  };

  const handleDeleteMedia = async (mediaId: string, imageUrl: string) => {
    try {
      // Delete from database
      const { error: deleteError } = await supabase
        .from('results_media')
        .delete()
        .eq('id', mediaId);

      if (deleteError) throw deleteError;

      // Try to delete from storage (optional, may fail if file doesn't exist)
      try {
        const fileName = imageUrl.split('/').pop();
        if (fileName) {
          await supabase.storage
            .from('results_jpg')
            .remove([fileName]);
        }
      } catch (storageError) {
        console.warn('Could not delete file from storage:', storageError);
      }

      setResultMedia(prev => prev.filter(m => m.id !== mediaId));
      
      toast({
        title: "Success",
        description: "Media deleted successfully",
      });
    } catch (error: any) {
      console.error('Error deleting media:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete media",
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
            Results Uploader
          </h1>
          <p className="text-text-secondary">
            Upload and manage tournament results and media
          </p>
        </div>

        <Card className="esports-card mb-6">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-accent rounded-xl flex items-center justify-center">
                <Trophy className="w-5 h-5 text-white" />
              </div>
              <CardTitle className="text-text-primary">Tournament Selection</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="tournament">Select Tournament</Label>
                <Select value={selectedTournament} onValueChange={setSelectedTournament}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose a tournament" />
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

              {selectedTournament && (
                <div>
                  <Label htmlFor="upload">Upload Results (JPG/PNG)</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                    <input
                      type="file"
                      id="upload"
                      multiple
                      accept="image/jpeg,image/png,image/jpg"
                      onChange={handleFileUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                    <label
                      htmlFor="upload"
                      className={`cursor-pointer flex flex-col items-center gap-2 ${uploading ? 'opacity-50' : ''}`}
                    >
                      <Upload className="w-8 h-8 text-text-secondary" />
                      <div>
                        <p className="text-text-primary font-medium">
                          {uploading ? 'Uploading...' : 'Click to upload or drag and drop'}
                        </p>
                        <p className="text-text-secondary text-sm">
                          JPG, PNG files only. Multiple files supported.
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {selectedTournament && (
          <Card className="esports-card">
            <CardHeader>
              <CardTitle className="text-text-primary">Results Gallery</CardTitle>
            </CardHeader>
            <CardContent>
              {resultMedia.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-text-secondary text-lg mb-2">
                    No results uploaded yet
                  </p>
                  <p className="text-text-muted text-sm">
                    Upload some images to get started
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {resultMedia.map((media) => (
                    <div key={media.id} className="bg-secondary/30 rounded-2xl overflow-hidden">
                      <div className="aspect-video relative">
                        <img
                          src={media.thumb_url || media.image_url}
                          alt={media.title || 'Result image'}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors duration-200 flex items-center justify-center opacity-0 hover:opacity-100">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditMedia(media)}
                              className="bg-background/90"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="bg-destructive/90"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Media</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this result image? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteMedia(media.id, media.image_url)}>
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </div>
                      <div className="p-3">
                        <h3 className="font-medium text-text-primary truncate">
                          {media.title || 'Untitled'}
                        </h3>
                        <p className="text-sm text-text-secondary">
                          {formatDate(media.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Edit Media Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Media</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Enter title for this media"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateMedia} className="bg-primary hover:bg-primary/90">
                  Update
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminGuard>
  );
}