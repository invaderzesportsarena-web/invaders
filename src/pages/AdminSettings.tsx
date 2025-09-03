import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Settings } from "lucide-react";
import { Link } from "react-router-dom";

export default function AdminSettings() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link to="/admin">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>
        
        <h1 className="text-3xl font-bold text-text-primary mb-2">
          System Settings
        </h1>
        <p className="text-text-secondary">
          Configure platform settings and preferences
        </p>
      </div>

      <Card className="esports-card">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center">
              <Settings className="w-5 h-5 text-text-secondary" />
            </div>
            <CardTitle className="text-text-primary">Platform Configuration</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="py-12 text-center">
          <p className="text-text-secondary text-lg mb-4">
            Coming soon — wired to Supabase policies
          </p>
          <p className="text-text-muted text-sm">
            This section will allow you to configure platform settings, user roles, and system preferences.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}