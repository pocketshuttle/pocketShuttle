import { ParentTabs } from "../../src/components/parent-tabs";
import { RoleGuard } from "../../src/components/role-guard";
import { KnownDriverRealtime } from "../../src/hooks/use-known-driver-realtime";

export default function ParentLayout() {
  return (
    <RoleGuard role="parent">
      <KnownDriverRealtime role="parent" />
      <ParentTabs />
    </RoleGuard>
  );
}
