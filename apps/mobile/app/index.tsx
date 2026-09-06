import { Redirect } from "expo-router";

import { useAuth } from "../src/auth/context";
import { LoadingState } from "../src/components/ui";

export default function Index() {
  const { actor, loading } = useAuth();
  if (loading) return <LoadingState />;
  if (!actor) return <Redirect href="/login" />;
  return <Redirect href={`/${actor.role}`} />;
}
