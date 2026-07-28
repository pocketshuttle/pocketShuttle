import { ManagedWorkspaceBanner } from "@/components/admin/managed-workspace-banner";

export function ManagedWorkspaceSlot({ session }: { session: any }) {
  if (
    !session?.platformActorId ||
    !session?.workspaceExpiresAt ||
    !session?.workspaceReason
  ) {
    return null;
  }
  return (
    <ManagedWorkspaceBanner
      actorName={String(session.platformActorName || "Platform admin")}
      subjectName={String(session.name || session.role || "Account")}
      reason={String(session.workspaceReason)}
      expiresAt={String(session.workspaceExpiresAt)}
    />
  );
}
