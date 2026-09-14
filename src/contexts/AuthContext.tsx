import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  isLoading: boolean;
  signUp: (email: string, password: string, fullName: string, role: AppRole) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const AUTH_REQUEST_TIMEOUT_MS = 8000;

/** Prevent a slow/unreachable Supabase request from blocking the entire SPA forever. */
async function withTimeout<T>(promise: Promise<T>, timeoutMs = AUTH_REQUEST_TIMEOUT_MS): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error("Authentication request timed out")), timeoutMs);
    }),
  ]);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUserRole = async (userId: string) => {
    try {
      const { data: roleData, error } = await withTimeout(
        supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
      );

      if (error) {
        console.error("Failed to load user role:", error);
        setRole(null);
        return;
      }

      // Users can have multiple roles. Admin takes priority so an account
      // with both "admin" and "freelancer" is treated as an administrator.
      const roles = (roleData ?? []).map((item) => item.role as AppRole);
      const resolvedRole: AppRole | null =
        roles.includes("admin")
          ? "admin"
          : roles.includes("client")
            ? "client"
            : roles.includes("freelancer")
              ? "freelancer"
              : null;

      setRole(resolvedRole);
    } catch (error) {
      console.error("Failed to load user role:", error);
      setRole(null);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session } } = await withTimeout(supabase.auth.getSession());

        if (!mounted) return;

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          await loadUserRole(session.user.id);
        } else {
          setRole(null);
        }
      } catch (error) {
        console.error("Failed to initialize authentication:", error);
        if (mounted) {
          setSession(null);
          setUser(null);
          setRole(null);
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!mounted) return;

        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(true);

        // Do not await Supabase/network work inside the auth event callback.
        // This prevents auth events from being blocked by a slow role query.
        if (session?.user) {
          void loadUserRole(session.user.id).finally(() => {
            if (mounted) setIsLoading(false);
          });
        } else {
          setRole(null);
          setIsLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, fullName: string, role: AppRole) => {
    try {
      const { error } = await withTimeout(
        supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: {
              full_name: fullName,
              role: role,
            },
          },
        })
      );
      return { error: error as Error | null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await withTimeout(
        supabase.auth.signInWithPassword({
          email,
          password,
        })
      );
      return { error: error as Error | null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    try {
      await withTimeout(supabase.auth.signOut());
    } finally {
      setUser(null);
      setSession(null);
      setRole(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, role, isLoading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
