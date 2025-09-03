import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Trophy, Users, Gamepad2 } from "lucide-react";

export default function Tournaments() {
  const tournaments = [
    {
      id: 1,
      title: "Apex Legends Championship",
      game: "Apex Legends",
      state: "registration_open",
      starts_at: "2024-01-15T18:00:00Z",
      entry_fee_credits: 100,
      prize_pool: "$10,000"
    },
    {
      id: 2,
      title: "Valorant Pro Series",
      game: "Valorant", 
      state: "in_progress",
      starts_at: "2024-01-10T16:00:00Z",
      entry_fee_credits: 150,
      prize_pool: "$15,000"
    },
    {
      id: 3,
      title: "CS2 Winter Cup",
      game: "Counter-Strike 2",
      state: "completed",
      starts_at: "2024-01-05T20:00:00Z", 
      entry_fee_credits: 200,
      prize_pool: "$25,000"
    }
  ];

  const getStateColor = (state: string) => {
    switch (state) {
      case 'registration_open': return 'bg-success text-white';
      case 'in_progress': return 'bg-warning text-white';
      case 'completed': return 'bg-esports-bg-700 text-text-secondary';
      default: return 'bg-secondary text-text-secondary';
    }
  };

  const getStateLabel = (state: string) => {
    switch (state) {
      case 'registration_open': return 'Open';
      case 'in_progress': return 'Live';
      case 'completed': return 'Ended';
      default: return state;
    }
  };

  const filterTournaments = (state: string) => {
    switch (state) {
      case 'live':
        return tournaments.filter(t => t.state === 'in_progress');
      case 'upcoming':
        return tournaments.filter(t => t.state === 'registration_open' || t.state === 'locked');
      case 'past':
        return tournaments.filter(t => t.state === 'completed');
      default:
        return tournaments;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const TournamentCard = ({ tournament }: { tournament: any }) => (
    <Card className="esports-card group">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl text-text-primary group-hover:text-primary transition-colors">
              {tournament.title}
            </CardTitle>
            <CardDescription className="text-text-secondary mt-1">
              <div className="flex items-center gap-2">
                <Gamepad2 className="w-4 h-4" />
                {tournament.game}
              </div>
            </CardDescription>
          </div>
          <Badge className={getStateColor(tournament.state)}>
            {getStateLabel(tournament.state)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 text-text-secondary">
            <Calendar className="w-4 h-4" />
            {formatDate(tournament.starts_at)}
          </div>
          <div className="flex items-center gap-2 text-text-secondary">
            <Trophy className="w-4 h-4" />
            {tournament.prize_pool}
          </div>
          <div className="flex items-center gap-2 text-text-secondary">
            <Users className="w-4 h-4" />
            {tournament.entry_fee_credits} Z-Credits
          </div>
          <div className="flex items-center gap-2 text-text-secondary">
            <Clock className="w-4 h-4" />
            Single Elimination
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="primary" className="flex-1">
            View Details
          </Button>
          {tournament.state === 'registration_open' && (
            <Button variant="esports">
              Register Team
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-text-primary mb-2">
          <span className="bg-gradient-accent bg-clip-text text-transparent">
            Tournaments
          </span>
        </h1>
        <p className="text-text-secondary text-lg">
          Compete in epic tournaments and prove your skills against the best players.
        </p>
      </div>

      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="live">Live</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
        </TabsList>

        <TabsContent value="live" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filterTournaments('live').map((tournament) => (
              <TournamentCard key={tournament.id} tournament={tournament} />
            ))}
            {filterTournaments('live').length === 0 && (
              <div className="col-span-full text-center py-12 text-text-muted">
                No live tournaments at the moment.
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="upcoming" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filterTournaments('upcoming').map((tournament) => (
              <TournamentCard key={tournament.id} tournament={tournament} />
            ))}
            {filterTournaments('upcoming').length === 0 && (
              <div className="col-span-full text-center py-12 text-text-muted">
                No upcoming tournaments scheduled.
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="past" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filterTournaments('past').map((tournament) => (
              <TournamentCard key={tournament.id} tournament={tournament} />
            ))}
            {filterTournaments('past').length === 0 && (
              <div className="col-span-full text-center py-12 text-text-muted">
                No past tournaments to display.
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}