import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, UserSearch, DollarSign, AlertTriangle, CheckCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AdminGuard } from "@/components/AdminGuard";
import { formatZcreds, formatZcredDisplay } from "@/utils/formatZcreds";
import { getLatestConversionRate, convertZcToPkr } from "@/utils/conversionRate";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface UserProfile {
  id: string;
  username: string;
  display_name: string;
  email?: string;
}

interface WalletData {
  balance: number;
}

export default function AdminManualAdjustment() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [conversionRate, setConversionRate] = useState<number>(90);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [adjustmentData, setAdjustmentData] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    amount: '',
    reason: '',
    reference: '',
    preventNegative: true
  });

  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadConversionRate();
  }, []);

  const loadConversionRate = async () => {
    const rate = await getLatestConversionRate();
    setConversionRate(rate);
  };

  const searchUsers = async () => {
    if (!searchTerm.trim()) {
      toast({
        title: "Error",
        description: "Please enter an email or user ID to search",
        variant: "destructive"
      });
      return;
    }

    setSearching(true);
    try {
      // First try to search by profile username or display name
      const { data: profileSearchData, error: profileSearchError } = await supabase
        .from('profiles')
        .select('*')
        .or(`username.ilike.%${searchTerm}%,display_name.ilike.%${searchTerm}%`)
        .limit(5);

      let userId: string | null = null;
      let userEmail: string | undefined = undefined;

      if (profileSearchData && profileSearchData.length > 0) {
        userId = profileSearchData[0].id;
      }

      // If not found by profile, try as direct UUID
      if (!userId && searchTerm.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        userId = searchTerm;
      }

      if (!userId) {
        toast({
          title: "User not found",
          description: "No user found with that email or ID",
          variant: "destructive"
        });
        return;
      }

      // Get profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        toast({
          title: "Error",
          description: "Could not load user profile",
          variant: "destructive"
        });
        return;
      }

      // Get wallet balance
      const { data: walletData, error: walletError } = await supabase
        .from('zcred_wallets')
        .select('balance')
        .eq('user_id', userId)
        .single();

      const userProfile: UserProfile = {
        id: userId,
        username: profileData.username || 'Unknown',
        display_name: profileData.display_name || 'Unknown',
        email: userEmail
      };

      setSelectedUser(userProfile);
      setWalletBalance(walletData?.balance || 0);
      
      toast({
        title: "User found",
        description: `Loaded profile for ${userProfile.display_name || userProfile.username}`
      });

    } catch (error: any) {
      console.error('Error searching users:', error);
      toast({
        title: "Error",
        description: "Failed to search for users",
        variant: "destructive"
      });
    } finally {
      setSearching(false);
    }
  };

  const calculatePreview = () => {
    if (!formData.amount || !selectedUser) return null;
    
    const delta = parseFloat(formData.amount);
    const newBalance = walletBalance + delta;
    
    return {
      currentBalance: walletBalance,
      delta,
      newBalance,
      pkrEquivalent: convertZcToPkr(Math.abs(delta), conversionRate),
      newPkrEquivalent: convertZcToPkr(newBalance, conversionRate)
    };
  };

  const handlePreviewAdjustment = () => {
    if (!selectedUser) {
      toast({
        title: "Error",
        description: "Please select a user first",
        variant: "destructive"
      });
      return;
    }

    if (!formData.amount || !formData.reason.trim()) {
      toast({
        title: "Error",
        description: "Please enter an adjustment amount and reason",
        variant: "destructive"
      });
      return;
    }

    const delta = parseFloat(formData.amount);
    if (isNaN(delta) || delta === 0) {
      toast({
        title: "Error",
        description: "Please enter a valid non-zero amount",
        variant: "destructive"
      });
      return;
    }

    const preview = calculatePreview();
    if (!preview) return;

    if (formData.preventNegative && preview.newBalance < 0) {
      toast({
        title: "Error",
        description: `This adjustment would result in a negative balance (${formatZcreds(preview.newBalance)} ZC)`,
        variant: "destructive"
      });
      return;
    }

    setAdjustmentData(preview);
    setShowConfirmDialog(true);
  };

  const executeAdjustment = async () => {
    if (!selectedUser || !adjustmentData) return;

    setSubmitting(true);
    try {
      const { data, error } = await supabase.rpc('manual_zcred_adjustment', {
        p_user_id: selectedUser.id,
        p_delta_zc: adjustmentData.delta,
        p_reason: formData.reason,
        p_reference: formData.reference || null,
        p_allow_negative: !formData.preventNegative
      });

      if (error) throw error;

      toast({
        title: "Adjustment completed",
        description: `Successfully ${adjustmentData.delta > 0 ? 'added' : 'deducted'} ${formatZcreds(Math.abs(adjustmentData.delta))} ZC`,
      });

      // Update local balance
      setWalletBalance(adjustmentData.newBalance);
      
      // Reset form
      setFormData({
        amount: '',
        reason: '',
        reference: '',
        preventNegative: true
      });
      setShowConfirmDialog(false);
      setAdjustmentData(null);

    } catch (error: any) {
      console.error('Error executing adjustment:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to execute adjustment",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const preview = calculatePreview();

  return (
    <AdminGuard>
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="mb-6">
          <Button variant="ghost" asChild className="mb-4">
            <Link to="/admin">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Admin Dashboard
            </Link>
          </Button>
          
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            Manual Z-Credit Adjustment
          </h1>
          <p className="text-text-secondary">
            Add or subtract Z-Credits from any user account (Admin only)
          </p>
        </div>

        <div className="space-y-6">
          {/* Current Exchange Rate */}
          <Card className="esports-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-secondary">Current Exchange Rate</p>
                  <p className="text-2xl font-bold text-primary">1 ZC = {conversionRate} PKR</p>
                </div>
                <DollarSign className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          {/* User Search */}
          <Card className="esports-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserSearch className="w-5 h-5" />
                Search User
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Input
                  placeholder="Enter user email or UUID"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                  onKeyDown={(e) => e.key === 'Enter' && searchUsers()}
                />
                <Button onClick={searchUsers} disabled={searching}>
                  {searching ? "Searching..." : "Search"}
                </Button>
              </div>

              {selectedUser && (
                <div className="bg-secondary/50 rounded-xl p-4">
                  <h3 className="font-semibold mb-2">Selected User</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <div><span className="font-medium">Name:</span> {selectedUser.display_name}</div>
                    <div><span className="font-medium">Username:</span> {selectedUser.username}</div>
                    <div><span className="font-medium">Email:</span> {selectedUser.email || 'N/A'}</div>
                    <div><span className="font-medium">User ID:</span> {selectedUser.id}</div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-border">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Current Balance:</span>
                      <div className="text-right">
                        <div className="text-lg font-bold text-primary">
                          {formatZcredDisplay(walletBalance)}
                        </div>
                        <div className="text-sm text-text-secondary">
                          ≈ PKR {convertZcToPkr(walletBalance, conversionRate).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Adjustment Form */}
          {selectedUser && (
            <Card className="esports-card">
              <CardHeader>
                <CardTitle>Adjustment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="amount">
                    Adjustment Amount (Z-Credits) <span className="text-danger">*</span>
                  </Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="Enter positive number to add, negative to subtract"
                    className="rounded-2xl"
                  />
                  <p className="text-xs text-text-muted">
                    Use positive numbers to add Z-Credits, negative numbers to subtract
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason">
                    Reason <span className="text-danger">*</span>
                  </Label>
                  <Textarea
                    id="reason"
                    value={formData.reason}
                    onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                    placeholder="Explain why this adjustment is being made"
                    className="rounded-2xl min-h-[100px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reference">Reference (Optional)</Label>
                  <Input
                    id="reference"
                    value={formData.reference}
                    onChange={(e) => setFormData(prev => ({ ...prev, reference: e.target.value }))}
                    placeholder="Ticket ID, order reference, etc."
                    className="rounded-2xl"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="preventNegative"
                    checked={formData.preventNegative}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, preventNegative: checked as boolean }))
                    }
                  />
                  <Label htmlFor="preventNegative" className="text-sm">
                    Prevent negative balance (recommended)
                  </Label>
                </div>

                {/* Preview */}
                {preview && (
                  <div className="bg-secondary/50 rounded-xl p-4">
                    <h3 className="font-semibold mb-3">Adjustment Preview</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Current Balance:</span>
                        <span className="font-mono">{formatZcreds(preview.currentBalance)} ZC</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Adjustment:</span>
                        <span className={`font-mono ${preview.delta > 0 ? 'text-success' : 'text-danger'}`}>
                          {preview.delta > 0 ? '+' : ''}{formatZcreds(preview.delta)} ZC
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Amount in PKR:</span>
                        <span className="font-mono">≈ PKR {preview.pkrEquivalent.toFixed(2)}</span>
                      </div>
                      <hr className="border-border" />
                      <div className="flex justify-between font-semibold">
                        <span>New Balance:</span>
                        <span className={`font-mono ${preview.newBalance < 0 ? 'text-danger' : 'text-text-primary'}`}>
                          {formatZcreds(preview.newBalance)} ZC
                        </span>
                      </div>
                      <div className="flex justify-between text-text-secondary">
                        <span>New Balance (PKR):</span>
                        <span className="font-mono">≈ PKR {preview.newPkrEquivalent.toFixed(2)}</span>
                      </div>
                    </div>

                    {preview.newBalance < 0 && (
                      <div className="mt-3 p-3 bg-danger/10 border border-danger/20 rounded-lg">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-danger mt-0.5" />
                          <div className="text-sm text-danger">
                            <p className="font-semibold">Warning: Negative Balance</p>
                            <p>This adjustment will result in a negative balance.</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <Button 
                  onClick={handlePreviewAdjustment}
                  disabled={!formData.amount || !formData.reason.trim()}
                  className="w-full"
                >
                  Preview & Confirm Adjustment
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Confirmation Dialog */}
        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-primary" />
                Confirm Manual Adjustment
              </DialogTitle>
              <DialogDescription>
                Please review the adjustment details before confirming.
              </DialogDescription>
            </DialogHeader>

            {adjustmentData && selectedUser && (
              <div className="space-y-4">
                <div className="bg-secondary/50 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">User: {selectedUser.display_name}</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Current Balance:</span>
                      <span>{formatZcreds(adjustmentData.currentBalance)} ZC</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Adjustment:</span>
                      <span className={adjustmentData.delta > 0 ? 'text-success' : 'text-danger'}>
                        {adjustmentData.delta > 0 ? '+' : ''}{formatZcreds(adjustmentData.delta)} ZC
                      </span>
                    </div>
                    <div className="flex justify-between font-semibold border-t border-border pt-1">
                      <span>New Balance:</span>
                      <span>{formatZcreds(adjustmentData.newBalance)} ZC</span>
                    </div>
                  </div>
                </div>

                <div className="text-sm text-text-secondary">
                  <p><strong>Reason:</strong> {formData.reason}</p>
                  {formData.reference && <p><strong>Reference:</strong> {formData.reference}</p>}
                </div>

                {adjustmentData.newBalance < 0 && !formData.preventNegative && (
                  <div className="bg-danger/10 border border-danger/20 rounded-lg p-3">
                    <p className="text-sm text-danger font-semibold">
                      This will create a negative balance. Type "ADJUST" below to confirm:
                    </p>
                    <Input 
                      placeholder="Type ADJUST to confirm"
                      className="mt-2"
                      onChange={(e) => {
                        // You could add confirmation logic here
                      }}
                    />
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
                Cancel
              </Button>
              <Button onClick={executeAdjustment} disabled={submitting}>
                {submitting ? "Processing..." : "Confirm Adjustment"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminGuard>
  );
}