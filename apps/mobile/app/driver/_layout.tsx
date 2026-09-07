import { DriverTabs } from "../../src/components/driver-tabs";
import { RoleGuard } from "../../src/components/role-guard";
import { KnownDriverRealtime } from "../../src/hooks/use-known-driver-realtime";

export default function DriverLayout() {
  return (
    <RoleGuard role="driver">
      <KnownDriverRealtime role="driver" />
      <DriverTabs />
    </RoleGuard>
  );
}
