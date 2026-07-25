import { useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { apiRequest, login as loginRequest, logout as logoutRequest } from "../api/client";
import { getAccessToken } from "../api/tokens";
import { stopDriverTracking } from "../services/location";
import { initializeMobileNotifications, unregisterMobileNotifications } from "../services/notifications";
import type { MobileActor, MobileRole } from "../types";

type AuthContextValue = {
  actor: MobileActor | null;
  loading: boolean;
  signIn(input: {
    email: string;
    password: string;
    role: MobileRole;
  }): Promise<void>;
  signOut(): Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [actor, setActor] = useState<MobileActor | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    void (async () => {
      try {
        if (!(await getAccessToken())) return;
        const data = await apiRequest<{ user: MobileActor }>("/api/mobile/me");
        setActor(data.user);
        await initializeMobileNotifications(data.user);
      } catch {
        setActor(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      actor,
      loading,
      async signIn(input) {
        const nextActor = await loginRequest(input);
        setActor(nextActor);
        await initializeMobileNotifications(nextActor);
      },
      async signOut() {
        await stopDriverTracking();
        await unregisterMobileNotifications();
        await logoutRequest();
        queryClient.clear();
        setActor(null);
      },
    }),
    [actor, loading, queryClient]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
