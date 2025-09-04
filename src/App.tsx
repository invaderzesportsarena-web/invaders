import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import Tournaments from "./pages/Tournaments";
import TournamentDetail from "./pages/TournamentDetail";
import TournamentRegister from "./pages/TournamentRegister";
import News from "./pages/News";
import Guides from "./pages/Guides";
import Shop from "./pages/Shop";
import Wallet from "./pages/Wallet";
import WalletDeposit from "./pages/WalletDeposit";
import WalletWithdraw from "./pages/WalletWithdraw";
import NotFound from "./pages/NotFound";
import Admin from "./pages/Admin";
import AdminRegistrations from "./pages/AdminRegistrations";
import AdminWallet from "./pages/AdminWallet";
import AdminPosts from "./pages/AdminPosts";
import AdminProducts from "./pages/AdminProducts";
import AdminResults from "./pages/AdminResults";
import AdminSettings from "./pages/AdminSettings";
import AdminTournaments from "./pages/AdminTournaments";
import BackgroundRemoval from "./pages/BackgroundRemoval";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/signup" element={<Auth />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/tournaments" element={<Tournaments />} />
            <Route path="/tournaments/:id" element={<TournamentDetail />} />
            <Route path="/tournaments/:id/register" element={<TournamentRegister />} />
            <Route path="/news" element={<News />} />
            <Route path="/guides" element={<Guides />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/wallet" element={<Wallet />} />
            <Route path="/wallet/deposit" element={<WalletDeposit />} />
            <Route path="/wallet/withdraw" element={<WalletWithdraw />} />
            <Route path="/background-removal" element={<BackgroundRemoval />} />
            
            {/* Admin Routes - Protected */}
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/registrations" element={<AdminRegistrations />} />
          <Route path="/admin/tournaments" element={<AdminTournaments />} />
          <Route path="/admin/wallet" element={<AdminWallet />} />
          <Route path="/admin/posts" element={<AdminPosts />} />
          <Route path="/admin/products" element={<AdminProducts />} />
          <Route path="/admin/results" element={<AdminResults />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
            
            {/* 404 fallback */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
