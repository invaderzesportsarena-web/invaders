import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Wallet, 
  FileText, 
  Package, 
  Trophy,
  Shield,
  BarChart3,
  Settings
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function Admin() {
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

      // Check if user has admin privileges
      if (!profileData?.role || !['admin', 'moderator'].includes(profileData.role)) {
        // User is authenticated but not admin - show 403
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

  const isAdmin = profile?.role && ['admin', 'moderator'].includes(profile.role);

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-card rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-card rounded-2xl"></div>
            ))}
          </div>
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
            <CardTitle className="text-2xl text-text-primary">Access Denied</CardTitle>
            <CardDescription className="text-text-secondary">
              Admin role required to access this page
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="bg-primary hover:bg-primary/90">
              <Link to="/">Back to Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const adminSections = [
    {
      title: "Tournament Registrations",
      description: "Manage registrations, approvals, and withdrawals",
      icon: Users,
      href: "/admin/registrations",
      color: "bg-primary/10 text-primary"
    },
    {
      title: "Wallet Operations",
      description: "Handle deposits, withdrawals, and transactions",
      icon: Wallet,
      href: "/admin/wallet",
      color: "bg-success/10 text-success"
    },
    {
      title: "Posts Management",
      description: "Create and manage news & guides content",
      icon: FileText,
      href: "/admin/posts",
      color: "bg-warning/10 text-warning"
    },
    {
      title: "Products & Shop",
      description: "Manage shop products and redemptions",
      icon: Package,
      href: "/admin/products",
      color: "bg-accent/10 text-accent"
    },
    {
      title: "Results Uploader",
      description: "Upload tournament results and media",
      icon: Trophy,
      href: "/admin/results",
      color: "bg-gradient-accent text-white"
    },
    {
      title: "System Settings",
      description: "Configure platform settings and preferences",
      icon: Settings,
      href: "/admin/settings",
      color: "bg-secondary/10 text-text-secondary"
    }
  ];

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-text-primary mb-2">
          <span className="bg-gradient-accent bg-clip-text text-transparent">
            Admin Dashboard
          </span>
        </h1>
        <p className="text-text-secondary text-lg">
          Welcome back, {profile?.display_name || 'Admin'}. Manage your esports platform.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="esports-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary text-sm">Total Users</p>
                <p className="text-2xl font-bold text-text-primary">1,234</p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="esports-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary text-sm">Active Tournaments</p>
                <p className="text-2xl font-bold text-text-primary">8</p>
              </div>
              <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center">
                <Trophy className="w-6 h-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="esports-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary text-sm">Total Revenue</p>
                <p className="text-2xl font-bold text-text-primary">$45,280</p>
              </div>
              <div className="w-12 h-12 bg-warning/10 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="esports-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary text-sm">Pending Actions</p>
                <p className="text-2xl font-bold text-text-primary">12</p>
              </div>
              <div className="w-12 h-12 bg-destructive/10 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Admin Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {adminSections.map((section) => {
          const Icon = section.icon;
          return (
            <Card key={section.href} className="esports-card group hover:scale-105 transition-transform duration-200">
              <CardHeader>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${section.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <CardTitle className="text-xl text-text-primary group-hover:text-primary transition-colors">
                  {section.title}
                </CardTitle>
                <CardDescription className="text-text-secondary">
                  {section.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full bg-primary hover:bg-primary/90">
                  <Link to={section.href}>
                    Manage
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}