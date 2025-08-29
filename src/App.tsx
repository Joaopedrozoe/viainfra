
import { lazy, Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/auth";
import { PrivateRoute } from "@/components/auth/PrivateRoute";

// Import Login and Register eagerly to avoid lazy-loading issues
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";

// Landing
const Landing = lazy(() => import("@/pages/landing/Landing"));

// App
const Dashboard = lazy(() => import("@/pages/app/Dashboard"));
const Inbox = lazy(() => import("@/pages/app/Inbox"));
const Channels = lazy(() => import("@/pages/app/Channels"));
const Agents = lazy(() => import("@/pages/app/Agents"));
const AgentDetails = lazy(() => import("@/pages/app/AgentDetails"));
const Widget = lazy(() => import("@/pages/app/Widget"));
const Schedule = lazy(() => import("@/pages/app/Schedule"));
const Integrations = lazy(() => import("@/pages/app/Integrations"));
const ApiDocs = lazy(() => import("@/pages/app/ApiDocs")); 
const Settings = lazy(() => import("@/pages/app/Settings"));
const Help = lazy(() => import("@/pages/app/Help"));
const ContactDetails = lazy(() => import("@/pages/app/ContactDetails"));
const Contacts = lazy(() => import("@/pages/app/Contacts"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const PublicBooking = lazy(() => import("@/pages/public/PublicBooking"));

// Redirect component for /ai to /agents
const AIRedirect = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    navigate('/agents', { replace: true });
  }, [navigate, location]);
  
  return null;
};

// Loading fallback
const LoadingFallback = () => (
  <div className="flex items-center justify-center h-screen w-screen bg-gray-50">
    <div className="w-16 h-16 border-4 border-bonina border-solid rounded-full border-t-transparent animate-spin"></div>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              {/* Landing Routes */}
              <Route path="/" element={<Landing />} />
              
              {/* Auth Routes - Not lazy loaded */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Protected App Routes */}
              <Route element={<PrivateRoute />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/inbox" element={<Inbox />} />
                <Route path="/channels" element={<Channels />} />
                <Route path="/contacts" element={<Contacts />} />
                <Route path="/ai" element={<AIRedirect />} />
                <Route path="/agents" element={<Agents />} />
                <Route path="/agents/:id" element={<AgentDetails />} />
                <Route path="/widget" element={<Widget />} />
                <Route path="/schedule" element={<Schedule />} />
                <Route path="/integrations" element={<Integrations />} />
                <Route path="/api-docs" element={<ApiDocs />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/help" element={<Help />} />
                <Route path="/contacts/:id" element={<ContactDetails />} />
              </Route>
              
              {/* Public Routes */}
              <Route path="/agendar/:companyId" element={<PublicBooking />} />
              
              {/* 404 Route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </TooltipProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
