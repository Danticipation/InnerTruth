import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { OnboardingGuard } from "@/components/OnboardingGuard";
import Landing from "@/pages/Landing";
import Home from "@/pages/Home";
import Dashboard from "@/pages/Dashboard";
import Chat from "@/pages/Chat";
import Journal from "@/pages/Journal";
import Insights from "@/pages/Insights";
import PersonalityReflection from "@/pages/PersonalityReflection";
import IntakeAssessment from "@/pages/IntakeAssessment";
import Profile from "@/pages/Profile";
import CategoryOnboarding from "@/pages/CategoryOnboarding";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  // Show landing page while loading or if not authenticated
  if (isLoading || !isAuthenticated) {
    return <Route path="/" component={Landing} />;
  }

  // Show protected routes only for authenticated users
  return (
    <OnboardingGuard>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/onboarding" component={CategoryOnboarding} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/chat" component={Chat} />
        <Route path="/journal" component={Journal} />
        <Route path="/insights" component={Insights} />
        <Route path="/reflection" component={PersonalityReflection} />
        <Route path="/personality" component={PersonalityReflection} />
        <Route path="/assessment" component={IntakeAssessment} />
        <Route path="/profile" component={Profile} />
        <Route component={NotFound} />
      </Switch>
    </OnboardingGuard>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
