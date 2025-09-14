import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  Trophy, 
  CreditCard, 
  ShoppingBag, 
  FileText, 
  Settings,
  TrendingUp,
  DollarSign,
  Package,
  Calendar
} from "lucide-react";
import { AdminGuard } from "@/components/AdminGuard";
import { useNavigate } from "react-router-dom";
import SecurityAlert from "@/components/SecurityAlert";

interface DashboardStats {
  totalUsers: number;
  activeTournaments: number;
  totalOrders: number;
  totalPosts: number;
  totalProducts: number;
  pendingDeposits: number;
  pendingWithdrawals: number;
  totalBalance: number;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeTournaments: 0,
    totalOrders: 0,
    totalPosts: 0,
    totalProducts: 0,
    pendingDeposits: 0,
    pendingWithdrawals: 0,
    totalBalance: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      // Fetch all dashboard statistics
      const [
        usersResult,
        tournamentsResult,
        ordersResult,
        postsResult,
        productsResult,
        depositsResult,
        withdrawalsResult,
        balanceResult
      ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact' }),
        supabase.from('tournaments').select('id', { count: 'exact' }).eq('state', 'registration_open'),
        supabase.from('orders').select('id', { count: 'exact' }),
        supabase.from('posts').select('id', { count: 'exact' }),
        supabase.from('products').select('id', { count: 'exact' }),
        supabase.from('zcred_deposit_forms').select('id', { count: 'exact' }).eq('status', 'submitted'),
        supabase.from('zcred_withdrawal_forms').select('id', { count: 'exact' }).eq('status', 'submitted'),
        supabase.from('zcred_wallets').select('balance')
      ]);

      const totalBalance = balanceResult.data?.reduce((sum, wallet) => sum + (wallet.balance || 0), 0) || 0;

      setStats({
        totalUsers: usersResult.count || 0,
        activeTournaments: tournamentsResult.count || 0,
        totalOrders: ordersResult.count || 0,
        totalPosts: postsResult.count || 0,
        totalProducts: productsResult.count || 0,
        pendingDeposits: depositsResult.count || 0,
        pendingWithdrawals: withdrawalsResult.count || 0,
        totalBalance
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
    setLoading(false);
  };

  const quickActions = [
    {
      title: "Manage Users",
      description: "View and manage user accounts",
      icon: Users,
      path: "/admin/users",
      count: stats.totalUsers
    },
    {
      title: "Tournaments",
      description: "Create and manage tournaments",
      icon: Trophy,
      path: "/admin/tournaments",
      count: stats.activeTournaments
    },
    {
      title: "Wallet Requests",
      description: "Process deposits and withdrawals",
      icon: CreditCard,
      path: "/admin/wallet-requests",
      count: stats.pendingDeposits + stats.pendingWithdrawals
    },
    {
      title: "Shop Management",
      description: "Manage products and orders",
      icon: ShoppingBag,
      path: "/admin/shop-management",
      count: stats.totalProducts
    },
    {
      title: "Content Management",
      description: "Manage news and guides",
      icon: FileText,
      path: "/admin/posts",
      count: stats.totalPosts
    },
    {
      title: "Settings",
      description: "System configuration",
      icon: Settings,
      path: "/admin/settings",
      count: 0
    }
  ];

  if (loading) {
    return (
      <AdminGuard>
        <div className="min-h-screen bg-background p-6">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </AdminGuard>
    );
  }

  return (
    <AdminGuard>
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="border-b border-border pb-6">
            <h1 className="text-3xl font-heading font-bold text-text-primary mb-2">
              Admin Dashboard
            </h1>
            <p className="text-text-secondary">
              Complete control panel for managing InvaderZ platform
            </p>
          </div>

          {/* Security Alert */}
          <SecurityAlert isAdmin={true} />

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-border/50 bg-card/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-text-secondary">Total Users</CardTitle>
                <Users className="h-4 w-4 text-text-muted" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-text-primary">{stats.totalUsers}</div>
                <p className="text-xs text-text-muted">
                  <TrendingUp className="inline w-3 h-3 mr-1 text-green-500" />
                  +12% from last month
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-text-secondary">Active Tournaments</CardTitle>
                <Trophy className="h-4 w-4 text-text-muted" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-text-primary">{stats.activeTournaments}</div>
                <p className="text-xs text-text-muted">
                  <Calendar className="inline w-3 h-3 mr-1 text-blue-500" />
                  Currently running
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-text-secondary">Total Z-Credits</CardTitle>
                <DollarSign className="h-4 w-4 text-text-muted" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-text-primary">{stats.totalBalance.toLocaleString()}</div>
                <p className="text-xs text-text-muted">
                  Across all user wallets
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-text-secondary">Products</CardTitle>
                <Package className="h-4 w-4 text-text-muted" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-text-primary">{stats.totalProducts}</div>
                <p className="text-xs text-text-muted">
                  Available in shop
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div>
            <h2 className="text-xl font-semibold text-text-primary mb-6">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {quickActions.map((action) => (
                <Card 
                  key={action.path}
                  className="border-border/50 bg-card/50 hover:bg-card/80 transition-colors cursor-pointer group"
                  onClick={() => navigate(action.path)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <action.icon className="w-6 h-6 text-primary" />
                      </div>
                      {action.count > 0 && (
                        <Badge className="bg-accent text-white">
                          {action.count}
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-semibold text-text-primary mb-2 group-hover:text-primary transition-colors">
                      {action.title}
                    </h3>
                    <p className="text-sm text-text-secondary">
                      {action.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <Card className="border-border/50 bg-card/50">
            <CardHeader>
              <CardTitle className="text-text-primary">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="deposits" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="deposits">Pending Deposits</TabsTrigger>
                  <TabsTrigger value="withdrawals">Pending Withdrawals</TabsTrigger>
                  <TabsTrigger value="orders">Recent Orders</TabsTrigger>
                </TabsList>
                
                <TabsContent value="deposits" className="mt-6">
                  <div className="text-center py-8">
                    <CreditCard className="w-12 h-12 text-text-muted mx-auto mb-4" />
                    <p className="text-text-secondary">
                      {stats.pendingDeposits === 0 
                        ? "No pending deposits" 
                        : `${stats.pendingDeposits} pending deposits`}
                    </p>
                    <Button 
                      className="mt-4" 
                      onClick={() => navigate('/admin/wallet-requests')}
                    >
                      View All Deposits
                    </Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="withdrawals" className="mt-6">
                  <div className="text-center py-8">
                    <DollarSign className="w-12 h-12 text-text-muted mx-auto mb-4" />
                    <p className="text-text-secondary">
                      {stats.pendingWithdrawals === 0 
                        ? "No pending withdrawals" 
                        : `${stats.pendingWithdrawals} pending withdrawals`}
                    </p>
                    <Button 
                      className="mt-4" 
                      onClick={() => navigate('/admin/wallet-requests')}
                    >
                      View All Withdrawals
                    </Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="orders" className="mt-6">
                  <div className="text-center py-8">
                    <ShoppingBag className="w-12 h-12 text-text-muted mx-auto mb-4" />
                    <p className="text-text-secondary">
                      {stats.totalOrders === 0 
                        ? "No recent orders" 
                        : `${stats.totalOrders} total orders`}
                    </p>
                    <Button 
                      className="mt-4" 
                      onClick={() => navigate('/admin/shop-management')}
                    >
                      View All Orders
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminGuard>
  );
}