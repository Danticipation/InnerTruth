import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, BookOpen, BarChart3, MessageCircle, Shield } from "lucide-react";

import heroBg from "/assets/blurred-geometry-1.jpg";

function Wordmark() {
  return (
    <div className="flex items-center gap-3">
      {/* Neutral mark (not a “logo”, just a placeholder brand glyph) */}
      <div className="h-8 w-8 rounded-xl bg-primary/15 ring-1 ring-primary/25" />
      <span className="text-lg font-semibold tracking-tight">InnerTruth</span>
    </div>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
          <Wordmark />

          <div className="flex items-center gap-3">
            <Button asChild variant="outline" size="sm" data-testid="button-login-outline">
              <a href="/auth">Sign In</a>
            </Button>

            <Button asChild size="sm" data-testid="button-login">
              <a href="/auth">
                Get Started <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6">
        {/* Hero */}
        <section className="relative mt-8 overflow-hidden rounded-3xl border bg-card">
          {/* Background */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${heroBg})` }} />
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
                InnerTruth analyzes your conversations and journal entries to surface patterns, defenses, and
                relationship dynamics — then gives you actionable experiments to change them.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
                <Button asChild size="lg" className="w-full sm:w-auto" data-testid="button-hero-cta">
                  <a href="/auth">
                    Start your journey <ArrowRight className="ml-2 h-5 w-5" />
                  </a>
                </Button>

                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto bg-white/10 border-white/25 text-white hover:bg-white/20"
                  data-testid="button-hero-secondary"
                >
                  <a href="#features">See features</a>
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
        </section>

        {/* Features */}
        <section id="features" className="py-14">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader>
                <MessageCircle className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-lg">Deep Conversations</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Chat with an AI analyst that challenges your thinking and reveals your patterns.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <BookOpen className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-lg">Private Journal</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Reflect daily and uncover patterns in your thoughts, emotions, and reactions.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <BarChart3 className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-lg">Personality Reflection</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Big 5 traits, strengths, blind spots, and relationship dynamics — updated over time.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Shield className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-lg">Privacy First</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Your data is private. Only you can access your insights. No selling your personal life.
                </CardDescription>
              </CardContent>
            </Card>
          </div>

          {/* Privacy block */}
          <div className="mt-10 rounded-2xl border bg-muted/50 p-6">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">Privacy First:</strong> Your conversations, journals, and insights are
              private. Only you can access your data. We use AI to help you understand yourself better — not to judge
              you or share your information.
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t py-10">
          <div className="text-center text-sm text-muted-foreground">
            <p>InnerTruth • Your honest AI personality analyst</p>
          </div>
        </footer>
      </main>
    </div>
  );
}
