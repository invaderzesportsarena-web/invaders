import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Wallet, 
  FileText, 
  Package, 
  Trophy,
  BarChart3,
  Settings,
  Medal,
  DollarSign
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AdminGuard } from "@/components/AdminGuard";

export default function Admin() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeTournaments: 0,
    totalRevenue: 0,
    pendingActions: 0
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Total Users
      const { count: usersCount, error: usersError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      if (usersError) throw usersError;

      // Active Tournaments  
      const { count: tournamentsCount, error: tournamentsError } = await supabase
        .from('tournaments')
        .select('*', { count: 'exact', head: true })
        .in('state', ['registration_open', 'locked', 'in_progress']);

      if (tournamentsError) throw tournamentsError;

      // Total Revenue from approved positive transactions
      const { data: revenueData, error: revenueError } = await supabase
        .from('zcred_transactions')
        .select('amount')
        .eq('status', 'approved')
        .gt('amount', 0);

      if (revenueError) throw revenueError;

      const totalRevenue = revenueData?.reduce((sum, transaction) => sum + transaction.amount, 0) || 0;

      // Pending Actions (deposits + withdrawals + registrations)
      const [depositsResult, withdrawalsResult, registrationsResult] = await Promise.all([
        supabase.from('zcred_deposit_forms').select('*', { count: 'exact', head: true }).eq('status', 'submitted'),
        supabase.from('zcred_withdrawal_forms').select('*', { count: 'exact', head: true }).eq('status', 'submitted'),
        supabase.from('registrations').select('*', { count: 'exact', head: true }).eq('status', 'pending')
      ]);

      const pendingActions = (depositsResult.count || 0) + (withdrawalsResult.count || 0) + (registrationsResult.count || 0);

      setStats({
        totalUsers: usersCount || 0,
        activeTournaments: tournamentsCount || 0,
        totalRevenue,
        pendingActions
      });

    } catch (error) {
      console.error('Error fetching stats:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard statistics",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const adminSections = [
    {
      title: "Tournament Registrations",
      description: "Manage registrations, approvals, and withdrawals",
      icon: Users,
      href: "/admin/registrations",
      color: "bg-primary/10 text-primary"
    },
    {
      title: "Tournaments Management",
      description: "Create and manage tournaments",
      icon: Trophy,
      href: "/admin/tournaments",
      color: "bg-cyan-500/10 text-cyan-400"
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
      href: "/admin/shop-management",
      color: "bg-accent/10 text-accent"
    },
    {
      title: "Results Uploader",
      description: "Upload tournament results and media",
      icon: Medal,
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

  if (loading) {
    return (
      <AdminGuard>
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
      </AdminGuard>
    );
  }

  return (
    <AdminGuard>
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-text-primary mb-2">
            <span className="bg-gradient-accent bg-clip-text text-transparent">
              Admin Dashboard
            </span>
          </h1>
          <p className="text-text-secondary text-lg">
            Welcome back, Admin. Manage your esports platform.
          </p>
        </div>

        {/* Manual Z-Credit Adjustment Section */}
        <Card className="esports-card mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-text-primary mb-2">Manual Z-Credit Adjustment</h2>
                <p className="text-text-secondary">Add or subtract Z-Credits from any user account</p>
              </div>
              <Button asChild className="bg-gradient-accent hover:shadow-[var(--shadow-glow)]">
                <Link to="/admin/manual-adjustment">
                  <DollarSign className="w-4 h-4 mr-2" />
                  Manage Z-Credits
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="esports-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-secondary text-sm">Total Users</p>
                  <p className="text-2xl font-bold text-text-primary">{stats.totalUsers.toLocaleString()}</p>
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
                  <p className="text-2xl font-bold text-text-primary">{stats.activeTournaments}</p>
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
                  <p className="text-2xl font-bold text-text-primary">{stats.totalRevenue.toLocaleString()} ZC</p>
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
                  <p className="text-2xl font-bold text-text-primary">{stats.pendingActions}</p>
                </div>
                <div className="w-12 h-12 bg-destructive/10 rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-destructive" />
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
    </AdminGuard>
  );
}