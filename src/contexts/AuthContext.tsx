import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Admin role is read from `app_metadata.role` which can only be set server-side
 * (SQL / service role), so regular users cannot promote themselves.
 */
const checkIsAdmin = (user: User | null | undefined): boolean =>
  user?.app_metadata?.role === "admin";

const signIn = async (email: string, password: string) => {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
};

const signOut = async () => {
  await supabase.auth.signOut();
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fires INITIAL_SESSION on subscribe, so no separate getSession() call needed
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
        setLoading(false);
      },
    );
    return () => listener.subscription.unsubscribe();
  }, []);

  // Memoize so consumers only re-render when auth state actually changes
  const value = useMemo<AuthContextValue>(() => {
    const user = session?.user ?? null;
    return { session, user, isAdmin: checkIsAdmin(user), loading, signIn, signOut };
  }, [session, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};
