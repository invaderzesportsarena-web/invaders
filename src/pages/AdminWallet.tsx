import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Wallet, Check, X, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AdminGuard } from "@/components/AdminGuard";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface DepositForm {
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
  profiles?: {
    display_name: string;
  };
}

interface WithdrawalForm {
  id: string;
  user_id: string;
  amount_zcreds: number;
  recipient_name: string;
  recipient_bank: string;
  recipient_account_no: string;
  iban_optional?: string;
  status: string;
  created_at: string;
  profiles?: {
    display_name: string;
  };
}

interface Transaction {
  id: string;
  user_id: string;
  type: string;
  amount: number;
  status: string;
  created_at: string;
  profiles?: {
    display_name: string;
  };
}

export default function AdminWallet() {
  const [deposits, setDeposits] = useState<DepositForm[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalForm[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch deposits
      const { data: depositsData, error: depositsError } = await supabase
        .from('zcred_deposit_forms')
        .select(`
          *,
          profiles (display_name)
        `)
        .eq('status', 'submitted')
        .order('created_at', { ascending: false });

      if (depositsError) throw depositsError;

      // Fetch withdrawals
      const { data: withdrawalsData, error: withdrawalsError } = await supabase
        .from('zcred_withdrawal_forms')
        .select(`
          *,
          profiles (display_name)
        `)
        .eq('status', 'submitted')
        .order('created_at', { ascending: false });

      if (withdrawalsError) throw withdrawalsError;

      // Fetch transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('zcred_transactions')
        .select(`
          *,
          profiles (display_name)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (transactionsError) throw transactionsError;

      setDeposits(depositsData || []);
      setWithdrawals(withdrawalsData || []);
      setTransactions(transactionsData || []);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load wallet data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDepositVerify = async (depositId: string, userId: string, amount: number) => {
    try {
      // Insert transaction
      const { error: transError } = await supabase
        .from('zcred_transactions')
        .insert({
          user_id: userId,
          amount: Math.ceil(amount),
          type: 'deposit_credit',
          status: 'approved'
        });

      if (transError) throw transError;

      // Update deposit form status
      const { error: updateError } = await supabase
        .from('zcred_deposit_forms')
        .update({ status: 'verified' })
        .eq('id', depositId);

      if (updateError) throw updateError;

      // Remove from local state
      setDeposits(prev => prev.filter(d => d.id !== depositId));

      toast({
        title: "Success",
        description: "Deposit verified successfully",
      });
    } catch (error: any) {
      console.error('Error verifying deposit:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to verify deposit",
        variant: "destructive"
      });
    }
  };

  const handleDepositReject = async (depositId: string) => {
    try {
      const { error } = await supabase
        .from('zcred_deposit_forms')
        .update({ status: 'rejected' })
        .eq('id', depositId);

      if (error) throw error;

      setDeposits(prev => prev.filter(d => d.id !== depositId));

      toast({
        title: "Success",
        description: "Deposit rejected",
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

  const handleWithdrawalPayout = async (withdrawalId: string, userId: string, amount: number) => {
    try {
      // Insert transaction
      const { error: transError } = await supabase
        .from('zcred_transactions')
        .insert({
          user_id: userId,
          amount: -amount,
          type: 'withdrawal_payout',
          status: 'approved'
        });

      if (transError) throw transError;

      // Update withdrawal form status
      const { error: updateError } = await supabase
        .from('zcred_withdrawal_forms')
        .update({ status: 'paid' })
        .eq('id', withdrawalId);

      if (updateError) throw updateError;

      // Remove from local state
      setWithdrawals(prev => prev.filter(w => w.id !== withdrawalId));

      toast({
        title: "Success",
        description: "Withdrawal processed successfully",
      });
    } catch (error: any) {
      console.error('Error processing withdrawal:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to process withdrawal",
        variant: "destructive"
      });
    }
  };

  const handleWithdrawalReject = async (withdrawalId: string) => {
    try {
      const { error } = await supabase
        .from('zcred_withdrawal_forms')
        .update({ status: 'rejected' })
        .eq('id', withdrawalId);

      if (error) throw error;

      setWithdrawals(prev => prev.filter(w => w.id !== withdrawalId));

      toast({
        title: "Success",
        description: "Withdrawal rejected",
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

  const formatTransactionType = (type: string) => {
    switch (type) {
      case 'deposit_credit': return 'Deposit';
      case 'withdrawal_payout': return 'Withdrawal';
      case 'adjust': return 'Adjustment';
      default: return type;
    }
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
          <CardContent>
            <Tabs defaultValue="deposits" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="deposits">Deposits ({deposits.length})</TabsTrigger>
                <TabsTrigger value="withdrawals">Withdrawals ({withdrawals.length})</TabsTrigger>
                <TabsTrigger value="transactions">Transactions</TabsTrigger>
              </TabsList>
              
              <TabsContent value="deposits" className="space-y-4">
                {deposits.length === 0 ? (
                  <div className="py-12 text-center">
                    <p className="text-text-secondary">No pending deposits</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {deposits.map((deposit) => (
                      <div key={deposit.id} className="bg-secondary/30 rounded-2xl p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm">
                              <div>
                                <span className="font-medium text-text-primary">User:</span> {deposit.profiles?.display_name || deposit.user_id}
                              </div>
                              <div>
                                <span className="font-medium text-text-primary">Amount:</span> {deposit.amount_money} {deposit.currency}
                              </div>
                              <div>
                                <span className="font-medium text-text-primary">Bank:</span> {deposit.sender_bank}
                              </div>
                              <div>
                                <span className="font-medium text-text-primary">Created:</span> {formatDate(deposit.created_at)}
                              </div>
                            </div>
                            <div className="mt-2 text-sm text-text-secondary">
                              <span className="font-medium">Account:</span> {deposit.sender_account_no} | 
                              <span className="font-medium"> Name:</span> {deposit.bank_sender_name}
                            </div>
                          </div>
                          
                          <div className="flex gap-2 ml-4">
                            {deposit.screenshot_url && (
                              <Button size="sm" variant="outline" asChild>
                                <a href={deposit.screenshot_url} target="_blank" rel="noopener noreferrer">
                                  <Eye className="w-4 h-4 mr-1" />
                                  View
                                </a>
                              </Button>
                            )}
                            
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" className="bg-success hover:bg-success/90">
                                  <Check className="w-4 h-4 mr-1" />
                                  Verify
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Verify Deposit</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to verify this deposit of {deposit.amount_money} {deposit.currency}?
                                    This will credit {Math.ceil(deposit.amount_money)} Z-Credits to the user.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDepositVerify(deposit.id, deposit.user_id, deposit.amount_money)}>
                                    Verify
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="destructive">
                                  <X className="w-4 h-4 mr-1" />
                                  Reject
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Reject Deposit</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to reject this deposit?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDepositReject(deposit.id)}>
                                    Reject
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
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
                    <p className="text-text-secondary">No pending withdrawals</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {withdrawals.map((withdrawal) => (
                      <div key={withdrawal.id} className="bg-secondary/30 rounded-2xl p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm">
                              <div>
                                <span className="font-medium text-text-primary">User:</span> {withdrawal.profiles?.display_name || withdrawal.user_id}
                              </div>
                              <div>
                                <span className="font-medium text-text-primary">Amount:</span> {withdrawal.amount_zcreds} ZC
                              </div>
                              <div>
                                <span className="font-medium text-text-primary">Bank:</span> {withdrawal.recipient_bank}
                              </div>
                              <div>
                                <span className="font-medium text-text-primary">Created:</span> {formatDate(withdrawal.created_at)}
                              </div>
                            </div>
                            <div className="mt-2 text-sm text-text-secondary">
                              <span className="font-medium">Account:</span> {withdrawal.recipient_account_no} | 
                              <span className="font-medium"> Name:</span> {withdrawal.recipient_name}
                              {withdrawal.iban_optional && (
                                <span> | <span className="font-medium">IBAN:</span> {withdrawal.iban_optional}</span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex gap-2 ml-4">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" className="bg-success hover:bg-success/90">
                                  <Check className="w-4 h-4 mr-1" />
                                  Payout
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Process Payout</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to process this withdrawal of {withdrawal.amount_zcreds} Z-Credits?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleWithdrawalPayout(withdrawal.id, withdrawal.user_id, withdrawal.amount_zcreds)}>
                                    Process Payout
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="destructive">
                                  <X className="w-4 h-4 mr-1" />
                                  Reject
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Reject Withdrawal</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to reject this withdrawal?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleWithdrawalReject(withdrawal.id)}>
                                    Reject
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="transactions" className="space-y-4">
                {transactions.length === 0 ? (
                  <div className="py-12 text-center">
                    <p className="text-text-secondary">No transactions found</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {transactions.map((transaction) => (
                      <div key={transaction.id} className="bg-secondary/30 rounded-xl p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div>
                              <span className="font-medium text-text-primary">
                                {transaction.profiles?.display_name || transaction.user_id}
                              </span>
                            </div>
                            <div>
                              <span className="text-sm text-text-secondary">
                                {formatTransactionType(transaction.type)}
                              </span>
                            </div>
                            <div className={`font-medium ${transaction.amount >= 0 ? 'text-success' : 'text-destructive'}`}>
                              {transaction.amount >= 0 ? '+' : ''}{transaction.amount} ZC
                            </div>
                            <Badge variant={transaction.status === 'approved' ? 'default' : 'secondary'}>
                              {transaction.status}
                            </Badge>
                          </div>
                          <div className="text-sm text-text-secondary">
                            {formatDate(transaction.created_at)}
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