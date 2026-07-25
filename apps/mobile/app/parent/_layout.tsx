import { RoleGuard } from "../../src/components/role-guard";
import { RoleTabs } from "../../src/components/role-tabs";

export default function ParentLayout() {
  return (
    <RoleGuard role="parent">
      <RoleTabs />
    </RoleGuard>
  );
}
