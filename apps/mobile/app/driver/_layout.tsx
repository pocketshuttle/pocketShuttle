import { RoleGuard } from "../../src/components/role-guard";
import { RoleTabs } from "../../src/components/role-tabs";

export default function DriverLayout() {
  return (
    <RoleGuard role="driver">
      <RoleTabs />
    </RoleGuard>
  );
}
