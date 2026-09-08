import { RoleGuard } from "../../src/components/role-guard";
import { TeacherTabs } from "../../src/components/teacher-tabs";

export default function TeacherLayout() {
  return (
    <RoleGuard role="teacher">
      <TeacherTabs />
    </RoleGuard>
  );
}
