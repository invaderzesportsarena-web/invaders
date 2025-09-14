import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Star, ShoppingBag, Heart, Share2, Truck, Shield, RotateCcw, Minus, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price_credits: number;
  stock: number;
  image_url: string | null;
  active: boolean;
}

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState<number>(0);
  const [user, setUser] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const { toast } = useToast();

  // Mock multiple images for demonstration
  const productImages = product?.image_url ? [
    product.image_url,
    product.image_url,
    product.image_url
  ] : [];

  useEffect(() => {
    if (id) {
      checkAuth();
      fetchProduct();
    }
  }, [id]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setUser(session.user);
      fetchBalance(session.user.id);
    }
  };

  const fetchProduct = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .eq('active', true)
        .single();

      if (error) throw error;
      setProduct(data);
    } catch (error: any) {
      console.error('Error fetching product:', error.message);
      toast({
        title: "Product not found",
        description: "The product you're looking for doesn't exist",
        variant: "destructive"
      });
      navigate('/shop');
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

  const handleAddToCart = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to add products to cart",
        variant: "destructive"
      });
      return;
    }

    if (!product) return;

    const totalCost = product.price_credits * quantity;
    if (balance < totalCost) {
      toast({
        title: "Insufficient credits",
        description: `You need ${totalCost} Z-Credits but only have ${balance}`,
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
          total_credits: totalCost,
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
          qty: quantity,
          price_credits: product.price_credits
        });

      if (itemError) throw itemError;

      toast({
        title: "Added to cart successfully!",
        description: `${quantity}x ${product.name} added to your order`
      });

      // Reset quantity
      setQuantity(1);
    } catch (error: any) {
      toast({
        title: "Failed to add to cart",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-text-primary mb-4">Product Not Found</h1>
            <Button onClick={() => navigate('/shop')}>Back to Shop</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Back Navigation */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/shop')} 
            className="flex items-center space-x-2 text-text-primary hover:text-primary"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Shop</span>
          </Button>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 mb-12">
          {/* Product Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="aspect-square rounded-2xl overflow-hidden bg-card border border-border">
              {productImages.length > 0 && (
                <img 
                  src={productImages[selectedImageIndex]} 
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            {/* Thumbnail Images */}
            {productImages.length > 1 && (
              <div className="flex space-x-4">
                {productImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                      index === selectedImageIndex ? 'border-primary' : 'border-border'
                    }`}
                  >
                    <img 
                      src={image} 
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Product Header */}
            <div>
              <Badge className="mb-3 bg-accent/20 text-accent border-accent">NEW</Badge>
              <h1 className="text-3xl font-heading font-bold text-text-primary mb-4">
                {product.name}
              </h1>
              <div className="flex items-center space-x-2 mb-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`w-5 h-5 ${i < 4 ? 'text-yellow-400 fill-current' : 'text-text-muted'}`} 
                    />
                  ))}
                </div>
                <span className="text-sm text-text-secondary">(124 reviews)</span>
              </div>
              
              {product.description && (
                <p className="text-text-secondary leading-relaxed">
                  {product.description}
                </p>
              )}
            </div>

            {/* Price */}
            <div className="py-4 border-y border-border">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-accent rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">Z</span>
                  </div>
                  <span className="text-3xl font-bold text-text-primary">
                    {product.price_credits.toLocaleString()}
                  </span>
                </div>
                <div className="text-sm text-text-muted">
                  ≈ {product.price_credits.toLocaleString()} PKR
                </div>
              </div>
            </div>

            {/* Size Selection (Mock) */}
            <div>
              <h3 className="font-semibold text-text-primary mb-3">Size</h3>
              <div className="flex space-x-3">
                {['S', 'M', 'L', 'XL'].map((size) => (
                  <button
                    key={size}
                    className={`px-4 py-2 rounded-lg border transition-colors ${
                      size === 'M' 
                        ? 'border-primary bg-primary text-white' 
                        : 'border-border hover:border-primary'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Selection (Mock) */}
            <div>
              <h3 className="font-semibold text-text-primary mb-3">Color</h3>
              <div className="flex space-x-3">
                {['Black', 'White', 'Blue'].map((color) => (
                  <button
                    key={color}
                    className={`px-4 py-2 rounded-lg border transition-colors ${
                      color === 'Black' 
                        ? 'border-primary bg-primary text-white' 
                        : 'border-border hover:border-primary'
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div>
              <h3 className="font-semibold text-text-primary mb-3">Quantity</h3>
              <div className="flex items-center space-x-4">
                <div className="flex items-center border border-border rounded-lg">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3"
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="px-4 py-2 min-w-[3rem] text-center">{quantity}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="px-3"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <Badge variant="secondary" className="text-green-600 bg-green-100 border-green-200">
                  In Stock ({product.stock} available)
                </Badge>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-4">
              <Button 
                className="w-full bg-accent hover:bg-accent/90 text-white font-bold py-4 text-lg rounded-xl"
                onClick={handleAddToCart}
                disabled={!user || balance < (product.price_credits * quantity)}
              >
                <ShoppingBag className="w-5 h-5 mr-2" />
                {!user ? "Sign In to Order" : balance < (product.price_credits * quantity) ? "Insufficient Credits" : "Add to Cart"}
              </Button>
              
              <div className="flex space-x-3">
                <Button variant="outline" className="flex-1 py-3">
                  <Heart className="w-4 h-4 mr-2" />
                  Wishlist
                </Button>
                <Button variant="outline" className="flex-1 py-3">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>

            {/* Features */}
            <div className="grid grid-cols-3 gap-4 pt-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Truck className="w-6 h-6 text-primary" />
                </div>
                <h4 className="font-semibold text-sm text-text-primary">Free Shipping</h4>
                <p className="text-xs text-text-muted">Orders over 500</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <h4 className="font-semibold text-sm text-text-primary">Secure Payment</h4>
                <p className="text-xs text-text-muted">SSL Protected</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                  <RotateCcw className="w-6 h-6 text-primary" />
                </div>
                <h4 className="font-semibold text-sm text-text-primary">Easy Returns</h4>
                <p className="text-xs text-text-muted">30 day policy</p>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <Card className="border-border/50">
          <CardContent className="p-0">
            <Tabs defaultValue="description" className="w-full">
              <TabsList className="w-full justify-start border-b border-border rounded-none bg-transparent h-auto p-0">
                <TabsTrigger 
                  value="description" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-4"
                >
                  Description
                </TabsTrigger>
                <TabsTrigger 
                  value="specifications" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-4"
                >
                  Specifications
                </TabsTrigger>
                <TabsTrigger 
                  value="reviews" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-4"
                >
                  Reviews (124)
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="description" className="p-8 mt-0">
                <div className="border border-accent rounded-xl p-6 bg-card/50">
                  <h3 className="text-xl font-bold text-accent mb-4">Product Description</h3>
                  <p className="text-text-secondary leading-relaxed mb-6">
                    Represent InvaderZ with pride in this premium esports jersey. Made from high-performance moisture-wicking fabric that keeps you cool 
                    during intense gaming sessions. Features official team logos, player-grade construction, and comfortable athletic fit. Perfect for tournaments, 
                    streaming, or casual wear.
                  </p>
                  
                  <h4 className="font-semibold text-text-primary mb-3">Key Features:</h4>
                  <ul className="space-y-2 text-text-secondary">
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-accent rounded-full mr-3"></span>
                      Moisture-wicking fabric
                    </li>
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-accent rounded-full mr-3"></span>
                      Official team branding
                    </li>
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-accent rounded-full mr-3"></span>
                      Athletic fit
                    </li>
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-accent rounded-full mr-3"></span>
                      Machine washable
                    </li>
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-accent rounded-full mr-3"></span>
                      Reinforced stitching
                    </li>
                  </ul>
                </div>
              </TabsContent>
              
              <TabsContent value="specifications" className="p-8 mt-0">
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-text-primary">Technical Specifications</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex justify-between py-2 border-b border-border">
                        <span className="text-text-secondary">Material</span>
                        <span className="font-medium text-text-primary">100% Polyester</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-border">
                        <span className="text-text-secondary">Weight</span>
                        <span className="font-medium text-text-primary">180g</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-border">
                        <span className="text-text-secondary">Care</span>
                        <span className="font-medium text-text-primary">Machine Wash</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between py-2 border-b border-border">
                        <span className="text-text-secondary">Sizes Available</span>
                        <span className="font-medium text-text-primary">S, M, L, XL</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-border">
                        <span className="text-text-secondary">Colors</span>
                        <span className="font-medium text-text-primary">Black, White, Blue</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-border">
                        <span className="text-text-secondary">Origin</span>
                        <span className="font-medium text-text-primary">Pakistan</span>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="reviews" className="p-8 mt-0">
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-text-primary">Customer Reviews</h3>
                  <div className="space-y-4">
                    {[1, 2, 3].map((review) => (
                      <div key={review} className="border border-border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-text-primary">GamerPro{review}</span>
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                              ))}
                            </div>
                          </div>
                          <span className="text-sm text-text-muted">2 days ago</span>
                        </div>
                        <p className="text-text-secondary">
                          Amazing quality jersey! The fabric is really comfortable and the design looks professional. 
                          Perfect for representing InvaderZ during tournaments.
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}