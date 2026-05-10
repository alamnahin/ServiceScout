import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "provider" | "customer";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  roles: AppRole[];
  loading: boolean;
  signOut: () => Promise<void>;
  refreshRoles: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  // FIX: fetchRoles is now a stable callback so it can be used in effects safely
  const fetchRoles = useCallback(async (uid: string) => {
    try {
      const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", uid);
      if (error) throw error;
      setRoles((data?.map((r) => r.role as AppRole)) ?? []);
    } catch (err) {
      console.error("[AuthContext] fetchRoles error:", err);
      setRoles([]);
    }
  }, []);

  useEffect(() => {
    let initialised = false;

    // FIX: Get existing session FIRST, then subscribe to changes.
    // Original code had a race condition where the subscription could fire
    // before the initial getSession(), causing loading to never resolve.
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);

      const afterRoles = () => { setLoading(false); initialised = true; };

      if (s?.user) {
        fetchRoles(s.user.id).finally(afterRoles);
      } else {
        afterRoles();
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);

      if (s?.user) {
        // FIX: removed setTimeout hack. fetchRoles is now a stable ref.
        fetchRoles(s.user.id).finally(() => {
          if (!initialised) { setLoading(false); initialised = true; }
        });
      } else {
        setRoles([]);
        if (!initialised) { setLoading(false); initialised = true; }
      }
    });

    return () => sub.subscription.unsubscribe();
  }, [fetchRoles]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setRoles([]);
    setUser(null);
    setSession(null);
  };

  const refreshRoles = useCallback(async () => {
    if (user) await fetchRoles(user.id);
  }, [user, fetchRoles]);

  return (
    <AuthContext.Provider value={{ user, session, roles, loading, signOut, refreshRoles }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
