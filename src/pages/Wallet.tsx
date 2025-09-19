import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wallet as WalletIcon, Plus, Minus, TrendingUp, TrendingDown, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatZcreds, formatZcredDisplay, formatPkrFromZcreds } from "@/utils/formatZcreds";
import { getLatestConversionRate } from "@/utils/conversionRate";
interface Transaction {
  id: string;
  amount: number;
  type: string;
  status: string;
  created_at: string;
  reason?: string;
  reference?: string;
}

interface WithdrawalRequest {
  id: string;
  amount_zcreds: number;
  status: string;
  created_at: string;
  rejection_reason?: string;
  reviewed_at?: string;
}

interface DepositRequest {
  id: string;
  amount_zc?: number;
  amount_money: number;
  status: string;
  created_at: string;
  rejection_reason?: string;
  reviewed_at?: string;
}
export default function Wallet() {
  const [user, setUser] = useState<any>(null);
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [depositRequests, setDepositRequests] = useState<DepositRequest[]>([]);
  const [conversionRate, setConversionRate] = useState<number>(90);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  useEffect(() => {
    checkAuth();
    loadConversionRate();
  }, []);
  const loadConversionRate = async () => {
    const rate = await getLatestConversionRate();
    setConversionRate(rate);
  };
  const checkAuth = async () => {
    const {
      data: {
        session
      }
    } = await supabase.auth.getSession();
    if (!session?.user) {
      navigate('/auth');
      return;
    }
    setUser(session.user);
    await Promise.all([
      fetchBalance(session.user.id), 
      fetchTransactions(session.user.id),
      fetchWithdrawalRequests(session.user.id),
      fetchDepositRequests(session.user.id)
    ]);
    setLoading(false);
  };
  const fetchBalance = async (userId: string) => {
    try {
      // Use the proper zcred_wallets table
      const {
        data,
        error
      } = await supabase.from('zcred_wallets').select('balance').eq('user_id', userId).single();
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching balance:', error.message);
        setBalance(0);
        return;
      }
      setBalance(data?.balance || 0);
    } catch (error: any) {
      console.error('Error fetching balance:', error.message);
      setBalance(0);
    }
  };
  const fetchTransactions = async (userId: string) => {
    try {
      const {
        data,
        error
      } = await supabase.from('zcred_transactions').select('*').eq('user_id', userId).eq('status', 'approved').order('created_at', {
        ascending: false
      }).limit(20);
      if (error) throw error;
      setTransactions(data || []);
    } catch (error: any) {
      console.error('Error fetching transactions:', error.message);
    }
  };

  const fetchWithdrawalRequests = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('zcred_withdrawal_forms')
        .select('id, amount_zcreds, status, created_at, rejection_reason, reviewed_at')
        .eq('user_id', userId)
        .in('status', ['rejected', 'submitted'])
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      setWithdrawalRequests(data || []);
    } catch (error: any) {
      console.error('Error fetching withdrawal requests:', error.message);
    }
  };

  const fetchDepositRequests = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('zcred_deposit_forms')
        .select('id, amount_zc, amount_money, status, created_at, rejection_reason, reviewed_at')
        .eq('user_id', userId)
        .in('status', ['rejected', 'submitted'])
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      setDepositRequests(data || []);
    } catch (error: any) {
      console.error('Error fetching deposit requests:', error.message);
    }
  };
  const getTransactionIcon = (type: string, amount: number) => {
    return amount > 0 ? TrendingUp : TrendingDown;
  };
  const getTransactionLabel = (type: string) => {
    switch (type) {
      case 'deposit_credit':
        return 'Deposit';
      case 'withdrawal_payout':
        return 'Withdrawal';
      case 'manual_adjustment':
        return 'Manual Adjustment';
      case 'tournament_entry':
        return 'Tournament Entry';
      default:
        return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
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
    return <div className="min-h-screen">
        <div className="container mx-auto py-8 px-4">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-secondary/50 rounded w-1/4"></div>
            <div className="h-48 bg-secondary/50 rounded"></div>
            <div className="h-64 bg-secondary/50 rounded"></div>
          </div>
        </div>
      </div>;
  }
  return <div className="min-h-screen">
      <div className="container mx-auto py-8 px-4 space-y-6">
        {/* Back Navigation */}
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate(-1)} className="flex items-center space-x-2">
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-heading font-bold text-text-primary">
            <span className="bg-gradient-accent bg-clip-text text-transparent">
              My Wallet
            </span>
            <div className="text-lg font-normal text-text-secondary mt-2">
              1 Z-Cred = {conversionRate} PKR
            </div>
          </h1>
        </div>

      {/* Balance Card */}
      <Card className="esports-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-accent rounded-2xl flex items-center justify-center">
                <WalletIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-text-primary text-xl">Current Balance</CardTitle>
                <CardDescription className="text-text-secondary">Available Z-Credits • Min deposit: 200 ZC • Min withdrawal: 150 ZC</CardDescription>
              </div>
            </div>
            <div className="text-right">
              <div className="text-4xl font-heading font-bold text-primary">
                {formatZcreds(balance)} ZC
              </div>
              <div className="text-sm text-text-secondary">
                ≈ PKR {(balance * conversionRate).toFixed(2)}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex gap-4">
            <Button asChild className="bg-gradient-accent hover:shadow-[var(--shadow-glow)] flex-1 font-bold">
              <Link to="/wallet/deposit">
                <Plus className="w-4 h-4 mr-2" />
                Deposit Z-Creds
              </Link>
            </Button>
            <Button asChild variant="outline" className="flex-1 font-bold border-2">
              <Link to="/wallet/withdraw">
                <Minus className="w-4 h-4 mr-2" />
                Withdraw Z-Creds
              </Link>
            </Button>
          </div>
          <div className="mt-4 p-4 bg-secondary/20 rounded-xl">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-text-secondary">Withdrawal Fee:</span>
                <span className="text-text-primary font-bold ml-2">10 ZC</span>
              </div>
              <div>
                <span className="text-text-secondary">Processing:</span>
                <span className="text-text-primary font-bold ml-2">Manual Review</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions */}
      <Card className="esports-card">
        <CardHeader>
          <CardTitle className="text-text-primary">Recent Transactions</CardTitle>
          <CardDescription className="text-text-secondary">
            Your latest approved transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? <div className="text-center py-12">
              <WalletIcon className="w-12 h-12 text-text-muted mx-auto mb-4" />
              <p className="text-text-muted text-lg">No transactions yet</p>
              <p className="text-text-secondary text-sm">
                Start by making a deposit to earn Z-Credits
              </p>
            </div> : <div className="space-y-4">
              {transactions.map(transaction => {
              const Icon = getTransactionIcon(transaction.type, transaction.amount);
              const isPositive = transaction.amount > 0;
              return <div key={transaction.id} className="flex items-center justify-between p-4 rounded-2xl border border-border hover:bg-secondary/20 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isPositive ? 'bg-success/10' : 'bg-danger/10'}`}>
                        <Icon className={`w-5 h-5 ${isPositive ? 'text-success' : 'text-danger'}`} />
                      </div>
                      <div>
                        <p className="font-semibold text-text-primary">
                          {getTransactionLabel(transaction.type)}
                        </p>
                        <p className="text-sm text-text-secondary">
                          {formatDate(transaction.created_at)}
                        </p>
                         {transaction.reason && transaction.reason.trim() && (
                           <div className="text-xs text-text-muted bg-secondary/20 rounded px-2 py-1 mt-1 border border-border/30">
                             <span className="font-medium text-text-primary">Admin note:</span> {transaction.reason}
                           </div>
                         )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${isPositive ? 'text-success' : 'text-danger'}`}>
                        {isPositive ? '+' : ''}{formatZcreds(transaction.amount)} ZC
                      </p>
                      <Badge variant="secondary" className="text-xs">
                        {transaction.status}
                      </Badge>
                    </div>
                  </div>;
            })}
            </div>}
        </CardContent>
        </Card>

        {/* Withdrawal Requests */}
        {withdrawalRequests.length > 0 && (
          <Card className="esports-card">
            <CardHeader>
              <CardTitle className="text-text-primary">Withdrawal Requests</CardTitle>
              <CardDescription className="text-text-secondary">
                Your pending and rejected withdrawal requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {withdrawalRequests.map(request => (
                  <div key={request.id} className="flex items-center justify-between p-4 rounded-2xl border border-border">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        request.status === 'rejected' ? 'bg-danger/10' : 'bg-warning/10'
                      }`}>
                        <Minus className={`w-5 h-5 ${
                          request.status === 'rejected' ? 'text-danger' : 'text-warning'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-text-primary">Withdrawal Request</p>
                        <p className="text-sm text-text-secondary">
                          {formatDate(request.created_at)}
                        </p>
                        {request.status === 'rejected' && request.rejection_reason && (
                          <div className="mt-2 p-3 bg-danger/10 border border-danger/20 rounded-lg">
                            <p className="text-sm font-medium text-danger mb-1">Rejection Reason:</p>
                            <p className="text-sm text-danger">{request.rejection_reason}</p>
                            {request.reviewed_at && (
                              <p className="text-xs text-danger/70 mt-1">
                                Reviewed: {formatDate(request.reviewed_at)}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-danger">
                        -{formatZcreds(request.amount_zcreds)} ZC
                      </p>
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${
                          request.status === 'rejected' ? 'bg-danger/10 text-danger' : 'bg-warning/10 text-warning'
                        }`}
                      >
                        {request.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Deposit Requests */}
        {depositRequests.length > 0 && (
          <Card className="esports-card">
            <CardHeader>
              <CardTitle className="text-text-primary">Deposit Requests</CardTitle>
              <CardDescription className="text-text-secondary">
                Your pending and rejected deposit requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {depositRequests.map(request => (
                  <div key={request.id} className="flex items-center justify-between p-4 rounded-2xl border border-border">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        request.status === 'rejected' ? 'bg-danger/10' : 'bg-warning/10'
                      }`}>
                        <Plus className={`w-5 h-5 ${
                          request.status === 'rejected' ? 'text-danger' : 'text-warning'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-text-primary">Deposit Request</p>
                        <p className="text-sm text-text-secondary">
                          {formatDate(request.created_at)}
                        </p>
                        {request.status === 'rejected' && request.rejection_reason && (
                          <div className="mt-2 p-3 bg-danger/10 border border-danger/20 rounded-lg">
                            <p className="text-sm font-medium text-danger mb-1">Rejection Reason:</p>
                            <p className="text-sm text-danger">{request.rejection_reason}</p>
                            {request.reviewed_at && (
                              <p className="text-xs text-danger/70 mt-1">
                                Reviewed: {formatDate(request.reviewed_at)}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-warning">
                        +{formatZcreds(request.amount_zc || 0)} ZC
                      </p>
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${
                          request.status === 'rejected' ? 'bg-danger/10 text-danger' : 'bg-warning/10 text-warning'
                        }`}
                      >
                        {request.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>;
}