"use client";

import { useMemo, useState, useTransition } from "react";
import { Copy, Plus, RefreshCw, ShieldCheck, UserX, X } from "lucide-react";

import {
  canInvitePlatformRole,
  hasPlatformPermission,
  PlatformAdminAccessRole,
  PLATFORM_ADMIN_ROLES,
} from "@/lib/admin/permissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";

type AdminRow = {
  id: string;
  name?: string | null;
  email: string;
  accessRole: PlatformAdminAccessRole;
  status: "ACTIVE" | "DISABLED";
  lastLoginAt?: string | null;
  createdAt: string;
};

type InviteRow = {
  id: string;
  name: string;
  email: string;
  accessRole: PlatformAdminAccessRole;
  status: string;
  deliveryStatus: string;
  deliveryError?: string | null;
  expiresAt: string;
};

async function jsonFetch(url: string, init?: RequestInit) {
  const response = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Request failed");
  return data;
}

export function AdminManager({
  initialAdmins,
  initialInvites,
  currentAdminId,
  currentRole,
}: {
  initialAdmins: AdminRow[];
  initialInvites: InviteRow[];
  currentAdminId: string;
  currentRole: PlatformAdminAccessRole;
}) {
  const [admins, setAdmins] = useState(initialAdmins);
  const [invites, setInvites] = useState(initialInvites);
  const [showCreate, setShowCreate] = useState(false);
  const [lastInviteUrl, setLastInviteUrl] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    accessRole: "ADMIN" as PlatformAdminAccessRole,
  });
  const [isPending, startTransition] = useTransition();

  const inviteRoles = useMemo(
    () =>
      PLATFORM_ADMIN_ROLES.filter((role) =>
        canInvitePlatformRole(currentRole, role)
      ),
    [currentRole]
  );
  const canCreateAdmin = inviteRoles.length > 0;
  const canManageAdmins = hasPlatformPermission(currentRole, "admins.manage");

  const createInvite = () => {
    startTransition(async () => {
      try {
        const data = await jsonFetch("/api/admin/admin-invites", {
          method: "POST",
          body: JSON.stringify(form),
        });
        setInvites((current) => [
          {
            ...data.invite,
            status: "PENDING",
            deliveryStatus: data.deliveryWarning ? "FAILED" : "SENT",
            deliveryError: data.deliveryWarning,
          },
          ...current.filter((invite) => invite.email !== data.invite.email),
        ]);
        setLastInviteUrl(data.inviteUrl || null);
        setForm({ name: "", email: "", accessRole: "ADMIN" });
        setShowCreate(false);
        toast({ description: data.message });
      } catch (error) {
        toast({
          description: error instanceof Error ? error.message : "Unable to invite admin",
          variant: "destructive",
        });
      }
    });
  };

  const resendInvite = (id: string) => {
    startTransition(async () => {
      try {
        const data = await jsonFetch(`/api/admin/admin-invites/${id}/resend`, {
          method: "POST",
        });
        setInvites((current) =>
          current.map((invite) =>
            invite.id === id
              ? {
                  ...invite,
                  status: "PENDING",
                  deliveryStatus: data.deliveryWarning ? "FAILED" : "SENT",
                  deliveryError: data.deliveryWarning,
                }
              : invite
          )
        );
        setLastInviteUrl(data.inviteUrl || null);
        toast({ description: data.message });
      } catch (error) {
        toast({
          description: error instanceof Error ? error.message : "Unable to resend",
          variant: "destructive",
        });
      }
    });
  };

  const revokeInvite = (id: string) => {
    startTransition(async () => {
      try {
        const data = await jsonFetch(`/api/admin/admin-invites/${id}`, {
          method: "DELETE",
        });
        setInvites((current) => current.filter((invite) => invite.id !== id));
        toast({ description: data.message });
      } catch (error) {
        toast({
          description: error instanceof Error ? error.message : "Unable to revoke",
          variant: "destructive",
        });
      }
    });
  };

  const updateAdmin = (
    admin: AdminRow,
    patch: { accessRole?: PlatformAdminAccessRole; status?: "ACTIVE" | "DISABLED" }
  ) => {
    const currentPassword = window.prompt(
      "Confirm this sensitive change with your current password"
    );
    if (!currentPassword) return;
    startTransition(async () => {
      try {
        const data = await jsonFetch(`/api/admin/admins/${admin.id}`, {
          method: "PATCH",
          body: JSON.stringify({ ...patch, currentPassword }),
        });
        setAdmins((current) =>
          current.map((row) => (row.id === admin.id ? { ...row, ...data.admin } : row))
        );
        toast({ description: data.message });
      } catch (error) {
        toast({
          description: error instanceof Error ? error.message : "Unable to update admin",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Platform admins</h1>
          <p className="text-sm text-slate-500">
            Invite operators, assign least-privilege roles, and revoke access.
          </p>
        </div>
        {canCreateAdmin ? (
          <Button onClick={() => setShowCreate(true)} disabled={isPending} className="gap-2">
            <Plus className="h-4 w-4" /> Create admin
          </Button>
        ) : null}
      </div>

      {lastInviteUrl ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
          <p>Development invite URL is available because production mode is off.</p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigator.clipboard.writeText(lastInviteUrl)}
            className="gap-2"
          >
            <Copy className="h-4 w-4" /> Copy invite URL
          </Button>
        </div>
      ) : null}

      {showCreate && canCreateAdmin ? (
        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Invite platform admin</h2>
            <button onClick={() => setShowCreate(false)} aria-label="Close">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <Input
              placeholder="Full name"
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
            />
            <Input
              type="email"
              placeholder="admin@example.com"
              value={form.email}
              onChange={(event) =>
                setForm((current) => ({ ...current, email: event.target.value }))
              }
            />
            <select
              className="rounded-md border border-slate-200 bg-white px-3 text-sm"
              value={form.accessRole}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  accessRole: event.target.value as PlatformAdminAccessRole,
                }))
              }
            >
              {inviteRoles.map((role) => (
                <option key={role} value={role}>
                  {role.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </div>
          <Button
            className="mt-3"
            disabled={isPending || form.name.trim().length < 2 || !form.email.includes("@")}
            onClick={createInvite}
          >
            Send invitation
          </Button>
        </section>
      ) : null}

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-4 py-3 font-semibold">Active accounts</div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Admin</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Last login</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {admins.map((admin) => (
                <tr key={admin.id}>
                  <td className="px-4 py-3">
                    <p className="font-semibold">{admin.name || "Admin"}</p>
                    <p className="text-xs text-slate-500">{admin.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={admin.accessRole}
                      disabled={
                        isPending ||
                        !canManageAdmins ||
                        admin.id === currentAdminId ||
                        (admin.accessRole === "OWNER" && currentRole !== "OWNER")
                      }
                      onChange={(event) =>
                        updateAdmin(admin, {
                          accessRole: event.target.value as PlatformAdminAccessRole,
                        })
                      }
                      className="rounded-md border border-slate-200 bg-white px-2 py-1"
                    >
                      {PLATFORM_ADMIN_ROLES.filter(
                        (role) => role !== "OWNER" || currentRole === "OWNER"
                      ).map((role) => (
                        <option key={role} value={role}>
                          {role.replaceAll("_", " ")}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">{admin.status}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {admin.lastLoginAt
                      ? new Date(admin.lastLoginAt).toLocaleString()
                      : "Never"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {canManageAdmins &&
                    admin.id !== currentAdminId &&
                    (admin.accessRole !== "OWNER" || currentRole === "OWNER") ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isPending}
                        onClick={() =>
                          updateAdmin(admin, {
                            status: admin.status === "ACTIVE" ? "DISABLED" : "ACTIVE",
                          })
                        }
                        className="gap-2"
                      >
                        {admin.status === "ACTIVE" ? (
                          <UserX className="h-4 w-4" />
                        ) : (
                          <ShieldCheck className="h-4 w-4" />
                        )}
                        {admin.status === "ACTIVE" ? "Disable" : "Enable"}
                      </Button>
                    ) : (
                      <span className="text-xs text-slate-500">Current account</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-4 py-3 font-semibold">
          Pending invitations
        </div>
        <div className="grid gap-2 p-4">
          {invites.map((invite) => (
            <div
              key={invite.id}
              className="flex flex-col gap-3 rounded-md bg-slate-50 p-3 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <p className="font-medium">
                  {invite.name} · {invite.accessRole.replaceAll("_", " ")}
                </p>
                <p className="text-xs text-slate-500">
                  {invite.email} · {invite.deliveryStatus} · expires{" "}
                  {new Date(invite.expiresAt).toLocaleString()}
                </p>
                {invite.deliveryError ? (
                  <p className="text-xs text-rose-700">{invite.deliveryError}</p>
                ) : null}
              </div>
              {canCreateAdmin ? (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isPending}
                    onClick={() => resendInvite(invite.id)}
                    className="gap-2"
                  >
                    <RefreshCw className="h-4 w-4" /> Resend
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isPending}
                    onClick={() => revokeInvite(invite.id)}
                  >
                    Revoke
                  </Button>
                </div>
              ) : null}
            </div>
          ))}
          {!invites.length ? (
            <p className="text-sm text-slate-500">No pending invitations.</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
