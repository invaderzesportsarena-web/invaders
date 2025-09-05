import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Wallet, Check, X, Eye, User, Settings, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AdminGuard } from "@/components/AdminGuard";
import { formatZcreds, formatZcredDisplay } from "@/utils/formatZcreds";
import { getLatestConversionRate, convertZcToPkr, convertPkrToZc } from "@/utils/conversionRate";
import { SUPABASE_CONFIG, VALIDATION } from "@/config/supabase";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface DepositRequest {
  id: string;
  user_id: string;
  amount_money: number;
  currency: string;
  sender_bank: string;
  sender_account_no: string;
  bank_sender_name: string;
  transfer_timestamp: string;
  screenshot_url?: string;
  status: string;
  created_at: string;
  notes?: string;
  approved_credits?: number;
  rejection_reason?: string;
  profiles?: {
    display_name: string;
    username: string;
  };
}

interface WithdrawalRequest {
  id: string;
  user_id: string;
  amount_zcreds: number;
  recipient_name: string;
  recipient_bank: string;
  recipient_account_no: string;
  iban_optional?: string;
  status: string;
  created_at: string;
  notes?: string;
  approved_credits?: number;
  rejection_reason?: string;
  profiles?: {
    display_name: string;
    username: string;
  };
}

export default function AdminWalletRequests() {
  const [deposits, setDeposits] = useState<DepositRequest[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [pendingDeposits, setPendingDeposits] = useState<DepositRequest[]>([]);
  const [approvedDeposits, setApprovedDeposits] = useState<DepositRequest[]>([]);
  const [rejectedDeposits, setRejectedDeposits] = useState<DepositRequest[]>([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [approvedWithdrawals, setApprovedWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [rejectedWithdrawals, setRejectedWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [conversionRate, setConversionRate] = useState<number>(90);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [actionForm, setActionForm] = useState({
    credits: '',
    reason: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
    loadConversionRate();
  }, []);

  const loadConversionRate = async () => {
    const rate = await getLatestConversionRate();
    setConversionRate(rate);
  };

  const fetchData = async () => {
    try {
      // Fetch all deposits by status
      const { data: allDepositsData, error: depositsError } = await supabase
        .from(SUPABASE_CONFIG.tables.ZCRED_DEPOSIT_FORMS)
        .select(`
          *,
          profiles!inner (display_name, username)
        `)
        .order(SUPABASE_CONFIG.columns.zcred_deposit_forms.CREATED_AT, { ascending: false });

      if (depositsError) throw depositsError;

      // Fetch all withdrawals by status
      const { data: allWithdrawalsData, error: withdrawalsError } = await supabase
        .from(SUPABASE_CONFIG.tables.ZCRED_WITHDRAWAL_FORMS)
        .select(`
          *,
          profiles!inner (display_name, username)
        `)
        .order(SUPABASE_CONFIG.columns.zcred_withdrawal_forms.CREATED_AT, { ascending: false });

      if (withdrawalsError) throw withdrawalsError;

      // Separate by status
      const allDeposits = allDepositsData || [];
      const allWithdrawals = allWithdrawalsData || [];

      setPendingDeposits(allDeposits.filter(d => d.status === 'submitted'));
      setApprovedDeposits(allDeposits.filter(d => d.status === 'verified'));
      setRejectedDeposits(allDeposits.filter(d => d.status === 'rejected'));

      setPendingWithdrawals(allWithdrawals.filter(w => w.status === 'submitted'));
      setApprovedWithdrawals(allWithdrawals.filter(w => w.status === 'paid'));
      setRejectedWithdrawals(allWithdrawals.filter(w => w.status === 'rejected'));

      // Keep the old arrays for backward compatibility
      setDeposits(allDeposits.filter(d => d.status === 'submitted'));
      setWithdrawals(allWithdrawals.filter(w => w.status === 'submitted'));
    } catch (error: any) {
      console.error('Error fetching wallet requests:', error);
      toast({
        title: "Error",
        description: "Failed to load wallet requests",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDepositApprove = async (depositId: string, userId: string) => {
    if (!actionForm.credits || !VALIDATION.ZCRED_REGEX.test(actionForm.credits)) {
      toast({
        title: "Error",
        description: "Please enter a valid Z-Credits amount (up to 2 decimal places)",
        variant: "destructive"
      });
      return;
    }

    try {
      const creditsAmount = parseFloat(actionForm.credits);
      
      // Insert approved transaction
      const { error: transError } = await supabase
        .from(SUPABASE_CONFIG.tables.ZCRED_TRANSACTIONS)
        .insert({
          user_id: userId,
          amount: creditsAmount,
          type: 'deposit_credit',
          status: 'approved'
        });

      if (transError) throw transError;

      // Update deposit form status
      const { error: updateError } = await supabase
        .from(SUPABASE_CONFIG.tables.ZCRED_DEPOSIT_FORMS)
        .update({ 
          status: 'verified',
          approved_credits: creditsAmount,
          reviewed_by: (await supabase.auth.getUser()).data.user?.id,
          reviewed_at: new Date().toISOString()
        })
        .eq(SUPABASE_CONFIG.columns.zcred_deposit_forms.ID, depositId);

      if (updateError) throw updateError;

      setDeposits(prev => prev.filter(d => d.id !== depositId));
      setSelectedRequest(null);
      setActionForm({ credits: '', reason: '' });
      fetchData(); // Refresh data

      toast({
        title: "Success",
        description: "Deposit approved and Z-Creds granted.",
      });
    } catch (error: any) {
      console.error('Error approving deposit:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to approve deposit",
        variant: "destructive"
      });
    }
  };

  const handleDepositReject = async (depositId: string) => {
    if (!actionForm.reason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a rejection reason",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from(SUPABASE_CONFIG.tables.ZCRED_DEPOSIT_FORMS)
        .update({ 
          status: 'rejected',
          rejection_reason: actionForm.reason,
          reviewed_by: (await supabase.auth.getUser()).data.user?.id,
          reviewed_at: new Date().toISOString()
        })
        .eq(SUPABASE_CONFIG.columns.zcred_deposit_forms.ID, depositId);

      if (error) throw error;

      setDeposits(prev => prev.filter(d => d.id !== depositId));
      setSelectedRequest(null);
      setActionForm({ credits: '', reason: '' });
      fetchData(); // Refresh data

      toast({
        title: "Success",
        description: "Request rejected.",
      });
    } catch (error: any) {
      console.error('Error rejecting deposit:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to reject deposit",
        variant: "destructive"
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <AdminGuard>
        <div className="container mx-auto py-8 px-4">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-card rounded w-1/3"></div>
            <div className="h-64 bg-card rounded"></div>
          </div>
        </div>
      </AdminGuard>
    );
  }

  return (
    <AdminGuard>
      <div className="container mx-auto py-8 px-4">
        <div className="mb-6">
          <Button variant="ghost" asChild className="mb-4">
            <Link to="/admin">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-text-primary mb-2">
                Wallet Requests
              </h1>
              <p className="text-text-secondary">
                Review and process deposit and withdrawal requests
              </p>
            </div>
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link to="/admin/manual-adjustment">
                  <Plus className="w-4 h-4 mr-2" />
                  Manual Adjustment
                </Link>
              </Button>
            </div>
          </div>
        </div>

        <Card className="esports-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-primary" />
                </div>
                <CardTitle className="text-text-primary">Wallet Requests</CardTitle>
              </div>
              <div className="text-right">
                <p className="text-sm text-text-secondary">Current Rate</p>
                <p className="text-lg font-bold text-primary">1 ZC = {conversionRate} PKR</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="deposits" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="deposits">Deposits</TabsTrigger>
                <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
              </TabsList>
              
              <TabsContent value="deposits" className="space-y-4">
                <Tabs defaultValue="pending" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="pending">Pending ({pendingDeposits.length})</TabsTrigger>
                    <TabsTrigger value="approved">Approved ({approvedDeposits.length})</TabsTrigger>
                    <TabsTrigger value="rejected">Rejected ({rejectedDeposits.length})</TabsTrigger>
                  </TabsList>

                  <TabsContent value="pending" className="space-y-4">
                    {pendingDeposits.length === 0 ? (
                      <div className="py-12 text-center">
                        <p className="text-text-secondary">No pending deposit requests</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {pendingDeposits.map((deposit) => (
                          <div key={deposit.id} className="bg-secondary/30 rounded-2xl p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-2 text-sm">
                                <div>
                                  <span className="font-medium text-text-primary">User:</span> {deposit.profiles?.display_name || deposit.profiles?.username || deposit.user_id}
                                </div>
                                <div>
                                  <span className="font-medium text-text-primary">Amount:</span> {deposit.amount_money.toFixed(2)} {deposit.currency}
                                  <div className="text-xs text-text-muted">≈ {formatZcreds(convertPkrToZc(deposit.amount_money, conversionRate))} ZC</div>
                                </div>
                                <div>
                                  <span className="font-medium text-text-primary">Bank:</span> {deposit.sender_bank}
                                </div>
                                <div>
                                  <span className="font-medium text-text-primary">Date:</span> {formatDate(deposit.created_at)}
                                </div>
                              </div>
                              
                              <div className="flex gap-2 ml-4">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button size="sm" onClick={() => setSelectedRequest(deposit)}>
                                      <Check className="w-4 h-4 mr-1" />
                                      Verify
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="sm:max-w-[425px] bg-background border-border">
                                    {/* FORCE REFRESH v2.0 - NEW MANUAL INPUT DIALOG */}
                                    <DialogHeader className="text-center">
                                      <DialogTitle className="text-xl font-bold text-text-primary">Verify Deposit</DialogTitle>
                                      <DialogDescription className="text-lg font-semibold text-text-primary mt-2">
                                        HOW MANY Z CRED U WANT TO DEPOSIT
                                      </DialogDescription>
                                    </DialogHeader>
                                    
                                    <div className="space-y-6 py-6">
                                      <div className="space-y-2">
                                        <Label className="text-sm font-medium text-text-secondary uppercase tracking-wide">
                                          RECEIVED PKR
                                        </Label>
                                        <div className="text-2xl font-bold text-text-primary">
                                          {deposit.amount_money.toFixed(2)} PKR
                                        </div>
                                      </div>
                                      
                                      <div className="space-y-2">
                                        <Label htmlFor="credits" className="text-sm font-medium text-text-secondary uppercase tracking-wide">
                                          DEPOSIT Z CRED
                                        </Label>
                                        <Input
                                          id="credits"
                                          type="text"
                                          placeholder="100 Z.C"
                                          value={actionForm.credits}
                                          onChange={(e) => setActionForm(prev => ({ ...prev, credits: e.target.value }))}
                                          className="text-2xl font-bold h-14 text-center border-2"
                                        />
                                      </div>
                                      
                                      <div className="text-xs text-text-muted text-center">
                                        Are you sure you want to verify this deposit of {actionForm.credits || '0'} Z-Credits?<br />
                                        Credit to the user.
                                      </div>
                                    </div>
                                    
                                    <DialogFooter className="flex gap-4">
                                      <Button
                                        variant="outline"
                                        size="lg"
                                        className="flex-1"
                                        onClick={() => {
                                          setSelectedRequest(null);
                                          setActionForm({ credits: '', reason: '' });
                                        }}
                                      >
                                        Cancel
                                      </Button>
                                      <Button 
                                        size="lg"
                                        className="flex-1 bg-primary hover:bg-primary/90"
                                        onClick={() => handleDepositApprove(deposit.id, deposit.user_id)}
                                      >
                                        Verify
                                      </Button>
                                    </DialogFooter>
                                  </DialogContent>
                                </Dialog>
                                
                                <Button size="sm" variant="outline">
                                  <Eye className="w-4 h-4 mr-1" />
                                  Details
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="approved" className="space-y-4">
                    {approvedDeposits.length === 0 ? (
                      <div className="py-12 text-center">
                        <p className="text-text-secondary">No approved deposits</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {approvedDeposits.map((deposit) => (
                          <div key={deposit.id} className="bg-success/10 rounded-2xl p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-2 text-sm">
                                <div>
                                  <span className="font-medium text-text-primary">User:</span> {deposit.profiles?.display_name || deposit.profiles?.username}
                                </div>
                                <div>
                                  <span className="font-medium text-text-primary">Amount:</span> {deposit.amount_money.toFixed(2)} {deposit.currency}
                                </div>
                                <div>
                                  <span className="font-medium text-text-primary">Approved:</span> {deposit.approved_credits ? formatZcreds(deposit.approved_credits) + ' ZC' : 'N/A'}
                                </div>
                                <div>
                                  <span className="font-medium text-text-primary">Date:</span> {formatDate(deposit.created_at)}
                                </div>
                              </div>
                              <Badge variant="default" className="bg-success text-white">Approved</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="rejected" className="space-y-4">
                    {rejectedDeposits.length === 0 ? (
                      <div className="py-12 text-center">
                        <p className="text-text-secondary">No rejected deposits</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {rejectedDeposits.map((deposit) => (
                          <div key={deposit.id} className="bg-danger/10 rounded-2xl p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-2 text-sm">
                                <div>
                                  <span className="font-medium text-text-primary">User:</span> {deposit.profiles?.display_name || deposit.profiles?.username}
                                </div>
                                <div>
                                  <span className="font-medium text-text-primary">Amount:</span> {deposit.amount_money.toFixed(2)} {deposit.currency}
                                </div>
                                <div>
                                  <span className="font-medium text-text-primary">Reason:</span> {deposit.rejection_reason || 'No reason provided'}
                                </div>
                                <div>
                                  <span className="font-medium text-text-primary">Date:</span> {formatDate(deposit.created_at)}
                                </div>
                              </div>
                              <Badge variant="destructive">Rejected</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </TabsContent>
              
              <TabsContent value="withdrawals" className="space-y-4">
                <p className="text-text-secondary">Withdrawal functionality coming soon...</p>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AdminGuard>
  );
}
