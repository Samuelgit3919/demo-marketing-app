import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Index from "./pages/Index";
import Wizard from "./pages/Wizard";
import Admin from "./pages/admin";
import Auth from "./pages/auth";
import NotFound from "./pages/NotFound";
import HowItWorks from "./pages/HowItWorks";
import AboutUs from "./pages/AboutUs";
import Gallery from "./pages/Gallery";
import { useEffect } from "react";
import FileManager from "./pages/FileManager";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>

    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/wizard" element={<Wizard />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/file-manager" element={<ProtectedRoute>
            <FileManager />
          </ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute>
            <Admin />
          </ProtectedRoute>} />

          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/about-us" element={<AboutUs />} />
          <Route path="/gallery" element={<Gallery />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
