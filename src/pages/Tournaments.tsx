import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Trophy, Download, ExternalLink, Users, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatInTimeZone } from "date-fns-tz";

interface Tournament {
  id: string;
  title: string;
  game: string;
  state: 'draft' | 'registration_open' | 'locked' | 'in_progress' | 'completed';
  starts_at: string;
  reg_closes_at?: string;
  entry_fee_credits: number;
  cover_url?: string;
  slots?: number;
}

interface Registration {
  tournament_id: string;
  captain_id: string;
  status: 'pending' | 'approved' | 'rejected' | 'withdrawn';
  tournaments: Tournament;
}

interface WhatsAppInvite {
  tournament_id: string;
  invite_link: string;
  active: boolean;
}

export default function Tournaments() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [whatsappInvites, setWhatsappInvites] = useState<WhatsAppInvite[]>([]);
  const [tournamentSlots, setTournamentSlots] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
    fetchTournaments();
    fetchTournamentSlots();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user || null);
    if (session?.user) {
      fetchRegistrations(session.user.id);
      fetchWhatsAppInvites();
    }
  };

  const fetchTournaments = async () => {
    try {
      const { data, error } = await supabase
        .from('tournaments')
        .select('*')
        .order('starts_at', { ascending: true });

      if (error) throw error;
      setTournaments(data || []);
    } catch (error) {
      console.error('Error fetching tournaments:', error);
      toast({
        title: "Error",
        description: "Failed to load tournaments",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRegistrations = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('registrations')
        .select('*, tournaments(*)')
        .eq('captain_id', userId);

      if (error) throw error;
      setRegistrations(data || []);
    } catch (error) {
      console.error('Error fetching registrations:', error);
    }
  };

  const fetchWhatsAppInvites = async () => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_invites')
        .select('*')
        .eq('active', true);

      if (error) throw error;
      setWhatsappInvites(data || []);
    } catch (error) {
      console.error('Error fetching WhatsApp invites:', error);
    }
  };

  const fetchTournamentSlots = async () => {
    try {
      const { data, error } = await supabase
        .from('registrations')
        .select('tournament_id, tournaments(slots)')
        .eq('status', 'approved');

      if (error) throw error;
      
      const slotCounts: Record<string, number> = {};
      data?.forEach((reg: any) => {
        const tournamentId = reg.tournament_id;
        slotCounts[tournamentId] = (slotCounts[tournamentId] || 0) + 1;
      });
      
      setTournamentSlots(slotCounts);
    } catch (error) {
      console.error('Error fetching tournament slots:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return formatInTimeZone(
      new Date(dateString), 
      'Asia/Karachi', 
      'MMM d, h:mm a'
    );
  };

  const formatCountdown = (dateString: string) => {
    const now = new Date();
    const target = new Date(dateString);
    const diff = target.getTime() - now.getTime();
    
    if (diff <= 0) return "Closed";
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours < 24) {
      return `Closes in ${hours}h ${minutes}m`;
    } else {
      return `Closes ${formatDate(dateString)} (Karachi Time)`;
    }
  };

  const generateGoogleCalendarUrl = (tournament: Tournament) => {
    const startDate = new Date(tournament.starts_at);
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // +2 hours
    
    const formatDateForGoogle = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    };

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: tournament.title,
      dates: `${formatDateForGoogle(startDate)}/${formatDateForGoogle(endDate)}`,
      details: `InvaderZ Esports Arena – Tournament\n\nView details: ${window.location.origin}/tournaments/${tournament.id}`,
      location: 'InvaderZ Esports Arena'
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  };

  const downloadICS = (tournament: Tournament) => {
    const startDate = new Date(tournament.starts_at);
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
    
    const formatDateForICS = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '') + 'Z';
    };

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//InvaderZ Esports Arena//Tournament//EN',
      'BEGIN:VEVENT',
      `UID:tournament-${tournament.id}@invaderz.com`,
      `DTSTART:${formatDateForICS(startDate)}`,
      `DTEND:${formatDateForICS(endDate)}`,
      `SUMMARY:${tournament.title}`,
      `DESCRIPTION:InvaderZ Esports Arena – Tournament\\n\\nView details: ${window.location.origin}/tournaments/${tournament.id}`,
      'LOCATION:InvaderZ Esports Arena',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tournament.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStateColor = (state: string) => {
    switch (state) {
      case 'registration_open': return 'bg-primary text-primary-foreground';
      case 'locked': return 'bg-warning text-black';
      case 'in_progress': return 'bg-gradient-accent text-white';
      case 'completed': return 'bg-secondary text-secondary-foreground';
      default: return 'bg-secondary text-secondary-foreground';
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

  const getRegistrationStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-secondary text-secondary-foreground';
      case 'approved': return 'bg-success text-white';
      case 'rejected': return 'bg-destructive text-destructive-foreground';
      case 'withdrawn': return 'bg-muted text-muted-foreground';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const filterLiveRegOpen = () => {
    const now = new Date();
    return tournaments.filter(t => 
      t.state === 'registration_open' && 
      now < new Date(t.reg_closes_at || t.starts_at)
    ).sort((a, b) => 
      new Date(a.reg_closes_at || a.starts_at).getTime() - 
      new Date(b.reg_closes_at || b.starts_at).getTime()
    );
  };

  const filterUpcoming = () => {
    const now = new Date();
    const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000);
    return tournaments.filter(t => 
      (t.state === 'locked' || t.state === 'in_progress') &&
      new Date(t.starts_at) >= sixHoursAgo
    ).sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
  };

  const filterPlayed = () => {
    if (!user) return [];
    const userRegisteredTournamentIds = registrations.map(r => r.tournament_id);
    return tournaments.filter(t => 
      t.state === 'completed' && 
      userRegisteredTournamentIds.includes(t.id)
    ).sort((a, b) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime());
  };

  const hasUserRegistered = (tournamentId: string) => {
    return registrations.some(r => r.tournament_id === tournamentId);
  };

  const getWhatsAppInvite = (tournamentId: string) => {
    return whatsappInvites.find(inv => inv.tournament_id === tournamentId);
  };

  const TournamentCard = ({ tournament, showRegisterButton = false, showCalendarActions = false, showResultsButton = false, registration = null }: { 
    tournament: Tournament, 
    showRegisterButton?: boolean,
    showCalendarActions?: boolean,
    showResultsButton?: boolean,
    registration?: Registration | null 
  }) => (
    <Card 
      className="esports-card group cursor-pointer overflow-hidden" 
      onClick={() => navigate(`/tournaments/${tournament.id}`)}
    >
      {/* Cover Image */}
      {tournament.cover_url && (
        <div className="relative h-48 w-full overflow-hidden">
          <img
            src={tournament.cover_url}
            alt={tournament.title}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <Badge className={`absolute top-3 right-3 ${getStateColor(tournament.state)}`}>
            {getStateLabel(tournament.state)}
          </Badge>
        </div>
      )}
      
      <CardHeader className={tournament.cover_url ? "pb-2" : ""}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl text-text-primary group-hover:text-primary transition-colors">
              {tournament.title}
            </CardTitle>
            <CardDescription className="text-text-secondary mt-1">
              {tournament.game}
            </CardDescription>
          </div>
          {!tournament.cover_url && (
            <Badge className={getStateColor(tournament.state)}>
              {getStateLabel(tournament.state)}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-text-secondary text-sm">
          <Calendar className="w-4 h-4" />
          {formatDate(tournament.starts_at)}
        </div>

        {tournament.state === 'registration_open' && (
          <div className="space-y-2">
            <div className="text-sm text-warning">
              {formatCountdown(tournament.reg_closes_at || tournament.starts_at)}
            </div>
            {tournament.slots && (
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <Users className="w-4 h-4" />
                <span>
                  {tournamentSlots[tournament.id] || 0}/{tournament.slots} slots filled
                </span>
              </div>
            )}
          </div>
        )}

        {registration && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-text-secondary">Status:</span>
            <Badge className={getRegistrationStatusColor(registration.status)}>
              {registration.status.toUpperCase()}
            </Badge>
          </div>
        )}

        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <Button 
            variant="outline"
            className="flex-[2]"
            onClick={() => navigate(`/tournaments/${tournament.id}`)}
          >
            View Detail
          </Button>
          {showRegisterButton && !hasUserRegistered(tournament.id) && (
            <Button 
              variant="default"
              className="flex-1 bg-primary hover:bg-primary/90"
              onClick={() => navigate(`/tournaments/${tournament.id}/register`)}
            >
              Register Now
            </Button>
          )}

          {showCalendarActions && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(generateGoogleCalendarUrl(tournament), '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-1" />
                Google Cal
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadICS(tournament)}
              >
                <Download className="w-4 h-4 mr-1" />
                .ics
              </Button>
            </>
          )}

          {showResultsButton && hasUserRegistered(tournament.id) && (
            <Button 
              variant="outline"
              className="flex-1"
              onClick={() => navigate(`/tournaments/${tournament.id}#results`)}
            >
              View Results
            </Button>
          )}

          {registration?.status === 'approved' && getWhatsAppInvite(tournament.id) && (
            <Button
              variant="default"
              className="bg-success hover:bg-success/90"
              onClick={() => window.open(getWhatsAppInvite(tournament.id)?.invite_link, '_blank')}
            >
              Join WhatsApp
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto py-8 px-4">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-secondary/50 rounded w-1/3"></div>
            <div className="h-64 bg-secondary/50 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto py-8 px-4">
        {/* Back Navigation */}
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate(-1)} className="flex items-center space-x-2">
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </Button>
        </div>

        <div className="mb-8">
          <h1 className="text-4xl font-heading font-bold text-text-primary mb-2">
            <span className="bg-gradient-accent bg-clip-text text-transparent">
              Tournaments
            </span>
          </h1>
          <p className="text-text-secondary text-lg">
            Compete in epic tournaments and prove your skills against the best players.
          </p>
        </div>

      <Tabs defaultValue="live" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="live">Live (Reg Open)</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="played">Played</TabsTrigger>
          <TabsTrigger value="registered">Registered</TabsTrigger>
        </TabsList>

        <TabsContent value="live" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filterLiveRegOpen().map((tournament) => (
              <TournamentCard 
                key={tournament.id} 
                tournament={tournament} 
                showRegisterButton={!!user}
              />
            ))}
            {filterLiveRegOpen().length === 0 && (
              <div className="col-span-full text-center py-12 text-text-muted">
                No tournaments with open registration at the moment.
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="upcoming" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filterUpcoming().map((tournament) => (
              <TournamentCard 
                key={tournament.id} 
                tournament={tournament} 
                showCalendarActions
              />
            ))}
            {filterUpcoming().length === 0 && (
              <div className="col-span-full text-center py-12 text-text-muted">
                No upcoming tournaments scheduled.
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="played" className="mt-6">
          {!user ? (
            <div className="text-center py-12 text-text-muted">
              Please log in to view tournaments you've participated in.
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filterPlayed().map((tournament) => (
                <TournamentCard 
                  key={tournament.id} 
                  tournament={tournament} 
                  showResultsButton={true}
                />
              ))}
              {filterPlayed().length === 0 && (
                <div className="col-span-full text-center py-12 text-text-muted">
                  No completed tournaments you've participated in.
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="registered" className="mt-6">
          {!user ? (
            <div className="text-center py-12 text-text-muted">
              Please log in to view your registrations.
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
               {registrations.map((registration) => (
                <TournamentCard 
                  key={registration.tournament_id} 
                  tournament={registration.tournaments} 
                  registration={registration}
                  showResultsButton={registration.tournaments.state === 'completed'}
                />
              ))}
              {registrations.length === 0 && (
                <div className="col-span-full text-center py-12 text-text-muted">
                  You haven't registered for any tournaments yet.
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}