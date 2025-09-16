import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, FileText, Plus, Edit, Trash2, Eye, Upload } from "lucide-react";
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

interface Post {
  id: string;
  type: 'news' | 'guide';
  title: string;
  slug: string;
  category?: string;
  cover_url?: string;
  content_md?: string;
  status: 'draft' | 'published' | 'hidden';
  published_at?: string;
  created_at: string;
  author_id?: string;
}

export default function AdminPosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    type: 'news' as 'news' | 'guide',
    title: '',
    slug: '',
    category: '',
    cover_url: '',
    content_md: '',
    status: 'draft' as 'draft' | 'published' | 'hidden',
    published_at: ''
  });

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts((data || []) as Post[]);
    } catch (error: any) {
      console.error('Error fetching posts:', error);
      toast({
        title: "Error",
        description: "Failed to load posts",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (title: string) => {
    if (!title.trim()) return '';
    
    let slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    // Ensure minimum length of 3 characters
    if (slug.length < 3) {
      slug = slug.padEnd(3, '0');
    }
    
    // Ensure maximum length of 60 characters
    if (slug.length > 60) {
      slug = slug.substring(0, 60).replace(/-+$/, '');
    }
    
    return slug;
  };

  const handleTitleChange = (title: string) => {
    const newSlug = generateSlug(title);
    setFormData(prev => ({
      ...prev,
      title,
      // Auto-generate slug only if current slug is empty or invalid
      slug: (!prev.slug || prev.slug.length < 3) ? newSlug : prev.slug
    }));
  };

  const handleCoverUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingCover(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('covers')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('covers')
        .getPublicUrl(fileName);

      setFormData(prev => ({ ...prev, cover_url: publicUrl }));
      
      toast({
        title: "Success",
        description: "Cover image uploaded successfully",
      });
    } catch (error: any) {
      console.error('Error uploading cover:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to upload cover image",
        variant: "destructive"
      });
    } finally {
      setUploadingCover(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate slug before submission
    if (!formData.slug || formData.slug.length < 3) {
      toast({
        title: "Error",
        description: "Slug must be at least 3 characters long",
        variant: "destructive"
      });
      return;
    }
    
    if (!/^[a-z0-9\-]{3,60}$/.test(formData.slug)) {
      toast({
        title: "Error", 
        description: "Slug can only contain lowercase letters, numbers, and hyphens (3-60 chars)",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const postData = {
        ...formData,
        published_at: formData.status === 'published' && !formData.published_at 
          ? new Date().toISOString() 
          : formData.published_at || null
      };

      if (editingPost) {
        const { error } = await supabase
          .from('posts')
          .update(postData)
          .eq('id', editingPost.id);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Post updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('posts')
          .insert([postData]);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Post created successfully",
        });
      }

      setIsDialogOpen(false);
      setEditingPost(null);
      setFormData({
        type: 'news',
        title: '',
        slug: '',
        category: '',
        cover_url: '',
        content_md: '',
        status: 'draft',
        published_at: ''
      });
      fetchPosts();
    } catch (error: any) {
      console.error('Error saving post:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save post",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (post: Post) => {
    setEditingPost(post);
    setFormData({
      type: post.type,
      title: post.title,
      slug: post.slug,
      category: post.category || '',
      cover_url: post.cover_url || '',
      content_md: post.content_md || '',
      status: post.status,
      published_at: post.published_at || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (postId: string) => {
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;

      setPosts(prev => prev.filter(p => p.id !== postId));
      
      toast({
        title: "Success",
        description: "Post deleted successfully",
      });
    } catch (error: any) {
      console.error('Error deleting post:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete post",
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-success text-success-foreground';
      case 'draft': return 'bg-warning text-warning-foreground';
      case 'hidden': return 'bg-secondary text-secondary-foreground';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const newsPost = posts.filter(post => post.type === 'news');
  const guidePosts = posts.filter(post => post.type === 'guide');

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
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-text-primary mb-2">
                Posts Management
              </h1>
              <p className="text-text-secondary">
                Create and manage news articles and gaming guides
              </p>
            </div>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Post
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingPost ? 'Edit Post' : 'Create New Post'}
                  </DialogTitle>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="type">Type</Label>
                      <Select value={formData.type} onValueChange={(value: 'news' | 'guide') => setFormData(prev => ({ ...prev, type: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="news">News</SelectItem>
                          <SelectItem value="guide">Guide</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select value={formData.status} onValueChange={(value: 'draft' | 'published' | 'hidden') => setFormData(prev => ({ ...prev, status: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="published">Published</SelectItem>
                          <SelectItem value="hidden">Hidden</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="slug">Slug</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="cover">Cover Image</Label>
                    <div className="flex gap-2">
                      <Input
                        id="cover"
                        value={formData.cover_url}
                        onChange={(e) => setFormData(prev => ({ ...prev, cover_url: e.target.value }))}
                        placeholder="Cover image URL"
                      />
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleCoverUpload}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          disabled={uploadingCover}
                        />
                        <Button type="button" variant="outline" disabled={uploadingCover}>
                          <Upload className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="content">Content (Markdown)</Label>
                    <Textarea
                      id="content"
                      value={formData.content_md}
                      onChange={(e) => setFormData(prev => ({ ...prev, content_md: e.target.value }))}
                      rows={10}
                      placeholder="Write your post content in markdown..."
                    />
                  </div>
                  
                  {formData.status === 'published' && (
                    <div>
                      <Label htmlFor="published_at">Published At</Label>
                      <Input
                        id="published_at"
                        type="datetime-local"
                        value={formData.published_at}
                        onChange={(e) => setFormData(prev => ({ ...prev, published_at: e.target.value }))}
                      />
                    </div>
                  )}
                  
                  <div className="flex gap-2 justify-end pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" className="bg-primary hover:bg-primary/90">
                      {editingPost ? 'Update' : 'Create'} Post
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card className="esports-card">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-warning/10 rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5 text-warning" />
              </div>
              <CardTitle className="text-text-primary">Content Management</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="news" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="news">News ({newsPost.length})</TabsTrigger>
                <TabsTrigger value="guides">Guides ({guidePosts.length})</TabsTrigger>
              </TabsList>
              
              <TabsContent value="news" className="space-y-4">
                {newsPost.length === 0 ? (
                  <div className="py-12 text-center">
                    <p className="text-text-secondary">No news articles found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {newsPost.map((post) => (
                      <div key={post.id} className="bg-secondary/30 rounded-2xl p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-4 mb-2">
                              <h3 className="text-lg font-semibold text-text-primary">
                                {post.title}
                              </h3>
                              <Badge className={getStatusColor(post.status)}>
                                {post.status.toUpperCase()}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-text-secondary">
                              <div>
                                <span className="font-medium">Slug:</span> {post.slug}
                              </div>
                              <div>
                                <span className="font-medium">Category:</span> {post.category || 'None'}
                              </div>
                              <div>
                                <span className="font-medium">Created:</span> {formatDate(post.created_at)}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex gap-2 ml-4">
                            {post.status === 'published' && (
                              <Button size="sm" variant="outline" asChild>
                                <Link to={`/news/${post.slug}`} target="_blank">
                                  <Eye className="w-4 h-4 mr-1" />
                                  Preview
                                </Link>
                              </Button>
                            )}
                            
                            <Button size="sm" variant="outline" onClick={() => handleEdit(post)}>
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
                                  <AlertDialogTitle>Delete Post</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{post.title}"? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(post.id)}>
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
              </TabsContent>
              
              <TabsContent value="guides" className="space-y-4">
                {guidePosts.length === 0 ? (
                  <div className="py-12 text-center">
                    <p className="text-text-secondary">No guides found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {guidePosts.map((post) => (
                      <div key={post.id} className="bg-secondary/30 rounded-2xl p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-4 mb-2">
                              <h3 className="text-lg font-semibold text-text-primary">
                                {post.title}
                              </h3>
                              <Badge className={getStatusColor(post.status)}>
                                {post.status.toUpperCase()}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-text-secondary">
                              <div>
                                <span className="font-medium">Slug:</span> {post.slug}
                              </div>
                              <div>
                                <span className="font-medium">Category:</span> {post.category || 'None'}
                              </div>
                              <div>
                                <span className="font-medium">Created:</span> {formatDate(post.created_at)}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex gap-2 ml-4">
                            {post.status === 'published' && (
                              <Button size="sm" variant="outline" asChild>
                                <Link to={`/guides/${post.slug}`} target="_blank">
                                  <Eye className="w-4 h-4 mr-1" />
                                  Preview
                                </Link>
                              </Button>
                            )}
                            
                            <Button size="sm" variant="outline" onClick={() => handleEdit(post)}>
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
                                  <AlertDialogTitle>Delete Post</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{post.title}"? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(post.id)}>
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
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AdminGuard>
  );
}