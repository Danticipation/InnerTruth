import { useEffect, useMemo, useState } from "react";
import type { Session, User as SupabaseUser } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { queryClient, SESSION_QUERY_KEY } from "@/lib/queryClient";

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

      // Use queryClient to get cached session or fetch new one
      const session = await queryClient.fetchQuery({
        queryKey: SESSION_QUERY_KEY,
        queryFn: async () => {
          const { data, error } = await supabase.auth.getSession();
          if (error) throw error;
          return data.session;
        },
        staleTime: 1000 * 60 * 5,
      }).catch(err => {
        if (mounted) setError(err.message);
        return null;
      });

      if (!mounted) return;

      setSession(session);
      setUser(mapUser(session?.user ?? null));
      setIsLoading(false);
    };

    boot();

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
        setUser(mapUser(newSession?.user ?? null));
        // Sync with queryClient session cache
        queryClient.setQueryData(SESSION_QUERY_KEY, newSession);
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
