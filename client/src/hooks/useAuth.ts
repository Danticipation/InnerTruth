import { useEffect, useMemo, useState } from "react";
import type { Session, User as SupabaseUser } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export interface User {
  id: string;
  email: string | null;
  firstName?: string | null;
  lastName?: string | null;
}

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;

  signInWithMagicLink: (email: string) => Promise<void>;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signUpWithPassword: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

function mapUser(u: SupabaseUser | null): User | null {
  if (!u) return null;
  return { id: u.id, email: u.email ?? null };
}

export function useAuth(): AuthContextType {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const boot = async () => {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase.auth.getSession();
      if (!mounted) return;

      if (error) {
        setError(error.message);
        setSession(null);
        setUser(null);
        setIsLoading(false);
        return;
      }

      setSession(data.session ?? null);
      setUser(mapUser(data.session?.user ?? null));
      setIsLoading(false);
    };

    boot();

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
        setUser(mapUser(newSession?.user ?? null));
      }
    );

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const isAuthenticated = useMemo(() => !!session?.user, [session]);

  const signInWithMagicLink = async (email: string) => {
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) throw error;
  };

  const signInWithPassword = async (email: string, password: string) => {
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const signUpWithPassword = async (email: string, password: string) => {
    setError(null);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    setError(null);
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return {
    user,
    session,
    isLoading,
    isAuthenticated,
    error,
    signInWithMagicLink,
    signInWithPassword,
    signUpWithPassword,
    signOut,
  };
}
