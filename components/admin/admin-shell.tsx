"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, BarChart3, BellRing, CreditCard, Headphones, LayoutDashboard, Network, ScrollText, Shield, ShieldAlert, Users } from "lucide-react";

import Logout from "@/components/dashboard/sidebar/logout";
import {
  hasPlatformPermission,
  PlatformAdminAccessRole,
  PlatformPermission,
} from "@/lib/admin/permissions";

const navItems = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, permission: "overview.read" },
  { href: "/admin/users", label: "Accounts", icon: Users, permission: "accounts.read" },
  { href: "/admin/operations", label: "Operations", icon: Activity, permission: "operations.read" },
  { href: "/admin/safety", label: "Safety", icon: ShieldAlert, permission: "safety.read" },
  { href: "/admin/billing", label: "Billing", icon: CreditCard, permission: "billing.read" },
  { href: "/admin/notifications", label: "Notifications", icon: BellRing, permission: "operations.read" },
  { href: "/admin/support", label: "Support", icon: Headphones, permission: "accounts.read" },
  { href: "/admin/organizations", label: "Enterprise", icon: Network, permission: "accounts.read" },
  { href: "/admin/admins", label: "Admins", icon: Shield, permission: "admins.read" },
  { href: "/admin/reports", label: "Reports", icon: BarChart3, permission: "reports.read" },
  { href: "/admin/audit-log", label: "Audit", icon: ScrollText, permission: "audit.read" },
] satisfies Array<{
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  permission: PlatformPermission;
}>;

export function AdminShell({
  children,
  name,
  accessRole,
}: {
  children: React.ReactNode;
  name?: string | null;
  accessRole: PlatformAdminAccessRole;
}) {
  const pathname = usePathname();
  const visibleItems = navItems.filter((item) =>
    hasPlatformPermission(accessRole, item.permission)
  );

  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-950">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white p-4 lg:flex">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-[#4a48ff] text-white">
            <Shield className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm text-slate-500">PocketShuttle</p>
            <h1 className="font-semibold">Super Admin</h1>
          </div>
        </div>

        <nav className="grid gap-1">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const active = item.href === "/admin" ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition ${
                  active ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto">
          <Logout />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wide text-slate-500">Platform operations</p>
              <h2 className="truncate text-lg font-semibold">{name || "Super admin"}</h2>
            </div>
            <div className="lg:hidden">
              <Logout />
            </div>
          </div>
          <nav className="mt-3 flex gap-2 overflow-x-auto lg:hidden">
            {visibleItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </header>
        <main className="min-w-0 flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
