import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { 
  Home, 
  Trophy, 
  Image, 
  Newspaper, 
  BookOpen, 
  ShoppingBag, 
  Wallet, 
  User as UserIcon,
  LogOut,
  Menu,
  X,
  ArrowLeft
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    setProfile(data);
  };

  const isAdmin = profile?.role === 'admin' || profile?.role === 'moderator';

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const isActivePage = (path: string) => {
    return location.pathname === path;
  };

  const navItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/tournaments", label: "Tournaments", icon: Trophy },
    { href: "/news", label: "News", icon: Newspaper },
    { href: "/guides", label: "Guides", icon: BookOpen },
    { href: "/shop", label: "Shop", icon: ShoppingBag },
  ];

  const userNavItems = user ? [
    { href: "/wallet", label: "My Wallet", icon: Wallet },
    { href: "/profile", label: "Profile", icon: UserIcon },
  ] : [];

  return (
    <div className="min-h-screen bg-background">
      {/* Back Arrow - Top Left */}
      {location.pathname !== "/" && (
        <div className="fixed top-4 left-4 z-50">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate(-1)} 
            className="flex items-center space-x-1 text-text-primary hover:text-primary bg-background/80 backdrop-blur-sm border border-border rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </Button>
        </div>
      )}
      
      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}