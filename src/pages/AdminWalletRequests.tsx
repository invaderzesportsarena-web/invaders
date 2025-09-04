import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Wallet, Check, X, Eye, User } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AdminGuard } from "@/components/AdminGuard";
import { formatZcreds, formatZcredDisplay } from "@/utils/formatZcreds";
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
  profiles?: {
    display_name: string;
    username: string;
  };
}

export default function AdminWalletRequests() {
  const [deposits, setDeposits] = useState<DepositRequest[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [actionForm, setActionForm] = useState({
    credits: '',
    reason: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch pending deposits
      const { data: depositsData, error: depositsError } = await supabase
        .from(SUPABASE_CONFIG.tables.ZCRED_DEPOSIT_FORMS)
        .select(`
          *,
          profiles!inner (display_name, username)
        `)
        .eq(SUPABASE_CONFIG.columns.zcred_deposit_forms.STATUS, 'submitted')
        .order(SUPABASE_CONFIG.columns.zcred_deposit_forms.CREATED_AT, { ascending: false });

      if (depositsError) throw depositsError;

      // Fetch pending withdrawals
      const { data: withdrawalsData, error: withdrawalsError } = await supabase
        .from(SUPABASE_CONFIG.tables.ZCRED_WITHDRAWAL_FORMS)
        .select(`
          *,
          profiles!inner (display_name, username)
        `)
        .eq(SUPABASE_CONFIG.columns.zcred_withdrawal_forms.STATUS, 'submitted')
        .order(SUPABASE_CONFIG.columns.zcred_withdrawal_forms.CREATED_AT, { ascending: false });

      if (withdrawalsError) throw withdrawalsError;

      setDeposits(depositsData || []);
      setWithdrawals(withdrawalsData || []);
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

  const handleWithdrawalApprove = async (withdrawalId: string, userId: string, amount: number) => {
    try {
      // Insert debit transaction
      const { error: transError } = await supabase
        .from(SUPABASE_CONFIG.tables.ZCRED_TRANSACTIONS)
        .insert({
          user_id: userId,
          amount: -amount,
          type: 'withdrawal_payout',
          status: 'approved'
        });

      if (transError) throw transError;

      // Update withdrawal form status
      const { error: updateError } = await supabase
        .from(SUPABASE_CONFIG.tables.ZCRED_WITHDRAWAL_FORMS)
        .update({ 
          status: 'paid',
          approved_credits: amount,
          reviewed_by: (await supabase.auth.getUser()).data.user?.id,
          reviewed_at: new Date().toISOString()
        })
        .eq(SUPABASE_CONFIG.columns.zcred_withdrawal_forms.ID, withdrawalId);

      if (updateError) throw updateError;

      setWithdrawals(prev => prev.filter(w => w.id !== withdrawalId));
      setSelectedRequest(null);

      toast({
        title: "Success",
        description: "Withdrawal approved and Z-Creds debited.",
      });
    } catch (error: any) {
      console.error('Error approving withdrawal:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to approve withdrawal",
        variant: "destructive"
      });
    }
  };

  const handleWithdrawalReject = async (withdrawalId: string) => {
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
        .from(SUPABASE_CONFIG.tables.ZCRED_WITHDRAWAL_FORMS)
        .update({ 
          status: 'rejected',
          rejection_reason: actionForm.reason,
          reviewed_by: (await supabase.auth.getUser()).data.user?.id,
          reviewed_at: new Date().toISOString()
        })
        .eq(SUPABASE_CONFIG.columns.zcred_withdrawal_forms.ID, withdrawalId);

      if (error) throw error;

      setWithdrawals(prev => prev.filter(w => w.id !== withdrawalId));
      setSelectedRequest(null);
      setActionForm({ credits: '', reason: '' });

      toast({
        title: "Success",
        description: "Request rejected.",
      });
    } catch (error: any) {
      console.error('Error rejecting withdrawal:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to reject withdrawal",
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
          
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            Wallet Requests
          </h1>
          <p className="text-text-secondary">
            Review and process deposit and withdrawal requests
          </p>
        </div>

        <Card className="esports-card">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <Wallet className="w-5 h-5 text-primary" />
              </div>
              <CardTitle className="text-text-primary">Wallet Requests</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="deposits" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="deposits">Deposits ({deposits.length})</TabsTrigger>
                <TabsTrigger value="withdrawals">Withdrawals ({withdrawals.length})</TabsTrigger>
              </TabsList>
              
              <TabsContent value="deposits" className="space-y-4">
                {deposits.length === 0 ? (
                  <div className="py-12 text-center">
                    <p className="text-text-secondary">No pending deposit requests</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {deposits.map((deposit) => (
                      <div key={deposit.id} className="bg-secondary/30 rounded-2xl p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-2 text-sm">
                            <div>
                              <span className="font-medium text-text-primary">User:</span> {deposit.profiles?.display_name || deposit.profiles?.username || deposit.user_id}
                            </div>
                            <div>
                              <span className="font-medium text-text-primary">Amount:</span> {deposit.amount_money.toFixed(2)} {deposit.currency}
                            </div>
                            <div>
                              <span className="font-medium text-text-primary">Bank:</span> {deposit.sender_bank}
                            </div>
                            <div>
                              <span className="font-medium text-text-primary">Date:</span> {formatDate(deposit.created_at)}
                            </div>
                          </div>
                          
                          <div className="flex gap-2 ml-4">
                            <Sheet>
                              <SheetTrigger asChild>
                                <Button size="sm" variant="outline" onClick={() => setSelectedRequest(deposit)}>
                                  <Eye className="w-4 h-4 mr-1" />
                                  Details
                                </Button>
                              </SheetTrigger>
                              <SheetContent className="w-[400px] sm:w-[540px]">
                                <SheetHeader>
                                  <SheetTitle>Deposit Request Details</SheetTitle>
                                  <SheetDescription>
                                    Review and process this deposit request
                                  </SheetDescription>
                                </SheetHeader>
                                
                                {selectedRequest && (
                                  <div className="space-y-6 mt-6">
                                    <div className="space-y-4">
                                      <div className="flex items-center gap-2">
                                        <User className="w-4 h-4" />
                                        <span className="font-medium">User Information</span>
                                      </div>
                                      <div className="bg-secondary/50 rounded-xl p-3 space-y-2 text-sm">
                                        <div><span className="font-medium">Name:</span> {selectedRequest.profiles?.display_name}</div>
                                        <div><span className="font-medium">Username:</span> {selectedRequest.profiles?.username}</div>
                                        <div><span className="font-medium">User ID:</span> {selectedRequest.user_id}</div>
                                      </div>
                                    </div>

                                    <div className="space-y-2">
                                      <span className="font-medium">Transfer Details</span>
                                      <div className="bg-secondary/50 rounded-xl p-3 space-y-2 text-sm">
                                        <div><span className="font-medium">Amount:</span> {selectedRequest.amount_money.toFixed(2)} {selectedRequest.currency}</div>
                                        <div><span className="font-medium">Sender:</span> {selectedRequest.bank_sender_name}</div>
                                        <div><span className="font-medium">Bank:</span> {selectedRequest.sender_bank}</div>
                                        <div><span className="font-medium">Account:</span> {selectedRequest.sender_account_no}</div>
                                        <div><span className="font-medium">Date:</span> {formatDate(selectedRequest.transfer_timestamp)}</div>
                                        {selectedRequest.notes && (
                                          <div><span className="font-medium">Notes:</span> {selectedRequest.notes}</div>
                                        )}
                                      </div>
                                    </div>

                                    {selectedRequest.screenshot_url && (
                                      <div className="space-y-2">
                                        <span className="font-medium">Proof Screenshot</span>
                                        <img 
                                          src={selectedRequest.screenshot_url} 
                                          alt="Transfer proof" 
                                          className="w-full rounded-xl border"
                                        />
                                      </div>
                                    )}

                                    <div className="space-y-4">
                                      <div className="space-y-2">
                                        <Label htmlFor="credits">Z-Credits to Grant</Label>
                                        <Input
                                          id="credits"
                                          type="number"
                                          step="0.01"
                                          min="0"
                                          inputMode="decimal"
                                          value={actionForm.credits}
                                          onChange={(e) => setActionForm(prev => ({ ...prev, credits: e.target.value }))}
                                          placeholder="Enter Z-Credits amount"
                                          className="rounded-xl"
                                        />
                                        <p className="text-xs text-text-muted">
                                          Suggested: {Math.round(selectedRequest.amount_money / VALIDATION.EXCHANGE_RATE * 100) / 100} Z-Credits
                                        </p>
                                      </div>

                                      <div className="space-y-2">
                                        <Label htmlFor="reason">Rejection Reason (if rejecting)</Label>
                                        <Textarea
                                          id="reason"
                                          value={actionForm.reason}
                                          onChange={(e) => setActionForm(prev => ({ ...prev, reason: e.target.value }))}
                                          placeholder="Enter reason for rejection"
                                          className="rounded-xl"
                                        />
                                      </div>

                                      <div className="flex gap-2">
                                        <Dialog>
                                          <DialogTrigger asChild>
                                            <Button className="bg-success hover:bg-success/90 flex-1">
                                              <Check className="w-4 h-4 mr-1" />
                                              Approve
                                            </Button>
                                          </DialogTrigger>
                                          <DialogContent>
                                            <DialogHeader>
                                              <DialogTitle>Approve Deposit</DialogTitle>
                                              <DialogDescription>
                                                Grant {actionForm.credits} Z-Credits to {selectedRequest.profiles?.display_name}?
                                              </DialogDescription>
                                            </DialogHeader>
                                            <DialogFooter>
                                              <Button variant="outline">Cancel</Button>
                                              <Button onClick={() => handleDepositApprove(selectedRequest.id, selectedRequest.user_id)}>
                                                Approve
                                              </Button>
                                            </DialogFooter>
                                          </DialogContent>
                                        </Dialog>

                                        <Dialog>
                                          <DialogTrigger asChild>
                                            <Button variant="destructive" className="flex-1">
                                              <X className="w-4 h-4 mr-1" />
                                              Reject
                                            </Button>
                                          </DialogTrigger>
                                          <DialogContent>
                                            <DialogHeader>
                                              <DialogTitle>Reject Deposit</DialogTitle>
                                              <DialogDescription>
                                                Are you sure you want to reject this deposit request?
                                              </DialogDescription>
                                            </DialogHeader>
                                            <DialogFooter>
                                              <Button variant="outline">Cancel</Button>
                                              <Button variant="destructive" onClick={() => handleDepositReject(selectedRequest.id)}>
                                                Reject
                                              </Button>
                                            </DialogFooter>
                                          </DialogContent>
                                        </Dialog>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </SheetContent>
                            </Sheet>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="withdrawals" className="space-y-4">
                {withdrawals.length === 0 ? (
                  <div className="py-12 text-center">
                    <p className="text-text-secondary">No pending withdrawal requests</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {withdrawals.map((withdrawal) => (
                      <div key={withdrawal.id} className="bg-secondary/30 rounded-2xl p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-2 text-sm">
                            <div>
                              <span className="font-medium text-text-primary">User:</span> {withdrawal.profiles?.display_name || withdrawal.profiles?.username}
                            </div>
                            <div>
                              <span className="font-medium text-text-primary">Amount:</span> {formatZcredDisplay(withdrawal.amount_zcreds)}
                            </div>
                            <div>
                              <span className="font-medium text-text-primary">Bank:</span> {withdrawal.recipient_bank}
                            </div>
                            <div>
                              <span className="font-medium text-text-primary">Date:</span> {formatDate(withdrawal.created_at)}
                            </div>
                          </div>
                          
                          <div className="flex gap-2 ml-4">
                            <Sheet>
                              <SheetTrigger asChild>
                                <Button size="sm" variant="outline" onClick={() => setSelectedRequest(withdrawal)}>
                                  <Eye className="w-4 h-4 mr-1" />
                                  Details
                                </Button>
                              </SheetTrigger>
                              <SheetContent className="w-[400px] sm:w-[540px]">
                                <SheetHeader>
                                  <SheetTitle>Withdrawal Request Details</SheetTitle>
                                  <SheetDescription>
                                    Review and process this withdrawal request
                                  </SheetDescription>
                                </SheetHeader>
                                
                                {selectedRequest && (
                                  <div className="space-y-6 mt-6">
                                    <div className="space-y-4">
                                      <div className="flex items-center gap-2">
                                        <User className="w-4 h-4" />
                                        <span className="font-medium">User Information</span>
                                      </div>
                                      <div className="bg-secondary/50 rounded-xl p-3 space-y-2 text-sm">
                                        <div><span className="font-medium">Name:</span> {selectedRequest.profiles?.display_name}</div>
                                        <div><span className="font-medium">Username:</span> {selectedRequest.profiles?.username}</div>
                                        <div><span className="font-medium">User ID:</span> {selectedRequest.user_id}</div>
                                      </div>
                                    </div>

                                    <div className="space-y-2">
                                      <span className="font-medium">Withdrawal Details</span>
                                      <div className="bg-secondary/50 rounded-xl p-3 space-y-2 text-sm">
                                        <div><span className="font-medium">Amount:</span> {formatZcredDisplay(selectedRequest.amount_zcreds)}</div>
                                        <div><span className="font-medium">Recipient:</span> {selectedRequest.recipient_name}</div>
                                        <div><span className="font-medium">Bank:</span> {selectedRequest.recipient_bank}</div>
                                        <div><span className="font-medium">Account:</span> {selectedRequest.recipient_account_no}</div>
                                        {selectedRequest.iban_optional && (
                                          <div><span className="font-medium">IBAN:</span> {selectedRequest.iban_optional}</div>
                                        )}
                                        {selectedRequest.notes && (
                                          <div><span className="font-medium">Notes:</span> {selectedRequest.notes}</div>
                                        )}
                                      </div>
                                    </div>

                                    <div className="space-y-4">
                                      <div className="space-y-2">
                                        <Label htmlFor="reason">Rejection Reason (if rejecting)</Label>
                                        <Textarea
                                          id="reason"
                                          value={actionForm.reason}
                                          onChange={(e) => setActionForm(prev => ({ ...prev, reason: e.target.value }))}
                                          placeholder="Enter reason for rejection"
                                          className="rounded-xl"
                                        />
                                      </div>

                                      <div className="flex gap-2">
                                        <Dialog>
                                          <DialogTrigger asChild>
                                            <Button className="bg-success hover:bg-success/90 flex-1">
                                              <Check className="w-4 h-4 mr-1" />
                                              Approve
                                            </Button>
                                          </DialogTrigger>
                                          <DialogContent>
                                            <DialogHeader>
                                              <DialogTitle>Approve Withdrawal</DialogTitle>
                                              <DialogDescription>
                                                Process withdrawal of {formatZcredDisplay(selectedRequest.amount_zcreds)} for {selectedRequest.profiles?.display_name}?
                                              </DialogDescription>
                                            </DialogHeader>
                                            <DialogFooter>
                                              <Button variant="outline">Cancel</Button>
                                              <Button onClick={() => handleWithdrawalApprove(selectedRequest.id, selectedRequest.user_id, selectedRequest.amount_zcreds)}>
                                                Approve
                                              </Button>
                                            </DialogFooter>
                                          </DialogContent>
                                        </Dialog>

                                        <Dialog>
                                          <DialogTrigger asChild>
                                            <Button variant="destructive" className="flex-1">
                                              <X className="w-4 h-4 mr-1" />
                                              Reject
                                            </Button>
                                          </DialogTrigger>
                                          <DialogContent>
                                            <DialogHeader>
                                              <DialogTitle>Reject Withdrawal</DialogTitle>
                                              <DialogDescription>
                                                Are you sure you want to reject this withdrawal request?
                                              </DialogDescription>
                                            </DialogHeader>
                                            <DialogFooter>
                                              <Button variant="outline">Cancel</Button>
                                              <Button variant="destructive" onClick={() => handleWithdrawalReject(selectedRequest.id)}>
                                                Reject
                                              </Button>
                                            </DialogFooter>
                                          </DialogContent>
                                        </Dialog>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </SheetContent>
                            </Sheet>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AdminGuard>
  );
}