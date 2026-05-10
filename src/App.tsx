import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

import Landing from "./pages/Landing";
import About from "./pages/About";
import Auth from "./pages/Auth";
import Terms from "./pages/Terms";
import Services from "./pages/Services";
import ServiceDetail from "./pages/ServiceDetail";
import CustomerDashboard from "./pages/CustomerDashboard";
import Profile from "./pages/Profile";
import BecomeProvider from "./pages/BecomeProvider";
import ProviderOverview from "./pages/provider/ProviderOverview";
import ProviderServices from "./pages/provider/ProviderServices";
import ProviderBookings from "./pages/provider/ProviderBookings";
import ProviderSchedule from "./pages/provider/ProviderSchedule";
import ProviderEarnings from "./pages/provider/ProviderEarnings";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminProviders from "./pages/admin/AdminProviders";
import AdminBookings from "./pages/admin/AdminBookings";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminServices from "./pages/admin/AdminServices";
import AdminWithdrawals from "./pages/admin/AdminWithdrawals";
import AdminDisputes from "./pages/admin/AdminDisputes";
import AdminReviews from "./pages/admin/AdminReviews";
import AdminPayments from "./pages/admin/AdminPayments";
import AdminSettings from "./pages/admin/AdminSettings";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/about" element={<About />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/services" element={<Services />} />
            <Route path="/services/:id" element={<ServiceDetail />} />
            <Route path="/become-provider" element={<ProtectedRoute><BecomeProvider /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><CustomerDashboard /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

            <Route path="/provider" element={<ProtectedRoute requireRole="provider"><ProviderOverview /></ProtectedRoute>} />
            <Route path="/provider/services" element={<ProtectedRoute requireRole="provider"><ProviderServices /></ProtectedRoute>} />
            <Route path="/provider/bookings" element={<ProtectedRoute requireRole="provider"><ProviderBookings /></ProtectedRoute>} />
            <Route path="/provider/schedule" element={<ProtectedRoute requireRole="provider"><ProviderSchedule /></ProtectedRoute>} />
            <Route path="/provider/earnings" element={<ProtectedRoute requireRole="provider"><ProviderEarnings /></ProtectedRoute>} />
            <Route path="/provider/profile" element={<ProtectedRoute requireRole="provider"><BecomeProvider /></ProtectedRoute>} />

            <Route path="/admin" element={<ProtectedRoute requireRole="admin"><AdminOverview /></ProtectedRoute>} />
            <Route path="/admin/providers" element={<ProtectedRoute requireRole="admin"><AdminProviders /></ProtectedRoute>} />
            <Route path="/admin/bookings" element={<ProtectedRoute requireRole="admin"><AdminBookings /></ProtectedRoute>} />
            <Route path="/admin/services" element={<ProtectedRoute requireRole="admin"><AdminServices /></ProtectedRoute>} />
            <Route path="/admin/categories" element={<ProtectedRoute requireRole="admin"><AdminCategories /></ProtectedRoute>} />
            <Route path="/admin/withdrawals" element={<ProtectedRoute requireRole="admin"><AdminWithdrawals /></ProtectedRoute>} />
            <Route path="/admin/payments" element={<ProtectedRoute requireRole="admin"><AdminPayments /></ProtectedRoute>} />
            <Route path="/admin/disputes" element={<ProtectedRoute requireRole="admin"><AdminDisputes /></ProtectedRoute>} />
            <Route path="/admin/reviews" element={<ProtectedRoute requireRole="admin"><AdminReviews /></ProtectedRoute>} />
            <Route path="/admin/settings" element={<ProtectedRoute requireRole="admin"><AdminSettings /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
