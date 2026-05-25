import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import CookieBanner from "@/components/CookieBanner";
import Landing from "./pages/Landing";
import Index from "./pages/Index";
import Login from "./pages/Login";
import About from "./pages/About";
import FAQs from "./pages/FAQs";
import Contact from "./pages/Contact";
import Pricing from "./pages/Pricing";
import Onboarding from "./pages/Onboarding";
import Admin from "./pages/Admin";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Cookies from "./pages/Cookies";
import Refunds from "./pages/Refunds";
import DMCA from "./pages/DMCA";
import AcceptableUse from "./pages/AcceptableUse";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/app" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/about" element={<About />} />
          <Route path="/faqs" element={<FAQs />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/cookies" element={<Cookies />} />
          <Route path="/refunds" element={<Refunds />} />
          <Route path="/dmca" element={<DMCA />} />
          <Route path="/acceptable-use" element={<AcceptableUse />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <CookieBanner />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
