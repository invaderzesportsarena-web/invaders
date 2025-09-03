import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Star, Medal } from "lucide-react";

export default function Results() {
  const mockResults = [
    {
      id: 1,
      tournament: "Apex Legends Championship",
      winner: "Team Phoenix",
      prize: "$10,000",
      date: "Jan 15, 2024",
      image: "/placeholder-tournament-1.jpg"
    },
    {
      id: 2,
      tournament: "Valorant Pro Series",
      winner: "Digital Wolves",
      prize: "$15,000", 
      date: "Jan 10, 2024",
      image: "/placeholder-tournament-2.jpg"
    },
    {
      id: 3,
      tournament: "CS2 Winter Cup",
      winner: "Neon Strikers",
      prize: "$25,000",
      date: "Jan 5, 2024",
      image: "/placeholder-tournament-3.jpg"
    }
  ];

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-text-primary mb-2">
          <span className="bg-gradient-accent bg-clip-text text-transparent">
            Tournament Results
          </span>
        </h1>
        <p className="text-text-secondary text-lg">
          Celebrate the champions and relive the epic moments.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {mockResults.map((result, index) => (
          <Card key={result.id} className="esports-card group">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  index === 0 ? 'bg-warning' : 
                  index === 1 ? 'bg-esports-bg-700' : 'bg-success'
                }`}>
                  {index === 0 ? <Trophy className="w-5 h-5 text-white" /> :
                   index === 1 ? <Medal className="w-5 h-5 text-white" /> :
                   <Star className="w-5 h-5 text-white" />}
                </div>
                <div>
                  <CardTitle className="text-lg text-text-primary">
                    {result.tournament}
                  </CardTitle>
                  <CardDescription className="text-text-muted">
                    {result.date}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="aspect-video bg-secondary rounded-xl flex items-center justify-center">
                <Trophy className="w-12 h-12 text-text-muted" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary">Winner:</span>
                  <span className="font-semibold text-text-primary">{result.winner}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary">Prize:</span>
                  <span className="font-bold text-success">{result.prize}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {mockResults.length === 0 && (
        <div className="text-center py-12 text-text-muted">
          <Trophy className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-semibold mb-2">No Results Yet</h3>
          <p>Tournament results will appear here after competitions are completed.</p>
        </div>
      )}
    </div>
  );
}