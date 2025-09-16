import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AccountInfoSection } from "@/components/profile/AccountInfoSection";
import { UsernameSection } from "@/components/profile/UsernameSection";
import { PersonalInfoSection } from "@/components/profile/PersonalInfoSection";
import { TeamSummarySection } from "@/components/profile/TeamSummarySection";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Settings, Shield } from "lucide-react";

export default function Profile() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    
    setUser(session.user);
    await fetchProfile(session.user.id);
    setLoading(false);
  };

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (data) {
      setProfile(data);
    }
  };

  const handleProfileUpdate = async () => {
    await fetchProfile(user.id);
  };

  const isAdmin = profile?.role === 'admin' || profile?.role === 'moderator';

  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Back Navigation */}
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate(-1)} className="flex items-center space-x-2">
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </Button>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-heading font-bold text-text-primary mb-2">Profile Settings</h1>
          <p className="text-text-secondary">Manage your account and preferences</p>
        </div>

        {/* Admin Dashboard Access */}
        {isAdmin && (
          <div className="mb-6 p-6 bg-gradient-accent/10 border border-primary/20 rounded-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Shield className="w-6 h-6 text-primary" />
                <div>
                  <h3 className="text-lg font-bold text-text-primary">Admin Access</h3>
                  <p className="text-text-secondary">Manage tournaments, users, and platform settings</p>
                </div>
              </div>
              <Button asChild className="bg-gradient-accent hover:shadow-[var(--shadow-glow)] font-bold">
                <Link to="/admin">
                  <Settings className="w-4 h-4 mr-2" />
                  Admin Dashboard
                </Link>
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* Account Info */}
          <AccountInfoSection user={user} />

          {/* Username */}
          <UsernameSection 
            user={user} 
            profile={profile} 
            onUpdate={handleProfileUpdate} 
          />

          {/* Personal Info */}
          <PersonalInfoSection 
            user={user} 
            profile={profile} 
            onUpdate={handleProfileUpdate} 
          />

          {/* Team Summary */}
          <TeamSummarySection user={user} />
        </div>
      </div>
    </div>
  );
}