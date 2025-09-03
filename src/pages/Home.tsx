import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Trophy, Users, Zap, Target, Star, Gamepad2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function Home() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user || null);
  };

  const features = [
    {
      icon: Trophy,
      title: "Competitive Tournaments",
      description: "Join epic tournaments with cash prizes and glory for the winners"
    },
    {
      icon: Users,
      title: "Team Management",
      description: "Create and manage your esports team with integrated roster tools"
    },
    {
      icon: Zap,
      title: "Z-Credits Wallet",
      description: "Seamless payment system for entries, prizes, and marketplace purchases"
    },
    {
      icon: Target,
      title: "Live Results",
      description: "Real-time tournament results and match highlights"
    }
  ];

  const stats = [
    { value: "10K+", label: "Active Players" },
    { value: "500+", label: "Tournaments Hosted" },
    { value: "$2M+", label: "Prizes Awarded" },
    { value: "50+", label: "Games Supported" }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-accent opacity-10" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(194,30,255,0.1)_0%,transparent_70%)]" />
        
        <div className="container relative z-10 mx-auto text-center max-w-4xl">
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 bg-gradient-accent rounded-2xl flex items-center justify-center">
              <Trophy className="w-10 h-10 text-white" />
            </div>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="bg-gradient-accent bg-clip-text text-transparent">
              InvaderZ Esports
            </span>
            <br />
            <span className="text-text-primary">Arena</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-text-secondary mb-8 max-w-2xl mx-auto">
            The ultimate esports platform where legends are born. Compete, win, and claim your place among the elite.
          </p>
          
          {!user ? (
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button className="bg-gradient-accent hover:shadow-[var(--shadow-glow)]" size="lg" asChild>
                <Link to="/auth">
                  <Gamepad2 className="mr-2 h-5 w-5" />
                  Start Your Journey
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/tournaments">
                  <Trophy className="mr-2 h-5 w-5" />
                  View Tournaments
                </Link>
              </Button>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-xl text-text-secondary mb-4">
                Welcome back to InvaderZ Esports Arena
              </p>
              <Button variant="outline" size="lg" asChild>
                <Link to="/tournaments">
                  <Trophy className="mr-2 h-5 w-5" />
                  View Tournaments
                </Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 bg-secondary/30">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
                  {stat.value}
                </div>
                <div className="text-text-secondary">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-text-primary mb-4">
              Why Choose 
              <span className="bg-gradient-accent bg-clip-text text-transparent ml-3">
                InvaderZ Esports Arena?
              </span>
            </h2>
            <p className="text-xl text-text-secondary max-w-2xl mx-auto">
              Experience the next generation of competitive gaming with our cutting-edge platform
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="esports-card group">
                  <CardHeader>
                    <div className="w-12 h-12 bg-gradient-accent rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-xl text-text-primary">
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-text-secondary">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-accent opacity-5" />
        <div className="container mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold text-text-primary mb-6">
            Ready to Dominate?
          </h2>
          <p className="text-xl text-text-secondary mb-8 max-w-2xl mx-auto">
            Join thousands of competitive gamers and start your journey to esports glory today.
          </p>
          {!user ? (
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button className="bg-gradient-accent hover:shadow-[var(--shadow-glow)]" size="lg" asChild>
                <Link to="/auth">
                  <Star className="mr-2 h-5 w-5" />
                  Get Started Free
                </Link>
              </Button>
              <Button variant="ghost" size="lg" asChild>
                <Link to="/tournaments">
                  Learn More
                </Link>
              </Button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button variant="outline" size="lg" asChild>
                <Link to="/tournaments">
                  <Trophy className="mr-2 h-5 w-5" />
                  View Tournaments
                </Link>
              </Button>
              <Button variant="ghost" size="lg" asChild>
                <Link to="/profile">
                  My Profile
                </Link>
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}