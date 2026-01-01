import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [mode, setMode] = useState<"magic" | "password">("magic");
  const [isSignUp, setIsSignUp] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const canSubmitMagic = useMemo(() => email.trim().includes("@"), [email]);
  const canSubmitPassword = useMemo(
    () => email.trim().includes("@") && password.length >= 6,
    [email, password]
  );

  useEffect(() => {
    // If user is already signed in, bounce to dashboard.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setLocation("/dashboard");
    });
  }, [setLocation]);

  async function handleMagicLink() {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) throw error;

      toast({
        title: "Check your email",
        description: "We sent you a magic link to sign in.",
      });
    } catch (err: any) {
      toast({
        title: "Sign in failed",
        description: err?.message ?? "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handlePasswordAuth() {
    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;

        toast({
          title: "Account created",
          description: "Check your inbox if email confirmation is enabled.",
        });

        // Don’t redirect immediately if confirmation is required.
        // If confirmation is OFF, session will exist and useAuth will handle redirect via protected routes.
        setLocation("/dashboard");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;

        toast({
          title: "Signed in",
          description: "Welcome back.",
        });

        setLocation("/dashboard");
      }
    } catch (err: any) {
      toast({
        title: "Auth failed",
        description: err?.message ?? "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      toast({
        title: "OAuth failed",
        description: err?.message ?? "Unknown error",
        variant: "destructive",
      });
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign in to InnerTruth</CardTitle>
          <CardDescription>
            Use a magic link, password, or Google to continue.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* OAuth */}
          <Button variant="outline" className="w-full" onClick={handleGoogle} disabled={loading}>
            Continue with Google
          </Button>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* Mode selector */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant={mode === "magic" ? "default" : "outline"}
              className="w-full"
              onClick={() => setMode("magic")}
              disabled={loading}
            >
              Magic Link
            </Button>
            <Button
              type="button"
              variant={mode === "password" ? "default" : "outline"}
              className="w-full"
              onClick={() => setMode("password")}
              disabled={loading}
            >
              Password
            </Button>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium">Email</label>
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              autoComplete="email"
              inputMode="email"
            />
          </div>

          {mode === "password" && (
            <div className="space-y-3">
              <label className="text-sm font-medium">Password</label>
              <Input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                placeholder="Minimum 6 characters"
                autoComplete={isSignUp ? "new-password" : "current-password"}
              />
            </div>
          )}

          {/* Primary action */}
          {mode === "magic" ? (
            <Button className="w-full" onClick={handleMagicLink} disabled={loading || !canSubmitMagic}>
              {loading ? "Sending…" : "Send Magic Link"}
            </Button>
          ) : (
            <div className="space-y-3">
              <Button className="w-full" onClick={handlePasswordAuth} disabled={loading || !canSubmitPassword}>
                {loading ? "Working…" : isSignUp ? "Create Account" : "Sign In"}
              </Button>

              <button
                type="button"
                className="text-sm text-muted-foreground hover:underline w-full text-center"
                onClick={() => setIsSignUp((v) => !v)}
                disabled={loading}
              >
                {isSignUp ? "Already have an account? Sign in" : "New here? Create an account"}
              </button>
            </div>
          )}

          <p className="text-xs text-muted-foreground text-center">
            By continuing, you agree to keep your data private and truthful. (We’ll add real policies later.)
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
