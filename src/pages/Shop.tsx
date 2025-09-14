import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, Package, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import { useNavigate } from "react-router-dom";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price_credits: number;
  stock: number;
  image_url: string | null;
  active: boolean;
}

export default function Shop() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState<number>(0);
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
    fetchProducts();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setUser(session.user);
      fetchBalance(session.user.id);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('active', true)
        .gt('stock', 0)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      console.error('Error fetching products:', error.message);
    }
    setLoading(false);
  };

  const fetchBalance = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('zcred_balances')
        .select('balance')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      setBalance(data?.balance || 0);
    } catch (error: any) {
      console.error('Error fetching balance:', error.message);
    }
  };

  const handleRedeem = async (product: Product) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to redeem products",
        variant: "destructive"
      });
      return;
    }

    if (balance < product.price_credits) {
      toast({
        title: "Insufficient credits",
        description: "You don't have enough Z-Credits for this purchase",
        variant: "destructive"
      });
      return;
    }

    try {
      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          total_credits: product.price_credits,
          status: 'paid'
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order item
      const { error: itemError } = await supabase
        .from('order_items')
        .insert({
          order_id: order.id,
          product_id: product.id,
          qty: 1,
          price_credits: product.price_credits
        });

      if (itemError) throw itemError;

      toast({
        title: "Order placed successfully!",
        description: "Your redemption is pending admin confirmation"
      });

      // Refresh products to update stock display
      fetchProducts();
    } catch (error: any) {
      toast({
        title: "Redemption failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      <div className="container mx-auto px-4 py-8">
        {/* Back Navigation */}
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate(-1)} className="flex items-center space-x-2">
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </Button>
        </div>

        <div className="mb-8">
          <h1 className="text-4xl font-heading font-bold text-text-primary mb-4">
            Z-Credits <span className="bg-gradient-accent bg-clip-text text-transparent">Shop</span>
          </h1>
          <div className="flex items-center justify-between">
            <p className="text-xl text-text-secondary">
              Redeem your Z-Credits for exclusive rewards • 1 Z-Credit = 1 PKR
            </p>
          {user && (
            <div className="flex items-center gap-2 bg-card border border-border rounded-2xl px-4 py-2">
              <span className="w-6 h-6 text-center font-bold text-primary">Z</span>
              <span className="text-text-primary font-semibold">{balance.toLocaleString()}</span>
              <span className="text-text-muted text-sm">credits</span>
            </div>
          )}
        </div>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-secondary/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-text-muted" />
          </div>
          <p className="text-text-muted">No products available at the moment</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <Card key={product.id} className="esports-card group">
              {product.image_url && (
                <div className="aspect-square overflow-hidden rounded-t-2xl">
                  <img 
                    src={product.image_url} 
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              )}
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline" className="text-xs">
                    {product.stock} in stock
                  </Badge>
                  <div className="flex flex-col items-end">
                    <div className="flex items-center gap-1 text-primary font-bold text-lg">
                      <span className="w-4 h-4 text-center text-sm">Z</span>
                      <span>{product.price_credits}</span>
                    </div>
                    <div className="text-xs text-text-secondary">
                      ≈ {product.price_credits.toLocaleString()} PKR
                    </div>
                  </div>
                </div>
                <CardTitle className="text-lg text-text-primary line-clamp-2">
                  {product.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {product.description && (
                  <p className="text-text-secondary text-sm line-clamp-3">
                    {product.description}
                  </p>
                )}
                <Button 
                  className="w-full bg-gradient-accent hover:shadow-[var(--shadow-glow)] font-bold"
                  onClick={() => handleRedeem(product)}
                  disabled={!user || balance < product.price_credits}
                >
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  {!user ? "Sign In to Redeem" : balance < product.price_credits ? "Insufficient Z-Creds" : "Order Now"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}