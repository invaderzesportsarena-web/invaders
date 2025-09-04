import { User as UserType } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, IdCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AccountInfoSectionProps {
  user: UserType;
}

export function AccountInfoSection({ user }: AccountInfoSectionProps) {
  const { toast } = useToast();

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: `${label} copied!` });
    } catch (error) {
      toast({ 
        title: "Copy failed", 
        description: "Could not copy to clipboard",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="bg-[#0F1621] border-[#233246] rounded-2xl shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-text-primary">
          <IdCard className="w-5 h-5" />
          Account Info
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-text-secondary">User ID</Label>
          <div className="flex items-center gap-2 mt-1">
            <Input
              value={user.id}
              readOnly
              className="bg-bg-700 border-stroke text-text-muted font-mono text-sm"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(user.id, "User ID")}
              className="shrink-0 border-stroke hover:bg-bg-700"
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div>
          <Label className="text-text-secondary">Email</Label>
          <Input
            value={user.email || ""}
            readOnly
            className="bg-bg-700 border-stroke text-text-muted mt-1"
          />
        </div>
      </CardContent>
    </Card>
  );
}