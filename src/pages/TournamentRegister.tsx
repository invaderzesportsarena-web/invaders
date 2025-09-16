import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trophy, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatZcredDisplay } from "@/utils/formatZcreds";
import { SUPABASE_CONFIG } from "@/config/supabase";

interface Tournament {
  id: string;
  title: string;
  game: string;
  entry_fee_credits: number;
  starts_at: string;
  reg_closes_at?: string;
}

export default function TournamentRegister() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    [SUPABASE_CONFIG.columns.registrations.TEAM_NAME]: '',
    [SUPABASE_CONFIG.columns.registrations.CONTACT_PHONE]: '',
    [SUPABASE_CONFIG.columns.registrations.WHATSAPP_NUMBER]: ''
  });

  useEffect(() => {
    checkAuth();
    if (id) {
      fetchTournament();
    }
  }, [id]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      navigate('/auth');
      return;
    }
    setUser(session.user);
  };

  const fetchTournament = async () => {
    if (!id) return;
    
    try {
      const { data, error } = await supabase
        .from(SUPABASE_CONFIG.tables.TOURNAMENTS)
        .select('*')
        .eq(SUPABASE_CONFIG.columns.tournaments.ID, id)
        .single();

      if (error) throw error;
      setTournament(data);
    } catch (error) {
      console.error('Error fetching tournament:', error);
      toast({
        title: "Error",
        description: "Failed to load tournament details",
        variant: "destructive"
      });
      navigate('/tournaments');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !tournament) return;

    // Validate form using schema-safe field names
    const teamName = formData[SUPABASE_CONFIG.columns.registrations.TEAM_NAME];
    const contactPhone = formData[SUPABASE_CONFIG.columns.registrations.CONTACT_PHONE];
    const whatsappNumber = formData[SUPABASE_CONFIG.columns.registrations.WHATSAPP_NUMBER];
    
    if (!teamName || !contactPhone || !whatsappNumber) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    // Check if registration is still open
    const now = new Date();
    const regCloses = tournament.reg_closes_at ? new Date(tournament.reg_closes_at) : new Date(tournament.starts_at);
    
    if (now >= regCloses) {
      toast({
        title: "Registration Closed",
        description: "Registration for this tournament has closed",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);

    try {
      // Use the register_for_tournament function which handles balance validation
      const { error } = await supabase.rpc(SUPABASE_CONFIG.functions.REGISTER_FOR_TOURNAMENT, {
        p_tournament_id: tournament.id,
        p_team_name: teamName,
        p_entry_fee: tournament.entry_fee_credits
      });

      if (error) {
        // Handle specific error messages
        if (error.message.includes('Insufficient Z-Creds')) {
          throw new Error('Not sufficient Z-Credits, kindly deposit more funds to your wallet');
        } else if (error.message.includes('Complete your profile')) {
          throw new Error('Please complete your profile (username, WhatsApp) before registering');
        } else if (error.message.includes('Tournament is full')) {
          throw new Error('Tournament is full. All slots are taken.');
        }
        throw error;
      }

      toast({
        title: "Registration Successful!",
        description: `Team "${teamName}" has been registered successfully. Entry fee of ${formatZcredDisplay(tournament.entry_fee_credits)} has been deducted.`,
      });

      navigate(`/tournaments/${tournament.id}`);
    } catch (error: any) {
      console.error('Error submitting registration:', error);
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to submit registration. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

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

  if (!tournament) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <h1 className="text-2xl font-bold text-text-primary mb-4">Tournament Not Found</h1>
        <Button asChild>
          <Link to="/tournaments">Back to Tournaments</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate(`/tournaments/${tournament.id}`)}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Tournament
        </Button>
        
        <h1 className="text-3xl font-bold text-text-primary mb-2">
          Register for Tournament
        </h1>
        <p className="text-text-secondary">
          {tournament.title} • {tournament.game}
        </p>
      </div>

      <Card className="esports-card">
        <CardHeader>
          <CardTitle className="text-text-primary flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Team Registration
          </CardTitle>
          <CardDescription className="text-text-secondary">
            Fill in your team details to register for this tournament.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="team_name" className="text-text-primary">
                Team Name <span className="text-danger">*</span>
              </Label>
              <Input
                id="team_name"
                value={formData[SUPABASE_CONFIG.columns.registrations.TEAM_NAME]}
                onChange={(e) => handleInputChange(SUPABASE_CONFIG.columns.registrations.TEAM_NAME, e.target.value)}
                placeholder="Enter your team name"
                className="rounded-2xl"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_phone" className="text-text-primary">
                Contact Phone <span className="text-danger">*</span>
              </Label>
              <Input
                id="contact_phone"
                type="tel"
                value={formData[SUPABASE_CONFIG.columns.registrations.CONTACT_PHONE]}
                onChange={(e) => handleInputChange(SUPABASE_CONFIG.columns.registrations.CONTACT_PHONE, e.target.value)}
                placeholder="Enter your phone number"
                className="rounded-2xl"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsapp_number" className="text-text-primary">
                WhatsApp Number <span className="text-danger">*</span>
              </Label>
              <Input
                id="whatsapp_number"
                type="tel"
                value={formData[SUPABASE_CONFIG.columns.registrations.WHATSAPP_NUMBER]}
                onChange={(e) => handleInputChange(SUPABASE_CONFIG.columns.registrations.WHATSAPP_NUMBER, e.target.value)}
                placeholder="Enter your WhatsApp number"
                className="rounded-2xl"
                required
              />
              <p className="text-xs text-text-muted">
                Used for tournament communications and group invites
              </p>
            </div>

            <div className="bg-secondary/50 rounded-2xl p-4">
              <h3 className="font-semibold text-text-primary mb-2">Tournament Details</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Entry Fee:</span>
                  <span className="text-text-primary font-semibold">{formatZcredDisplay(tournament.entry_fee_credits)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Tournament Start:</span>
                  <span className="text-text-primary">
                    {new Date(tournament.starts_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/tournaments/${tournament.id}`)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="esports"
                disabled={submitting}
                className="flex-1"
              >
                {submitting ? "Submitting..." : "Register Team"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}