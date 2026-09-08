import { useQuery } from "@tanstack/react-query";

import { apiRequest } from "../api/client";
import { useAuth } from "../auth/context";
import type {
  DriverDashboard,
  ParentDashboard,
  TeacherDashboard,
} from "../types";

type DashboardByRole = {
  parent: ParentDashboard;
  driver: DriverDashboard;
  teacher: TeacherDashboard;
};

export function useDashboard<R extends keyof DashboardByRole>(role: R) {
  const { actor } = useAuth();
  return useQuery({
    queryKey: ["mobile-dashboard", role, actor?.id],
    queryFn: () =>
      apiRequest<DashboardByRole[R]>(`/api/mobile/dashboard/${role}`),
    enabled: actor?.role === role,
    refetchInterval: 15_000,
  });
}
