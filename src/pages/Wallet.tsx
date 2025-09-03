import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wallet as WalletIcon, Plus, Minus, TrendingUp, TrendingDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Transaction {
  id: string;
  amount: number;
  type: string;
  status: string;
  created_at: string;
}

export default function Wallet() {
  const [user, setUser] = useState<any>(null);
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

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
    await Promise.all([
      fetchBalance(session.user.id),
      fetchTransactions(session.user.id)
    ]);
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
    } catch (error: any) {
      console.error('Error fetching balance:', error.message);
    }
  };

  const fetchTransactions = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('zcred_transactions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setTransactions(data || []);
    } catch (error: any) {
      console.error('Error fetching transactions:', error.message);
    }
  };

  const getTransactionIcon = (type: string, amount: number) => {
    return amount > 0 ? TrendingUp : TrendingDown;
  };

  const getTransactionLabel = (type: string) => {
    switch (type) {
      case 'deposit_credit': return 'Deposit';
      case 'withdrawal_payout': return 'Withdrawal';
      case 'adjust': return 'Adjust';
      default: return type;
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
      <div className="container mx-auto py-8 px-4">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-card rounded w-1/4"></div>
          <div className="h-48 bg-card rounded"></div>
          <div className="h-64 bg-card rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold text-text-primary">
          <span className="bg-gradient-accent bg-clip-text text-transparent">
            My Wallet
          </span>
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
                <CardTitle className="text-text-primary">Current Balance</CardTitle>
                <CardDescription className="text-text-secondary">
                  Available Z-Credits
                </CardDescription>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-primary">
                {balance.toLocaleString()} ZC
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex gap-4">
            <Button asChild variant="esports" className="flex-1">
              <Link to="/wallet/deposit">
                <Plus className="w-4 h-4 mr-2" />
                Deposit Z-Creds
              </Link>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link to="/wallet/withdraw">
                <Minus className="w-4 h-4 mr-2" />
                Withdraw Z-Creds
              </Link>
            </Button>
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
          {transactions.length === 0 ? (
            <div className="text-center py-12">
              <WalletIcon className="w-12 h-12 text-text-muted mx-auto mb-4" />
              <p className="text-text-muted text-lg">No transactions yet</p>
              <p className="text-text-secondary text-sm">
                Start by making a deposit to earn Z-Credits
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map((transaction) => {
                const Icon = getTransactionIcon(transaction.type, transaction.amount);
                const isPositive = transaction.amount > 0;
                
                return (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 rounded-2xl border border-border hover:bg-secondary/20 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        isPositive ? 'bg-success/10' : 'bg-danger/10'
                      }`}>
                        <Icon className={`w-5 h-5 ${
                          isPositive ? 'text-success' : 'text-danger'
                        }`} />
                      </div>
                      <div>
                        <p className="font-semibold text-text-primary">
                          {getTransactionLabel(transaction.type)}
                        </p>
                        <p className="text-sm text-text-secondary">
                          {formatDate(transaction.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${
                        isPositive ? 'text-success' : 'text-danger'
                      }`}>
                        {isPositive ? '+' : ''}{transaction.amount.toLocaleString()} ZC
                      </p>
                      <Badge variant="secondary" className="text-xs">
                        {transaction.status}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}