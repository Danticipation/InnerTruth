import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { OnboardingGuard } from "@/components/OnboardingGuard";
import { useAuth } from "@/hooks/useAuth";

import Home from "@/pages/Home";
import AuthPage from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import Chat from "@/pages/Chat";
import Journal from "@/pages/Journal";
import Mood from "@/pages/Mood";
import Insights from "@/pages/Insights";
import PersonalityReflection from "@/pages/PersonalityReflection";
import IntakeAssessment from "@/pages/IntakeAssessment";
import Profile from "@/pages/Profile";
import CategoryOnboarding from "@/pages/CategoryOnboarding";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  // While auth is loading, show Home (it will render header + hero and not break).
  if (isLoading) {
    return (
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/auth" component={AuthPage} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  // Guests get the public landing experience
  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/auth" component={AuthPage} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  // Authenticated users get protected routes.
  return (
    <OnboardingGuard>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/auth" component={AuthPage} />
        <Route path="/onboarding" component={CategoryOnboarding} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/chat" component={Chat} />
        <Route path="/journal" component={Journal} />
        <Route path="/mood" component={Mood} />
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
