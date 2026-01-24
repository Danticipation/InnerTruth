import { Button } from "@/components/ui/button";
import { ArrowRight, Shield } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";

import heroBg from "/assets/blurred-geometry-1.jpg";

export function HeroSection() {
  const { isAuthenticated } = useAuth();

  return (
    <section className="mx-auto max-w-5xl px-6">
      <div className="relative mt-8 overflow-hidden rounded-3xl border bg-card">
        {/* Background */}
        <div className="absolute inset-0">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${heroBg})` }}
          />
          {/* Dim */}
          <div className="absolute inset-0 bg-black/55" />
          {/* Vignette */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/75" />
        </div>

        {/* Content */}
        <div className="relative z-10 grid gap-10 px-6 py-14 lg:grid-cols-2 lg:items-center lg:px-12">
          {/* Left: headline/copy */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/80">
              AI-powered self-awareness • Built for honesty
            </div>

            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Discover your blind spots.
            </h1>

            <p className="mt-4 text-lg text-white/85">
              InnerTruth analyzes your conversations and journal entries to surface patterns, defenses, and relationship
              dynamics — then gives you actionable experiments to change them.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
              {isAuthenticated ? (
                <Button asChild size="lg" className="w-full sm:w-auto" data-testid="button-hero-cta">
                  <Link href="/dashboard">
                    Go to Dashboard <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              ) : (
                <Button asChild size="lg" className="w-full sm:w-auto" data-testid="button-hero-cta">
                  <Link href="/auth">
                    Start your journey <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              )}

              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto bg-white/10 border-white/25 text-white hover:bg-white/20"
                onClick={() => {
                  document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
                }}
                data-testid="button-hero-secondary"
              >
                See features
              </Button>
            </div>

            <div className="mt-6 flex items-center justify-center gap-2 text-sm text-white/75 lg:justify-start">
              <Shield className="h-4 w-4" />
              <span>Private by design. You control your data.</span>
            </div>
          </div>

          {/* Right: “What you get” panel */}
          <div className="flex justify-center lg:justify-end">
            <div className="w-full max-w-md rounded-2xl border border-white/15 bg-black/30 p-6 shadow-lg backdrop-blur-md">
              <h2 className="text-base font-semibold text-white">What InnerTruth gives you</h2>

              <ul className="mt-4 space-y-3 text-sm text-white/85">
                <li className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-white/70" />
                  <span>
                    <strong className="text-white">Blind spots</strong> you can’t see — with evidence from your own
                    words.
                  </span>
                </li>

                <li className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-white/70" />
                  <span>
                    <strong className="text-white">Patterns</strong> in how you handle stress, conflict, and intimacy.
                  </span>
                </li>

                <li className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-white/70" />
                  <span>
                    <strong className="text-white">Actionable experiments</strong> — small steps that create real change.
                  </span>
                </li>
              </ul>

              <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs text-white/80">
                  This isn’t another “personality quiz.” It’s a mirror built from your real behavior — so you can grow
                  faster.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
