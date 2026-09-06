import { Redirect } from "expo-router";

import { useAuth } from "../auth/context";
import type { MobileRole } from "../types";
import { LoadingState } from "./ui";

export function RoleGuard({
  role,
  children,
}: {
  role: MobileRole;
  children: React.ReactNode;
}) {
  const { actor, loading } = useAuth();
  if (loading) return <LoadingState />;
  if (!actor) return <Redirect href="/login" />;
  if (actor.role !== role) return <Redirect href={`/${actor.role}`} />;
  return children;
}
