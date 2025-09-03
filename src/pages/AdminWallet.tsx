import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Wallet } from "lucide-react";
import { Link } from "react-router-dom";

export default function AdminWallet() {
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
          Wallet Operations
        </h1>
        <p className="text-text-secondary">
          Handle Z-Credits deposits, withdrawals, and transaction management
        </p>
      </div>

      <Card className="esports-card">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-success/10 rounded-xl flex items-center justify-center">
              <Wallet className="w-5 h-5 text-success" />
            </div>
            <CardTitle className="text-text-primary">Wallet Management</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="py-12 text-center">
          <p className="text-text-secondary text-lg mb-4">
            Coming soon — wired to Supabase policies
          </p>
          <p className="text-text-muted text-sm">
            This section will allow you to approve deposits, process withdrawals, and manage Z-Credits transactions.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}