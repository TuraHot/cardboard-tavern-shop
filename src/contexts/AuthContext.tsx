import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { SessionTimeoutModal } from "../components/SessionTimeoutModal";

// 15 minutes of inactivity before auto-logout
export const IDLE_TIMEOUT_MS = 15 * 60 * 1000;
// Show warning modal 60 seconds before auto-logout
export const WARNING_BEFORE_MS = 60 * 1000;

export const CB_LAST_ACTIVE_KEY = "cb_tavern_last_active";
export const CB_REMEMBER_ME_KEY = "cb_tavern_remember_me";
export const CB_LOGOUT_REASON_KEY = "cb_tavern_logout_reason";
export const CB_SESSION_COOKIE = "cb_tavern_session_active";

export interface AuthContextValue {
  session: Session | null;
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  isTimeoutWarningOpen: boolean;
  secondsRemaining: number;
  logoutReason: string | null;
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  signOut: (reason?: string) => Promise<void>;
  extendSession: () => void;
  clearLogoutReason: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Cookie helpers for Pure Session / Browser-close detection.
 * A cookie without Expires / Max-Age is a session cookie that the browser
 * automatically clears when all browser windows are closed.
 */
const setSessionCookie = () => {
  if (typeof document === "undefined") return;
  document.cookie = `${CB_SESSION_COOKIE}=1; path=/; SameSite=Lax`;
};

const clearSessionCookie = () => {
  if (typeof document === "undefined") return;
  document.cookie = `${CB_SESSION_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
};

const hasSessionCookie = (): boolean => {
  if (typeof document === "undefined") return false;
  return document.cookie
    .split("; ")
    .some((item) => item.startsWith(`${CB_SESSION_COOKIE}=`));
};

const recordActivity = () => {
  if (typeof window === "undefined") return;
  localStorage.setItem(CB_LAST_ACTIVE_KEY, Date.now().toString());
};

const getLastActiveTime = (): number => {
  if (typeof window === "undefined") return Date.now();
  const val = localStorage.getItem(CB_LAST_ACTIVE_KEY);
  if (!val) return Date.now();
  const parsed = parseInt(val, 10);
  return isNaN(parsed) ? Date.now() : parsed;
};

/**
 * Admin role is read from `app_metadata.role` which can only be set server-side
 * (SQL / service role), so regular users cannot promote themselves.
 */
const checkIsAdmin = (user: User | null | undefined): boolean =>
  user?.app_metadata?.role === "admin";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Idle timeout state
  const [isTimeoutWarningOpen, setIsTimeoutWarningOpen] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(60);

  // Logout reason for notifying user (e.g. 'idle_timeout' | 'browser_closed')
  const [logoutReason, setLogoutReason] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return sessionStorage.getItem(CB_LOGOUT_REASON_KEY);
  });

  const clearLogoutReason = useCallback(() => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(CB_LOGOUT_REASON_KEY);
    }
    setLogoutReason(null);
  }, []);

  const signOut = useCallback(
    async (reason?: string) => {
      const validReason = typeof reason === "string" ? reason : undefined;
      if (typeof window !== "undefined") {
        if (validReason) {
          sessionStorage.setItem(CB_LOGOUT_REASON_KEY, validReason);
          setLogoutReason(validReason);
        } else {
          sessionStorage.removeItem(CB_LOGOUT_REASON_KEY);
          setLogoutReason(null);
        }
        localStorage.removeItem(CB_LAST_ACTIVE_KEY);
        clearSessionCookie();
      }
      setIsTimeoutWarningOpen(false);

      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.error("Sign out error", err);
      }
    },
    [],
  );

  const signIn = useCallback(
    async (email: string, password: string, rememberMe = false) => {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;

      if (typeof window !== "undefined") {
        localStorage.setItem(CB_REMEMBER_ME_KEY, rememberMe ? "true" : "false");
        if (!rememberMe) {
          setSessionCookie();
        } else {
          clearSessionCookie();
        }
        recordActivity();
        sessionStorage.removeItem(CB_LOGOUT_REASON_KEY);
      }
      setLogoutReason(null);
      setIsTimeoutWarningOpen(false);
    },
    [],
  );

  const extendSession = useCallback(() => {
    recordActivity();
    setIsTimeoutWarningOpen(false);
    setSecondsRemaining(Math.ceil(WARNING_BEFORE_MS / 1000));
  }, []);

  // Listen to Supabase auth state change
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
        setLoading(false);

        if (newSession?.user) {
          // If we just received an active session, ensure last active is recorded
          const existingLastActive = localStorage.getItem(CB_LAST_ACTIVE_KEY);
          if (!existingLastActive) {
            recordActivity();
          }
        }
      },
    );
    return () => listener.subscription.unsubscribe();
  }, []);

  // Initial check on mount: Browser close & Inactivity validation
  useEffect(() => {
    if (loading) return;
    if (!session?.user) return;

    // 1. Check "Remember Me = false" and session cookie
    const rememberMe = localStorage.getItem(CB_REMEMBER_ME_KEY);
    if (rememberMe === "false") {
      if (!hasSessionCookie()) {
        // Browser was closed! Automatically sign out
        signOut("browser_closed");
        return;
      }
    }

    // 2. Check if already inactive past IDLE_TIMEOUT_MS
    const lastActive = getLastActiveTime();
    const elapsed = Date.now() - lastActive;
    if (elapsed >= IDLE_TIMEOUT_MS) {
      signOut("idle_timeout");
    }
  }, [loading, session, signOut]);

  // Keep ref for warning open state to avoid closure staleness in listeners
  const isWarningOpenRef = useRef(isTimeoutWarningOpen);
  isWarningOpenRef.current = isTimeoutWarningOpen;

  // Activity tracking and Inactivity timer (runs only when user is logged in)
  useEffect(() => {
    if (!session?.user) {
      setIsTimeoutWarningOpen(false);
      return;
    }

    // Throttle user activity recording to avoid excessive localStorage writes (at most once every 5s)
    let lastRecorded = 0;
    const handleUserActivity = () => {
      // If the timeout warning modal is currently shown, do NOT auto-reset from passive mouse movement
      // User must explicitly click "ใช้งานต่อ" or press keyboard to dismiss modal
      if (isWarningOpenRef.current) return;

      const now = Date.now();
      if (now - lastRecorded > 5000) {
        lastRecorded = now;
        recordActivity();
      }
    };

    const activityEvents = [
      "pointerdown",
      "mousemove",
      "keydown",
      "touchstart",
      "scroll",
      "wheel",
    ];

    activityEvents.forEach((ev) =>
      window.addEventListener(ev, handleUserActivity, { passive: true }),
    );

    // Cross-tab synchronization via storage event
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === CB_LAST_ACTIVE_KEY) {
        // Another tab was active! Reset warning modal
        setIsTimeoutWarningOpen(false);
      } else if (e.key === CB_LOGOUT_REASON_KEY && e.newValue) {
        // Another tab logged out
        setLogoutReason(e.newValue);
      }
    };
    window.addEventListener("storage", handleStorageChange);

    // Visibility / focus listener: Catch laptop sleep / background tab resume
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === "visible") {
        const last = getLastActiveTime();
        const elapsed = Date.now() - last;
        if (elapsed >= IDLE_TIMEOUT_MS) {
          signOut("idle_timeout");
        } else if (elapsed >= IDLE_TIMEOUT_MS - WARNING_BEFORE_MS) {
          const remainingSec = Math.max(1, Math.ceil((IDLE_TIMEOUT_MS - elapsed) / 1000));
          setSecondsRemaining(remainingSec);
          setIsTimeoutWarningOpen(true);
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityOrFocus);
    window.addEventListener("focus", handleVisibilityOrFocus);

    // 1-second interval to check elapsed idle time
    const timerInterval = setInterval(() => {
      const last = getLastActiveTime();
      const elapsed = Date.now() - last;
      const remainingMs = IDLE_TIMEOUT_MS - elapsed;

      if (remainingMs <= 0) {
        signOut("idle_timeout");
      } else if (remainingMs <= WARNING_BEFORE_MS) {
        setIsTimeoutWarningOpen(true);
        setSecondsRemaining(Math.max(1, Math.ceil(remainingMs / 1000)));
      } else {
        setIsTimeoutWarningOpen(false);
      }
    }, 1000);

    return () => {
      activityEvents.forEach((ev) =>
        window.removeEventListener(ev, handleUserActivity),
      );
      window.removeEventListener("storage", handleStorageChange);
      document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
      window.removeEventListener("focus", handleVisibilityOrFocus);
      clearInterval(timerInterval);
    };
  }, [session, signOut]);

  // Memoize context value
  const value = useMemo<AuthContextValue>(() => {
    const user = session?.user ?? null;
    return {
      session,
      user,
      isAdmin: checkIsAdmin(user),
      loading,
      isTimeoutWarningOpen,
      secondsRemaining,
      logoutReason,
      signIn,
      signOut,
      extendSession,
      clearLogoutReason,
    };
  }, [
    session,
    loading,
    isTimeoutWarningOpen,
    secondsRemaining,
    logoutReason,
    signIn,
    signOut,
    extendSession,
    clearLogoutReason,
  ]);

  return (
    <AuthContext.Provider value={value}>
      {children}
      {session?.user && (
        <SessionTimeoutModal
          isOpen={isTimeoutWarningOpen}
          secondsRemaining={secondsRemaining}
          onExtend={extendSession}
          onSignOut={() => signOut("manual")}
        />
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};
