import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const AdminPasswordReset = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const resetPassword = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-reset-password', {
        body: {
          user_id: '6b35f98c-9d63-4201-8050-bb3ae39e56e7',
          new_password: 'InzAna@esp'
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Password has been changed successfully",
      });

      console.log('Password reset result:', data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reset password",
        variant: "destructive",
      });
      console.error('Password reset error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Admin Password Reset Utility</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Click the button below to reset the password for admin@invaderz.com to "InzAna@esp"
          </p>
          <Button 
            onClick={resetPassword} 
            disabled={loading}
            className="w-full"
          >
            {loading ? "Resetting Password..." : "Reset Password Now"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPasswordReset;
