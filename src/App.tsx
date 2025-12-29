import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import ErrorBoundary from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import Eventos from "./pages/Eventos";
import EventoDetalle from "./pages/EventoDetalle";
import Checkout from "./pages/Checkout";
import Confirmacion from "./pages/Confirmacion";
import MisEntradas from "./pages/MisEntradas";
import TicketDetalle from "./pages/TicketDetalle";
import ComoFunciona from "./pages/ComoFunciona";
import Ayuda from "./pages/Ayuda";
import Favoritos from "./pages/Favoritos";
import Dashboard from "./pages/admin/Dashboard";
import EventsList from "./pages/admin/EventsList";
import EventForm from "./pages/admin/EventForm";
import EventStats from "./pages/admin/EventStats";
import Metrics from "./pages/admin/Metrics";
import UsersList from "./pages/admin/UsersList";
import Tracking from "./pages/admin/Tracking";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CompleteRegistration from "./pages/CompleteRegistration";
import NotFound from "./pages/NotFound";
import VendedorDashboard from "./pages/vendedor/Dashboard";
import PorteroScan from "./pages/portero/Scan";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000,
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
            <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/eventos" element={<Eventos />} />
            <Route path="/evento/:id" element={<EventoDetalle />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/confirmacion" element={<Confirmacion />} />
            <Route path="/mis-entradas" element={<MisEntradas />} />
            <Route path="/entrada/:id" element={<TicketDetalle />} />
            <Route path="/como-funciona" element={<ComoFunciona />} />
            <Route path="/ayuda" element={<Ayuda />} />
            <Route path="/favoritos" element={<Favoritos />} />
            <Route path="/complete-registration" element={<CompleteRegistration />} />
            
            {/* Admin routes */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute requireOrganizer>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/events"
              element={
                <ProtectedRoute requireOrganizer>
                  <EventsList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/events/new"
              element={
                <ProtectedRoute requireOrganizer>
                  <EventForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/events/:id/edit"
              element={
                <ProtectedRoute requireOrganizer>
                  <EventForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/events/:id"
              element={
                <ProtectedRoute requireOrganizer>
                  <EventStats />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/metrics"
              element={
                <ProtectedRoute requireOrganizer>
                  <Metrics />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute requireAdmin>
                  <UsersList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/tracking"
              element={
                <ProtectedRoute requireOrganizer>
                  <Tracking />
                </ProtectedRoute>
              }
            />
            
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Vendedor routes */}
            <Route
              path="/vendedor/dashboard"
              element={
                <ProtectedRoute>
                  <VendedorDashboard />
                </ProtectedRoute>
              }
            />
            
            {/* Portero routes */}
            <Route
              path="/portero/scan"
              element={
                <ProtectedRoute>
                  <PorteroScan />
                </ProtectedRoute>
              }
            />
            
            <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
