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
import LoadingScreen from "@/components/ui/LoadingScreen";

// Protected app content with layout
function ProtectedAppContent() {
  const [location] = useLocation();
  
  // Aggiungiamo log per debug
  React.useEffect(() => {
    console.log('ProtectedAppContent - Current location:', location);
  }, [location]);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-gray-100 p-6">
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/dashboard" component={Dashboard} />
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

function AppContent() {
  const { isLoading, isAuthenticated } = useAuth();
  const [location] = useLocation();
  
  // Aggiungiamo log per debug
  React.useEffect(() => {
    console.log('AppContent - Current location:', location);
    console.log('AppContent - Authentication status:', isAuthenticated ? 'authenticated' : 'not authenticated');
  }, [location, isAuthenticated]);

  // Show loading screen while authentication is being checked
  if (isLoading) {
    return <LoadingScreen />;
  }

  // Semplifichiamo la logica di routing
  return (
    <Switch>
      <Route path="/login">
        {isAuthenticated ? <ProtectedAppContent /> : <Login />}
      </Route>
      <Route path="/register">
        {isAuthenticated ? <ProtectedAppContent /> : <Register />}
      </Route>
      <Route path="/unauthorized" component={Unauthorized} />
      <Route path="/dashboard">
        {isAuthenticated ? <ProtectedAppContent /> : <Login />}
      </Route>
      <Route path="/games">
        {isAuthenticated ? <ProtectedAppContent /> : <Login />}
      </Route>
      <Route path="/badges">
        {isAuthenticated ? <ProtectedAppContent /> : <Login />}
      </Route>
      <Route path="/rewards">
        {isAuthenticated ? <ProtectedAppContent /> : <Login />}
      </Route>
      <Route path="/api-test">
        {isAuthenticated ? <ProtectedAppContent /> : <Login />}
      </Route>
      <Route path="/feltrinelli-mapping">
        {isAuthenticated ? <ProtectedAppContent /> : <Login />}
      </Route>
      <Route path="/">
        {isAuthenticated ? <ProtectedAppContent /> : <Login />}
      </Route>
      <Route component={NotFound} />
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
