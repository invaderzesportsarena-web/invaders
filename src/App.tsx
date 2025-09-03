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
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
