import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AdminOnlyGuardProps {
  children: React.ReactNode;
}

export function AdminOnlyGuard({ children }: AdminOnlyGuardProps) {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuthAndRole();
  }, []);

  const checkAuthAndRole = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        navigate('/auth');
        return;
      }

      setUser(session.user);

      // Fetch user profile to check role
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error) throw error;
      
      setProfile(profileData);

      // Check if user has ADMIN privileges only (not moderator)
      if (!profileData?.role || profileData.role !== 'admin') {
        // User is authenticated but not admin - will show 403
        setLoading(false);
        return;
      }

    } catch (error) {
      console.error('Error checking auth:', error);
      toast({
        title: "Error",
        description: "Failed to verify permissions",
        variant: "destructive"
      });
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = profile?.role === 'admin';

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-card rounded w-1/3"></div>
          <div className="h-64 bg-card rounded"></div>
        </div>
      </div>
    );
  }

  // Show 403 if user is authenticated but not admin
  if (user && !isAdmin) {
    return (
      <div className="container mx-auto py-16 px-4 flex items-center justify-center min-h-[60vh]">
        <Card className="esports-card max-w-md w-full text-center">
          <CardHeader>
            <div className="w-16 h-16 bg-destructive/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-destructive" />
            </div>
            <CardTitle className="text-2xl text-text-primary">Admin Access Required</CardTitle>
            <CardDescription className="text-text-secondary">
              Only administrators can manage user roles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="bg-primary hover:bg-primary/90">
              <a href="/">Back to Home</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}