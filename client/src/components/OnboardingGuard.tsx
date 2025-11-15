import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";

/**
 * OnboardingGuard ensures users complete category selection before accessing the app.
 * Redirects to /onboarding if no categories are selected.
 */
export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  
  // Fetch user's selected categories
  const { data: userCategories, isLoading, isError } = useQuery({
    queryKey: ["/api/user-categories"],
    retry: 2, // Retry failed requests twice
  });

  useEffect(() => {
    // Skip onboarding check if already on onboarding page
    if (location === "/onboarding") {
      return;
    }

    // On error, allow access (fail-open to prevent lockout)
    if (isError) {
      return;
    }

    // Redirect to onboarding if no categories selected
    if (!isLoading && (!userCategories || (userCategories as any[]).length === 0)) {
      setLocation("/onboarding");
    }
  }, [userCategories, isLoading, isError, location, setLocation]);

  // Show loading state while checking
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">
      <p className="text-muted-foreground">Loading...</p>
    </div>;
  }

  // Allow access if categories selected or on onboarding page
  return <>{children}</>;
}
