import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User as UserType } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Users, Copy, Plus, Edit, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface TeamSummarySectionProps {
  user: UserType;
}

export function TeamSummarySection({ user }: TeamSummarySectionProps) {
  const [ownedTeam, setOwnedTeam] = useState<any>(null);
  const [memberTeam, setMemberTeam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchTeamData();
  }, [user.id]);

  const fetchTeamData = async () => {
    try {
      // Check for owned team
      const { data: ownedData } = await supabase
        .from('teams')
        .select('*')
        .eq('owner_id', user.id)
        .limit(1)
        .single();

      setOwnedTeam(ownedData);

      // If no owned team, check for membership
      if (!ownedData) {
        const { data: memberData } = await supabase
          .from('team_players')
          .select('*, team:teams(*)')
          .eq('player_name', user.email) // Assuming player_name might be email
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        setMemberTeam(memberData?.team);
      }
    } catch (error) {
      // Handle no data found gracefully
    }
    setLoading(false);
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: `${label} copied!` });
    } catch (error) {
      toast({ 
        title: "Copy failed", 
        description: "Could not copy to clipboard",
        variant: "destructive"
      });
    }
  };

  const handleOpenTeam = () => {
    navigate('/my-team');
  };

  const handleEditTeam = () => {
    navigate('/my-team?edit=true');
  };

  const handleCreateTeam = () => {
    navigate('/my-team?create=true');
  };

  if (loading) {
    return (
      <Card className="bg-[#0F1621] border-[#233246] rounded-2xl shadow-lg">
        <CardContent className="p-6">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-[#0F1621] border-[#233246] rounded-2xl shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-text-primary">
          <Users className="w-5 h-5" />
          My Team
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {ownedTeam ? (
          <div className="space-y-4">
            <div>
              <Label className="text-text-secondary">Team Name</Label>
              <Input
                value={ownedTeam.name}
                readOnly
                className="bg-bg-700 border-stroke text-text-primary mt-1"
              />
            </div>

            <div>
              <Label className="text-text-secondary">Team ID</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  value={ownedTeam.id}
                  readOnly
                  className="bg-bg-700 border-stroke text-text-muted font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(ownedTeam.id, "Team ID")}
                  className="shrink-0 border-stroke hover:bg-bg-700"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleOpenTeam}
                variant="outline"
                className="flex-1 border-stroke hover:bg-bg-700"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open My Team
              </Button>
              <Button
                onClick={handleEditTeam}
                variant="outline"
                className="border-stroke hover:bg-bg-700"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Team
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            {memberTeam ? (
              <div className="space-y-4">
                <p className="text-text-muted">Member of: <span className="text-text-primary font-medium">{memberTeam.name}</span></p>
                <p className="text-text-secondary text-sm">No team yet as owner</p>
                <Button onClick={handleCreateTeam} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Team
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-text-secondary">No team yet</p>
                <Button onClick={handleCreateTeam} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Team
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}