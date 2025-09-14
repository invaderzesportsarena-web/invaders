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
        .from('zcred_wallets')
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
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <div className="bg-gradient-primary border-b border-border">
        <div className="container mx-auto px-4 py-12">
          {/* Back Navigation */}
          <div className="mb-6">
            <Button 
              variant="ghost" 
              onClick={() => navigate(-1)} 
              className="flex items-center space-x-2 text-white hover:bg-white/10 border-0"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </Button>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <h1 className="text-4xl lg:text-5xl font-heading font-bold text-white mb-4">
                InvaderZ <span className="text-accent">Shop</span>
              </h1>
              <p className="text-lg text-white/80 max-w-2xl">
                Redeem your hard-earned Z-Credits for exclusive gaming gear, merchandise, and digital rewards
              </p>
            </div>
            
            {user && (
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 min-w-[280px]">
                <div className="text-center">
                  <div className="text-white/60 text-sm mb-2">Your Balance</div>
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center text-white font-bold">Z</div>
                    <span className="text-3xl font-bold text-white">{balance.toLocaleString()}</span>
                  </div>
                  <div className="text-white/60 text-sm">≈ {balance.toLocaleString()} PKR</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {products.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-card border border-border rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Package className="w-10 h-10 text-text-muted" />
            </div>
            <h3 className="text-xl font-semibold text-text-primary mb-2">No Products Available</h3>
            <p className="text-text-muted">Check back soon for new gaming gear and rewards!</p>
          </div>
        ) : (
          <>
            <div className="text-center mb-12">
              <h2 className="text-2xl font-heading font-bold text-text-primary mb-4">Featured Products</h2>
              <p className="text-text-secondary max-w-2xl mx-auto">
                From premium gaming peripherals to exclusive InvaderZ merchandise, upgrade your setup with Z-Credits
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {products.map((product) => (
                <div key={product.id} className="group">
                  <Card className="h-full border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-all duration-300 overflow-hidden">
                    {product.image_url && (
                      <div className="relative aspect-square overflow-hidden">
                        <img 
                          src={product.image_url} 
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        
                        {/* Stock Badge */}
                        <div className="absolute top-3 left-3">
                          <Badge variant="secondary" className="bg-black/70 text-white border-0 backdrop-blur-sm">
                            {product.stock} left
                          </Badge>
                        </div>
                      </div>
                    )}
                    
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-bold text-lg text-text-primary line-clamp-2 group-hover:text-primary transition-colors">
                          {product.name}
                        </h3>
                        <div className="flex flex-col items-end ml-3">
                          <div className="flex items-center gap-1">
                            <div className="w-5 h-5 bg-accent rounded-full flex items-center justify-center">
                              <span className="text-white text-xs font-bold">Z</span>
                            </div>
                            <span className="font-bold text-xl text-text-primary">{product.price_credits}</span>
                          </div>
                          <div className="text-xs text-text-muted">
                            ≈ {product.price_credits.toLocaleString()} PKR
                          </div>
                        </div>
                      </div>
                      
                      {product.description && (
                        <p className="text-text-secondary text-sm line-clamp-3 mb-6">
                          {product.description}
                        </p>
                      )}
                      
                      <div className="flex gap-2">
                        <Button 
                          className="flex-1 bg-gradient-accent hover:bg-gradient-accent/90 text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group/btn"
                          onClick={() => navigate(`/shop/product/${product.id}`)}
                        >
                          View Details
                        </Button>
                        <Button 
                          className="flex-1 bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group/btn"
                          onClick={() => handleRedeem(product)}
                          disabled={!user || balance < product.price_credits}
                        >
                          <ShoppingBag className="w-4 h-4 mr-2 group-hover/btn:scale-110 transition-transform" />
                          {!user ? "Sign In" : balance < product.price_credits ? "Low Credits" : "Buy Now"}
                        </Button>
                      </div>
                    </div>
                  </Card>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}