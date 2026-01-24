import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ArrowRight, Menu, ChevronUp } from "lucide-react";
import { Link } from "wouter";

import { HeroSection } from "@/components/HeroSection";
import { FeaturesSection } from "@/components/FeaturesSection";
import { TestimonialsSection } from "@/components/TestimonialsSection";
import { PricingSection } from "@/components/PricingSection";
import { FooterSection } from "@/components/FooterSection";

import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";

function Wordmark() {
  return (
    <div className="flex items-center gap-3">
      {/* Neutral brand glyph (placeholder until you finalize real logo) */}
      <div
        className="h-8 w-8 rounded-xl bg-primary/15 ring-1 ring-primary/25"
        aria-hidden="true"
      />
      <span className="text-lg font-semibold tracking-tight">InnerTruth</span>
    </div>
  );
}

function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

export default function Home() {
  const { toast } = useToast();
  const { user } = useAuth();

  const [activeSection, setActiveSection] = useState<"top" | "features" | "pricing">("top");
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    document.documentElement.style.scrollBehavior = "smooth";
    return () => {
      document.documentElement.style.scrollBehavior = "";
    };
  }, []);

  useEffect(() => {
    const featuresEl = document.getElementById("features");
    const pricingEl = document.getElementById("pricing");
    if (!featuresEl || !pricingEl) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0))[0];

        if (!visible) return;

        if (visible.target.id === "features") setActiveSection("features");
        if (visible.target.id === "pricing") setActiveSection("pricing");
      },
      {
        root: null,
        threshold: [0.2, 0.35, 0.5],
      }
    );

    observer.observe(featuresEl);
    observer.observe(pricingEl);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY || 0;
      setShowBackToTop(y > 600);

      const featuresEl = document.getElementById("features");
      if (!featuresEl) return;

      const featuresTop = featuresEl.getBoundingClientRect().top + window.scrollY;
      if (y < featuresTop - 200) setActiveSection("top");
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      toast({
        title: "Signed out",
        description: "You’ve been logged out.",
      });
      window.location.href = "/";
    },
    onError: (error: any) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const navLinkClass = useMemo(() => {
    return (isActive: boolean) =>
      [
        "relative px-2 py-1 text-sm font-medium transition-colors",
        "text-muted-foreground hover:text-foreground",
        isActive ? "text-foreground" : "",
        // underline indicator
        "after:absolute after:left-0 after:-bottom-2 after:h-[2px] after:w-full after:rounded-full after:transition-opacity",
        isActive ? "after:bg-primary after:opacity-100" : "after:bg-primary after:opacity-0 hover:after:opacity-50",
        // focus ring
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      ].join(" ");
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Wordmark />

          {/* Desktop Nav + CTAs */}
          <div className="hidden md:flex items-center gap-4">
            <button
              type="button"
              className={navLinkClass(activeSection === "features")}
              onClick={() => scrollToId("features")}
              data-testid="button-nav-features"
            >
              Features
            </button>

            <button
              type="button"
              className={navLinkClass(activeSection === "pricing")}
              onClick={() => scrollToId("pricing")}
              data-testid="button-nav-pricing"
            >
              Pricing
            </button>

            <div className="h-6 w-px bg-border mx-1" />

            {user ? (
              <div className="flex items-center gap-3">
                <Button asChild size="sm" data-testid="button-enter-app">
                  <Link href="/dashboard">
                    Enter App <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => logoutMutation.mutate()}
                  disabled={logoutMutation.isPending}
                  data-testid="button-logout"
                >
                  {logoutMutation.isPending ? "Signing out…" : "Log out"}
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Button asChild variant="outline" size="sm" data-testid="button-login-outline">
                  <a href="/api/login" aria-label="Sign in">
                    Sign In
                  </a>
                </Button>

                <Button asChild size="sm" data-testid="button-login">
                  <a href="/api/login" aria-label="Get started">
                    Get Started <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" aria-label="Open menu" data-testid="button-mobile-menu">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>

              <SheetContent side="right" className="w-[320px]">
                <div className="space-y-6 pt-6">
                  <div className="space-y-2">
                    <button
                      className={`block w-full text-left text-sm font-medium hover:underline ${
                        activeSection === "features" ? "text-foreground" : "text-muted-foreground"
                      }`}
                      onClick={() => scrollToId("features")}
                      data-testid="button-mobile-features"
                    >
                      Features
                    </button>

                    <button
                      className={`block w-full text-left text-sm font-medium hover:underline ${
                        activeSection === "pricing" ? "text-foreground" : "text-muted-foreground"
                      }`}
                      onClick={() => scrollToId("pricing")}
                      data-testid="button-mobile-pricing"
                    >
                      Pricing
                    </button>
                  </div>

                  <div className="h-px bg-border" />

                  <div className="space-y-2">
                    {user ? (
                      <>
                        <Button asChild className="w-full" data-testid="button-mobile-enter-app">
                          <Link href="/dashboard">
                            Enter App <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>

                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => logoutMutation.mutate()}
                          disabled={logoutMutation.isPending}
                          data-testid="button-mobile-logout"
                        >
                          {logoutMutation.isPending ? "Signing out…" : "Log out"}
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button asChild variant="outline" className="w-full" data-testid="button-mobile-signin">
                          <a href="/api/login" aria-label="Sign in">
                            Sign In
                          </a>
                        </Button>

                        <Button asChild className="w-full" data-testid="button-mobile-getstarted">
                          <a href="/api/login" aria-label="Get started">
                            Get Started <ArrowRight className="ml-2 h-4 w-4" />
                          </a>
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="space-y-20 pb-20">
        <HeroSection />

        <section id="features" className="scroll-mt-20">
          <FeaturesSection />
        </section>

        <section className="scroll-mt-20">
          <TestimonialsSection />
        </section>

        <section id="pricing" className="scroll-mt-20">
          <PricingSection />
        </section>

        {showBackToTop && (
          <div className="fixed bottom-6 right-6 z-50">
            <Button variant="secondary" className="shadow-md" onClick={scrollToTop} data-testid="button-back-to-top">
              <ChevronUp className="h-4 w-4 mr-2" />
              Back to top
            </Button>
          </div>
        )}

        <FooterSection />
      </main>
    </div>
  );
}
