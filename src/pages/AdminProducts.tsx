import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Package, Plus, Edit, Trash2, Upload, ShoppingCart } from "lucide-react";
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

interface Product {
  id: string;
  name: string;
  description?: string;
  price_credits: number;
  stock: number;
  active: boolean;
  image_url?: string;
  created_at: string;
}

interface Order {
  id: string;
  user_id: string;
  total_credits: number;
  status: string;
  created_at: string;
  profiles?: {
    display_name: string;
  };
  order_items?: {
    qty: number;
    product_id: string;
    products?: {
      name: string;
    };
  }[];
}

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price_credits: 0,
    stock: 0,
    active: true,
    image_url: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (productsError) throw productsError;

      // Fetch orders with items
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          profiles (display_name),
          order_items (
            qty,
            product_id,
            products (name)
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (ordersError) throw ordersError;

      setProducts(productsData || []);
      setOrders(ordersData || []);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load products and orders",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('product_image')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product_image')
        .getPublicUrl(fileName);

      setFormData(prev => ({ ...prev, image_url: publicUrl }));
      
      toast({
        title: "Success",
        description: "Product image uploaded successfully",
      });
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to upload product image",
        variant: "destructive"
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(formData)
          .eq('id', editingProduct.id);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Product updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('products')
          .insert([formData]);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Product created successfully",
        });
      }

      setIsDialogOpen(false);
      setEditingProduct(null);
      setFormData({
        name: '',
        description: '',
        price_credits: 0,
        stock: 0,
        active: true,
        image_url: ''
      });
      fetchData();
    } catch (error: any) {
      console.error('Error saving product:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save product",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      price_credits: product.price_credits,
      stock: product.stock,
      active: product.active,
      image_url: product.image_url || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (productId: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      setProducts(prev => prev.filter(p => p.id !== productId));
      
      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
    } catch (error: any) {
      console.error('Error deleting product:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete product",
        variant: "destructive"
      });
    }
  };

  const handleConfirmRedemption = async (order: Order) => {
    try {
      // Insert transaction
      const { error: transError } = await supabase
        .from('zcred_transactions')
        .insert({
          user_id: order.user_id,
          amount: -order.total_credits,
          type: 'adjust',
          status: 'approved'
        });

      if (transError) throw transError;

      // Decrement stock for each product
      if (order.order_items) {
        for (const item of order.order_items) {
          // Get current stock and decrement it
          const { data: currentProduct } = await supabase
            .from('products')
            .select('stock')
            .eq('id', item.product_id)
            .single();
          
          if (currentProduct) {
            const { error: stockError } = await supabase
              .from('products')
              .update({ stock: Math.max(0, currentProduct.stock - item.qty) })
              .eq('id', item.product_id);
            
            if (stockError) throw stockError;
          }
        }
      }

      // Update order status
      const { error: updateError } = await supabase
        .from('orders')
        .update({ status: 'paid' })
        .eq('id', order.id);

      if (updateError) throw updateError;

      // Update local state
      setOrders(prev => prev.map(o => 
        o.id === order.id ? { ...o, status: 'paid' } : o
      ));

      toast({
        title: "Success",
        description: "Redemption confirmed successfully",
      });
      
      fetchData(); // Refresh to get updated stock
    } catch (error: any) {
      console.error('Error confirming redemption:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to confirm redemption",
        variant: "destructive"
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getItemsCount = (order: Order) => {
    return order.order_items?.reduce((sum, item) => sum + item.qty, 0) || 0;
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
                Products & Shop
              </h1>
              <p className="text-text-secondary">
                Manage shop products, inventory, and Z-Credits redemptions
              </p>
            </div>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Product
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingProduct ? 'Edit Product' : 'Add New Product'}
                  </DialogTitle>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Product Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="price">Price (Z-Credits)</Label>
                      <Input
                        id="price"
                        type="number"
                        min="0"
                        value={formData.price_credits}
                        onChange={(e) => setFormData(prev => ({ ...prev, price_credits: parseInt(e.target.value) || 0 }))}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="stock">Stock</Label>
                      <Input
                        id="stock"
                        type="number"
                        min="0"
                        value={formData.stock}
                        onChange={(e) => setFormData(prev => ({ ...prev, stock: parseInt(e.target.value) || 0 }))}
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="image">Product Image</Label>
                    <div className="flex gap-2">
                      <Input
                        id="image"
                        value={formData.image_url}
                        onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                        placeholder="Image URL"
                      />
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          disabled={uploadingImage}
                        />
                        <Button type="button" variant="outline" disabled={uploadingImage}>
                          <Upload className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="active"
                      checked={formData.active}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked }))}
                    />
                    <Label htmlFor="active">Active (visible in shop)</Label>
                  </div>
                  
                  <div className="flex gap-2 justify-end pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" className="bg-primary hover:bg-primary/90">
                      {editingProduct ? 'Update' : 'Create'} Product
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card className="esports-card">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center">
                <Package className="w-5 h-5 text-accent" />
              </div>
              <CardTitle className="text-text-primary">Product Management</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="products" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="products">Products ({products.length})</TabsTrigger>
                <TabsTrigger value="orders">Orders ({orders.length})</TabsTrigger>
              </TabsList>
              
              <TabsContent value="products" className="space-y-4">
                {products.length === 0 ? (
                  <div className="py-12 text-center">
                    <p className="text-text-secondary">No products found</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {products.map((product) => (
                      <div key={product.id} className="bg-secondary/30 rounded-2xl p-4">
                        {product.image_url && (
                          <img 
                            src={product.image_url} 
                            alt={product.name}
                            className="w-full h-32 object-cover rounded-xl mb-3"
                          />
                        )}
                        
                        <div className="space-y-2">
                          <div className="flex items-start justify-between">
                            <h3 className="font-semibold text-text-primary">{product.name}</h3>
                            <Badge variant={product.active ? 'default' : 'secondary'}>
                              {product.active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          
                          {product.description && (
                            <p className="text-sm text-text-secondary line-clamp-2">
                              {product.description}
                            </p>
                          )}
                          
                          <div className="flex justify-between text-sm">
                            <span className="text-primary font-medium">
                              {product.price_credits} ZC
                            </span>
                            <span className="text-text-secondary">
                              Stock: {product.stock}
                            </span>
                          </div>
                          
                          <div className="flex gap-2 pt-2">
                            <Button size="sm" variant="outline" onClick={() => handleEdit(product)}>
                              <Edit className="w-3 h-3 mr-1" />
                              Edit
                            </Button>
                            
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="destructive">
                                  <Trash2 className="w-3 h-3 mr-1" />
                                  Delete
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Product</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{product.name}"? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(product.id)}>
                                    Delete
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
              
              <TabsContent value="orders" className="space-y-4">
                {orders.length === 0 ? (
                  <div className="py-12 text-center">
                    <p className="text-text-secondary">No orders found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div key={order.id} className="bg-secondary/30 rounded-2xl p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-4 mb-2">
                              <h3 className="font-semibold text-text-primary">
                                {order.profiles?.display_name || order.user_id}
                              </h3>
                              <Badge variant={order.status === 'paid' ? 'default' : 'secondary'}>
                                {order.status.toUpperCase()}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-text-secondary">
                              <div>
                                <span className="font-medium text-text-primary">Total:</span> {order.total_credits} ZC
                              </div>
                              <div>
                                <span className="font-medium text-text-primary">Items:</span> {getItemsCount(order)}
                              </div>
                              <div>
                                <span className="font-medium text-text-primary">Date:</span> {formatDate(order.created_at)}
                              </div>
                            </div>
                            
                            {order.order_items && order.order_items.length > 0 && (
                              <div className="mt-2 text-sm text-text-secondary">
                                <span className="font-medium text-text-primary">Products:</span> {
                                  order.order_items.map(item => 
                                    `${item.products?.name} (${item.qty}x)`
                                  ).join(', ')
                                }
                              </div>
                            )}
                          </div>
                          
                          {order.status !== 'paid' && (
                            <div className="ml-4">
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="sm" className="bg-primary hover:bg-primary/90">
                                    <ShoppingCart className="w-4 h-4 mr-1" />
                                    Confirm Redemption
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Confirm Redemption</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to confirm this redemption? This will:
                                      <br />• Deduct {order.total_credits} Z-Credits from the user
                                      <br />• Update product stock
                                      <br />• Mark the order as paid
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleConfirmRedemption(order)}>
                                      Confirm
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          )}
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