import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Minus, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function WalletWithdraw() {
  const [user, setUser] = useState<any>(null);
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    amount_zcreds: '',
    recipient_name: '',
    recipient_bank: '',
    recipient_account_no: '',
    iban_optional: '',
    notes: ''
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      navigate('/auth');
      return;
    }
    setUser(session.user);
    await fetchBalance(session.user.id);
    setLoading(false);
  };

  const fetchBalance = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('zcred_balances')
        .select('balance')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setBalance(data?.balance || 0);
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    // Validate required fields
    if (!formData.amount_zcreds || !formData.recipient_name || !formData.recipient_bank || !formData.recipient_account_no) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const withdrawAmount = parseInt(formData.amount_zcreds);
    
    // Check if user has sufficient balance
    if (withdrawAmount > balance) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough Z-Credits for this withdrawal",
        variant: "destructive"
      });
      return;
    }

    // Minimum withdrawal check
    if (withdrawAmount < 100) {
      toast({
        title: "Minimum Withdrawal",
        description: "Minimum withdrawal amount is 100 Z-Credits",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('zcred_withdrawal_forms')
        .insert({
          user_id: user.id,
          amount_zcreds: withdrawAmount,
          recipient_name: formData.recipient_name,
          recipient_bank: formData.recipient_bank,
          recipient_account_no: formData.recipient_account_no,
          iban_optional: formData.iban_optional,
          notes: formData.notes
        });

      if (error) throw error;

      toast({
        title: "Withdrawal request submitted!",
        description: "Your withdrawal request has been submitted for review. Processing typically takes 24-48 hours.",
      });

      navigate('/wallet');
    } catch (error: any) {
      console.error('Error submitting withdrawal:', error);
      toast({
        title: "Submission failed",
        description: error.message || "Failed to submit withdrawal request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-card rounded w-1/3"></div>
          <div className="h-64 bg-card rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/wallet')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Wallet
        </Button>
        
        <h1 className="text-3xl font-bold text-text-primary mb-2">
          Withdraw Z-Credits
        </h1>
        <p className="text-text-secondary">
          Convert your Z-Credits back to cash
        </p>
      </div>

      <div className="space-y-6">
        {/* Balance Info */}
        <Card className="esports-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary">Available Balance</p>
                <p className="text-2xl font-bold text-primary">{balance.toLocaleString()} ZC</p>
              </div>
              <div className="text-right">
                <p className="text-text-secondary text-sm">Exchange Rate</p>
                <p className="text-text-primary font-semibold">1 ZC = 1 PKR</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Withdrawal Form */}
        <Card className="esports-card">
          <CardHeader>
            <CardTitle className="text-text-primary flex items-center gap-2">
              <Minus className="w-5 h-5" />
              Withdrawal Request
            </CardTitle>
            <CardDescription className="text-text-secondary">
              Enter your bank account details for the withdrawal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="amount_zcreds" className="text-text-primary">
                  Withdrawal Amount (Z-Credits) <span className="text-danger">*</span>
                </Label>
                <Input
                  id="amount_zcreds"
                  type="number"
                  min="100"
                  max={balance}
                  value={formData.amount_zcreds}
                  onChange={(e) => handleInputChange('amount_zcreds', e.target.value)}
                  placeholder="Enter amount to withdraw"
                  className="rounded-2xl"
                  required
                />
                <p className="text-xs text-text-muted">
                  Minimum: 100 ZC • Maximum: {balance.toLocaleString()} ZC
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="recipient_name" className="text-text-primary">
                  Account Holder Name <span className="text-danger">*</span>
                </Label>
                <Input
                  id="recipient_name"
                  value={formData.recipient_name}
                  onChange={(e) => handleInputChange('recipient_name', e.target.value)}
                  placeholder="Full name as per bank account"
                  className="rounded-2xl"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="recipient_bank" className="text-text-primary">
                  Bank Name <span className="text-danger">*</span>
                </Label>
                <Input
                  id="recipient_bank"
                  value={formData.recipient_bank}
                  onChange={(e) => handleInputChange('recipient_bank', e.target.value)}
                  placeholder="e.g., HBL, UBL, MCB"
                  className="rounded-2xl"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="recipient_account_no" className="text-text-primary">
                  Account Number <span className="text-danger">*</span>
                </Label>
                <Input
                  id="recipient_account_no"
                  value={formData.recipient_account_no}
                  onChange={(e) => handleInputChange('recipient_account_no', e.target.value)}
                  placeholder="Bank account number"
                  className="rounded-2xl"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="iban_optional" className="text-text-primary">
                  IBAN (Optional)
                </Label>
                <Input
                  id="iban_optional"
                  value={formData.iban_optional}
                  onChange={(e) => handleInputChange('iban_optional', e.target.value)}
                  placeholder="PK36SCBL0000001123456702"
                  className="rounded-2xl"
                />
                <p className="text-xs text-text-muted">
                  IBAN helps ensure faster processing
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" className="text-text-primary">
                  Additional Notes
                </Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Any special instructions"
                  className="rounded-2xl min-h-[100px]"
                />
              </div>

              <div className="bg-warning/10 border border-warning/20 rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-warning mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-text-primary mb-2">Important Notice</h3>
                    <ul className="text-sm text-text-secondary space-y-1">
                      <li>• Withdrawal requests are processed within 24-48 hours</li>
                      <li>• Ensure all bank details are correct and match your ID</li>
                      <li>• Processing may take longer during weekends/holidays</li>
                      <li>• Minimum withdrawal amount is 100 Z-Credits</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/wallet')}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="esports"
                  disabled={submitting || balance < 100}
                  className="flex-1"
                >
                  {submitting ? "Submitting..." : "Submit Withdrawal Request"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}