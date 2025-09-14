import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User as UserType } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, User, CheckCircle } from "lucide-react";

interface UsernameSectionProps {
  user: UserType;
  profile: any;
  onUpdate: () => void;
}

export function UsernameSection({ user, profile, onUpdate }: UsernameSectionProps) {
  const [username, setUsername] = useState(profile?.username || "");
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [isValid, setIsValid] = useState(false);
  const [hasChanged, setHasChanged] = useState(false);
  const { toast } = useToast();

  const usernameRegex = /^[A-Za-z0-9_]{3,20}$/;

  useEffect(() => {
    const checkUsername = async () => {
      if (!username || username === profile?.username) {
        setError("");
        setIsValid(false);
        setHasChanged(false);
        return;
      }

      setHasChanged(true);

      if (!usernameRegex.test(username)) {
        setError("Username must be 3-20 characters: letters, numbers, underscore only");
        setIsValid(false);
        return;
      }

      setChecking(true);
      setError("");

      try {
        const { data, error: dbError } = await supabase
          .from('profiles')
          .select('id')
          .ilike('username', username)
          .neq('id', user.id);

        if (dbError) throw dbError;

        if (data && data.length > 0) {
          setError("Username already taken");
          setIsValid(false);
        } else {
          setIsValid(true);
        }
      } catch (error: any) {
        setError("Failed to check username availability");
        setIsValid(false);
      }

      setChecking(false);
    };

    const timeoutId = setTimeout(checkUsername, 500);
    return () => clearTimeout(timeoutId);
  }, [username, user.id, profile?.username]);

  const handleSave = async () => {
    if (!isValid || !hasChanged) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ username })
        .eq('id', user.id);

      if (error) throw error;

      toast({ title: "Username updated successfully!" });
      onUpdate();
      setHasChanged(false);
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive"
      });
    }
    setSaving(false);
  };

  return (
    <Card className="bg-[#0F1621] border-[#233246] rounded-2xl shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-text-primary">
          <User className="w-5 h-5" />
          Username
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="username" className="text-text-secondary">Username</Label>
          <div className="flex items-center gap-2 mt-1">
            <div className="relative flex-1">
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="bg-background border-border text-foreground pr-8"
              />
              {checking && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                </div>
              )}
              {!checking && hasChanged && isValid && (
                <CheckCircle className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-success" />
              )}
              {!checking && error && (
                <AlertCircle className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-danger" />
              )}
            </div>
            <Button
              onClick={handleSave}
              disabled={!isValid || !hasChanged || checking || saving}
              size="sm"
              className="shrink-0"
            >
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
          {error && (
            <p className="text-sm text-danger mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {error}
            </p>
          )}
          <p className="text-sm text-text-muted mt-1">
            Only letters, numbers, underscore. 3–20 chars
          </p>
        </div>
      </CardContent>
    </Card>
  );
}