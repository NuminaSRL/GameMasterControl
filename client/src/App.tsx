import * as React from 'react';
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import Games from "@/pages/Games";
import Badges from "@/pages/Badges";
import Rewards from "@/pages/Rewards";
import FeltrinelliApiTest from "@/pages/FeltrinelliApiTest";
import FeltrinelliMapping from "@/pages/FeltrinelliMapping";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Unauthorized from "@/pages/Unauthorized";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

// Add import
import LoadingScreen from "@/components/ui/LoadingScreen";

// Protected app content with layout
function ProtectedAppContent() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-gray-100 p-6">
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/games" component={Games} />
            <Route path="/badges" component={Badges} />
            <Route path="/rewards" component={Rewards} />
            <Route path="/api-test" component={FeltrinelliApiTest} />
            <Route path="/feltrinelli-mapping" component={FeltrinelliMapping} />
            <Route component={NotFound} />
          </Switch>
        </main>
      </div>
    </div>
  );
}

// Componente per reindirizzare alla pagina di login
function RedirectToLogin() {
  const [, setLocation] = useLocation();
  React.useEffect(() => {
    setLocation("/login");
  }, [setLocation]);
  return null;
}

function AppContent() {
  const { isLoading } = useAuth();

  // Show loading screen while authentication is being checked
  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/unauthorized" component={Unauthorized} />
      <Route path="/">
        {/* Reindirizza a login per default */}
        <RedirectToLogin />
      </Route>
      <Route path="/:rest*">
        <ProtectedRoute>
          <ProtectedAppContent />
        </ProtectedRoute>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContent />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;