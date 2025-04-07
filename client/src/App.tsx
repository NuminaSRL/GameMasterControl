import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import Games from "@/pages/Games";
import Badges from "@/pages/Badges";
import Rewards from "@/pages/Rewards";
import FeltrinelliApiTest from "@/pages/FeltrinelliApiTest";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

function AppContent() {
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
            <Route component={NotFound} />
          </Switch>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

export default App;
