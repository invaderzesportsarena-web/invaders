import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Trophy, Users, Zap, Target, Star, Gamepad2, Shield, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";

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
      description: "Join tournaments across multiple games with structured prize pools and professional organization"
    },
    {
      icon: Users,
      title: "Team Management",
      description: "Create and manage your esports team with integrated roster tools and player profiles"
    },
    {
      icon: Zap,
      title: "Z-Creds Wallet",
      description: "Seamless digital currency system for tournament entries, prizes, and marketplace purchases"
    },
    {
      icon: Target,
      title: "Live Results",
      description: "Real-time tournament results, match highlights, and comprehensive result galleries"
    }
  ];

  return (
    <div className="min-h-screen">
      <Header />
      
      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-accent opacity-5" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(166,76,244,0.1)_0%,transparent_70%)]" />
        
        <div className="container relative z-10 mx-auto text-center max-w-5xl">
          <div className="flex justify-center mb-12">
            <img 
              src="/lovable-uploads/2650bb7d-0862-44dc-9f88-90a0444a40fe.png" 
              alt="InvaderZ Esports Arena" 
              className="h-32 md:h-48"
            />
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-heading font-black mb-6 leading-tight">
            <span className="bg-gradient-accent bg-clip-text text-transparent">
              Compete. Win. Dominate
            </span>
            <br />
            <span className="text-text-primary">the Arena.</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-text-secondary mb-12 max-w-3xl mx-auto font-medium">
            The ultimate esports platform where legends are born. Join tournaments, build your team, and claim your place among the elite competitors.
          </p>
          
          {!user ? (
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Button className="bg-gradient-accent hover:shadow-[var(--shadow-glow)] text-lg px-8 py-4 h-auto font-bold" size="lg" asChild>
                <Link to="/auth">
                  <Gamepad2 className="mr-3 h-6 w-6" />
                  Join Now
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8 py-4 h-auto font-bold border-2" asChild>
                <Link to="/tournaments">
                  <Trophy className="mr-3 h-6 w-6" />
                  View Tournaments
                </Link>
              </Button>
            </div>
          ) : (
            <div className="text-center">
              <h2 className="text-2xl text-text-primary mb-6 font-bold">
                Welcome back, Champion!
              </h2>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button className="bg-gradient-accent hover:shadow-[var(--shadow-glow)] text-lg px-8 py-4 h-auto font-bold" size="lg" asChild>
                  <Link to="/tournaments">
                    <Trophy className="mr-3 h-6 w-6" />
                    Join Tournament
                  </Link>
                </Button>
                <Button variant="outline" size="lg" className="text-lg px-8 py-4 h-auto font-bold border-2" asChild>
                  <Link to="/wallet">
                    <Zap className="mr-3 h-6 w-6" />
                    My Wallet
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-secondary/20">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-heading font-bold text-text-primary mb-6">
              Why Choose 
              <span className="bg-gradient-accent bg-clip-text text-transparent ml-3">
                InvaderZ?
              </span>
            </h2>
            <p className="text-xl text-text-secondary max-w-3xl mx-auto">
              Experience professional esports competition with our comprehensive platform designed for serious gamers
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="esports-card group border-2 border-border/50 hover:border-primary/50">
                  <CardHeader className="pb-4">
                    <div className="w-16 h-16 bg-gradient-accent rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle className="text-2xl text-text-primary font-bold">
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-text-secondary text-lg leading-relaxed">
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
        <div className="container mx-auto text-center relative z-10 max-w-4xl">
          <h2 className="text-4xl md:text-5xl font-heading font-bold text-text-primary mb-6">
            Ready to Dominate?
          </h2>
          <p className="text-xl text-text-secondary mb-12 max-w-3xl mx-auto">
            Join the elite community of competitive gamers and start your journey to esports glory today.
          </p>
          {!user ? (
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Button className="bg-gradient-accent hover:shadow-[var(--shadow-glow)] text-lg px-8 py-4 h-auto font-bold" size="lg" asChild>
                <Link to="/auth">
                  <Star className="mr-3 h-6 w-6" />
                  Get Started Free
                </Link>
              </Button>
              <Button variant="ghost" size="lg" className="text-lg px-8 py-4 h-auto font-bold" asChild>
                <Link to="/tournaments">
                  Learn More
                </Link>
              </Button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Button className="bg-gradient-accent hover:shadow-[var(--shadow-glow)] text-lg px-8 py-4 h-auto font-bold" size="lg" asChild>
                <Link to="/tournaments">
                  <Trophy className="mr-3 h-6 w-6" />
                  Browse Tournaments
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8 py-4 h-auto font-bold border-2" asChild>
                <Link to="/profile">
                  <Shield className="mr-3 h-6 w-6" />
                  My Profile
                </Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-secondary/30 border-t border-border">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="flex justify-center mb-8">
            <img 
              src="/lovable-uploads/61757783-88f2-438c-9551-0e80c1f19425.png" 
              alt="InvaderZ Emblem" 
              className="h-12 opacity-60"
            />
          </div>
          <p className="text-text-muted mb-6">
            © 2024 InvaderZ Esports Arena. All rights reserved.
          </p>
          <div className="flex justify-center space-x-6">
            <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center opacity-50">
              <span className="text-xs">FB</span>
            </div>
            <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center opacity-50">
              <span className="text-xs">TW</span>
            </div>
            <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center opacity-50">
              <span className="text-xs">IG</span>
            </div>
            <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center opacity-50">
              <span className="text-xs">YT</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}