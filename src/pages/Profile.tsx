import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AccountInfoSection } from "@/components/profile/AccountInfoSection";
import { UsernameSection } from "@/components/profile/UsernameSection";
import { PersonalInfoSection } from "@/components/profile/PersonalInfoSection";
import { TeamSummarySection } from "@/components/profile/TeamSummarySection";

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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-2">Profile Settings</h1>
        <p className="text-text-secondary">Manage your account and preferences</p>
      </div>

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
  );
}