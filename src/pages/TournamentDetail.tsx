import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, Trophy, DollarSign, Clock, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

interface Tournament {
  id: string;
  title: string;
  game: string;
  state: 'draft' | 'registration_open' | 'locked' | 'in_progress' | 'completed';
  starts_at: string;
  reg_closes_at?: string;
  entry_fee_credits: number;
  rules_md?: string;
  format: string;
}

interface ResultMedia {
  id: string;
  title?: string;
  image_url: string;
  thumb_url?: string;
  created_at: string;
}

export default function TournamentDetail() {
  const { id } = useParams<{ id: string }>();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [results, setResults] = useState<ResultMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      fetchTournament();
      fetchResults();
    }
    checkAuth();
  }, [id]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user || null);
  };

  const fetchTournament = async () => {
    if (!id) return;
    
    try {
      const { data, error } = await supabase
        .from('tournaments')
        .select('*')
        .eq('id', id)
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
    } finally {
      setLoading(false);
    }
  };

  const fetchResults = async () => {
    if (!id) return;
    
    try {
      const { data, error } = await supabase
        .from('results_media')
        .select('*')
        .eq('tournament_id', id)
        .eq('visible', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setResults(data || []);
    } catch (error) {
      console.error('Error fetching results:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStateColor = (state: string) => {
    switch (state) {
      case 'registration_open': return 'bg-success text-white';
      case 'locked': return 'bg-warning text-white';
      case 'in_progress': return 'bg-primary text-white';
      case 'completed': return 'bg-secondary text-text-secondary';
      default: return 'bg-secondary text-text-secondary';
    }
  };

  const getStateLabel = (state: string) => {
    switch (state) {
      case 'registration_open': return 'REG OPEN';
      case 'locked': return 'STARTING SOON';
      case 'in_progress': return 'ONGOING';
      case 'completed': return 'FINISHED';
      default: return state.toUpperCase();
    }
  };

  const canRegister = () => {
    if (!tournament || !user) return false;
    if (tournament.state !== 'registration_open') return false;
    
    const now = new Date();
    const regCloses = tournament.reg_closes_at ? new Date(tournament.reg_closes_at) : new Date(tournament.starts_at);
    
    return now < regCloses;
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
    <div className="container mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-bold text-text-primary mb-2">
            {tournament.title}
          </h1>
          <div className="flex items-center gap-4">
            <Badge className={getStateColor(tournament.state)}>
              {getStateLabel(tournament.state)}
            </Badge>
            <span className="text-text-secondary">{tournament.game}</span>
          </div>
        </div>
        {canRegister() && (
          <Button asChild variant="esports" size="lg">
            <Link to={`/tournaments/${tournament.id}/register`}>
              Register Team
            </Link>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Overview */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="esports-card">
            <CardHeader>
              <CardTitle className="text-text-primary">Overview</CardTitle>
            </CardHeader>
            <CardContent>
              {tournament.rules_md ? (
                <div className="prose prose-invert max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: tournament.rules_md.replace(/\n/g, '<br>') }} />
                </div>
              ) : (
                <p className="text-text-secondary">No rules available for this tournament.</p>
              )}
            </CardContent>
          </Card>

          {/* Results Section */}
          {tournament.state === 'completed' && results.length > 0 && (
            <Card className="esports-card">
              <CardHeader>
                <CardTitle className="text-text-primary flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {results.map((result) => (
                    <Dialog key={result.id}>
                      <DialogTrigger asChild>
                        <div className="relative group cursor-pointer">
                          <img
                            src={result.thumb_url || result.image_url}
                            alt={result.title || 'Tournament Result'}
                            className="w-full h-32 object-cover rounded-lg transition-transform group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                            <Eye className="w-6 h-6 text-white" />
                          </div>
                          {result.title && (
                            <p className="text-xs text-text-secondary mt-2 truncate">
                              {result.title}
                            </p>
                          )}
                        </div>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl">
                        <img
                          src={result.image_url}
                          alt={result.title || 'Tournament Result'}
                          className="w-full h-auto rounded-lg"
                        />
                        {result.title && (
                          <p className="text-text-primary font-semibold mt-2">
                            {result.title}
                          </p>
                        )}
                      </DialogContent>
                    </Dialog>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Schedule */}
          <Card className="esports-card">
            <CardHeader>
              <CardTitle className="text-text-primary flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-text-secondary text-sm">Tournament Start</p>
                <p className="text-text-primary font-semibold">
                  {formatDate(tournament.starts_at)}
                </p>
              </div>
              {tournament.reg_closes_at && (
                <div>
                  <p className="text-text-secondary text-sm">Registration Closes</p>
                  <p className="text-text-primary font-semibold">
                    {formatDate(tournament.reg_closes_at)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Entry Info */}
          <Card className="esports-card">
            <CardHeader>
              <CardTitle className="text-text-primary flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                Entry Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">Entry Fee</span>
                <span className="text-text-primary font-semibold">
                  {tournament.entry_fee_credits} Z-Credits
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">Format</span>
                <span className="text-text-primary font-semibold capitalize">
                  {tournament.format.replace('_', ' ')}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}