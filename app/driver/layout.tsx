import { ManagedWorkspaceSlot } from "@/components/admin/managed-workspace-slot";
import { getUserSession } from "@/lib/session";

const DriverLayout = async ({ children }: { children: React.ReactNode }) => {
  const user = await getUserSession();
  return (
    <div className="min-h-screen bg-gray-100 text-black">
      <ManagedWorkspaceSlot session={user} />
      {children}
    </div>
  );
};

export default DriverLayout;
