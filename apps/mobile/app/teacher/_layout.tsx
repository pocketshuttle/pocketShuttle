import { RoleGuard } from "../../src/components/role-guard";
import { RoleTabs } from "../../src/components/role-tabs";

export default function TeacherLayout() {
  return (
    <RoleGuard role="teacher">
      <RoleTabs />
    </RoleGuard>
  );
}
