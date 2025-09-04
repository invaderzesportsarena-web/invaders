import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User as UserType } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User, Upload } from "lucide-react";

interface PersonalInfoSectionProps {
  user: UserType;
  profile: any;
  onUpdate: () => void;
}

export function PersonalInfoSection({ user, profile, onUpdate }: PersonalInfoSectionProps) {
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    display_name: profile?.display_name || "",
    phone: profile?.phone || "",
    whatsapp_number: profile?.whatsapp_number || "",
    avatar_url: profile?.avatar_url || ""
  });
  const { toast } = useToast();

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('covers')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('covers')
        .getPublicUrl(fileName);

      setFormData(prev => ({ ...prev, avatar_url: publicUrl }));
      toast({ title: "Avatar uploaded successfully!" });
    } catch (error: any) {
      toast({ 
        title: "Upload failed", 
        description: error.message,
        variant: "destructive"
      });
    }
    setUploading(false);
  };

  const handleSave = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update(formData)
        .eq('id', user.id);

      if (error) throw error;

      toast({ title: "Personal info updated successfully!" });
      onUpdate();
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
          Personal Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Avatar Upload */}
        <div className="flex items-center gap-4">
          <Avatar className="w-20 h-20">
            <AvatarImage src={formData.avatar_url} alt={formData.display_name} />
            <AvatarFallback className="bg-primary/10 text-primary text-xl">
              {formData.display_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <Label htmlFor="avatar-upload" className="cursor-pointer">
              <Button variant="outline" disabled={uploading} asChild className="border-stroke hover:bg-bg-700">
                <span>
                  <Upload className="w-4 h-4 mr-2" />
                  {uploading ? "Uploading..." : "Change Avatar"}
                </span>
              </Button>
            </Label>
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
            <p className="text-sm text-text-muted mt-1">JPG, PNG up to 5MB</p>
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="display_name" className="text-text-secondary">Display Name</Label>
            <Input
              id="display_name"
              value={formData.display_name}
              onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
              placeholder="Enter your display name"
              className="bg-bg-700 border-stroke text-text-primary mt-1"
            />
          </div>

          <div>
            <Label htmlFor="phone" className="text-text-secondary">Phone Number</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="Enter your phone number"
              className="bg-bg-700 border-stroke text-text-primary mt-1"
            />
          </div>

          <div>
            <Label htmlFor="whatsapp_number" className="text-text-secondary">WhatsApp Number</Label>
            <Input
              id="whatsapp_number"
              value={formData.whatsapp_number}
              onChange={(e) => setFormData(prev => ({ ...prev, whatsapp_number: e.target.value }))}
              placeholder="Enter your WhatsApp number"
              className="bg-bg-700 border-stroke text-text-primary mt-1"
            />
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </CardContent>
    </Card>
  );
}