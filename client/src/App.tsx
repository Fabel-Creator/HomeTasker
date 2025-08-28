import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { PWAInstallBanner } from "@/components/pwa-install-banner";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import JoinHousehold from "@/pages/join-household";
import GuestJoin from "@/pages/guest-join";
import LocalAdmin from "@/pages/local-admin";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/guest" component={GuestJoin} />
      <Route path="/local-admin" component={LocalAdmin} />
      {!isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : !(user as any)?.householdId ? (
        <Route path="/" component={JoinHousehold} />
      ) : (
        <Route path="/" component={Home} />
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="haushalts-app-theme">
        <TooltipProvider>
          <PWAInstallBanner />
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
