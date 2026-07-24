"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Building2, Car, ClipboardCheck, CreditCard, Headphones, LayoutDashboard, Network, ScrollText, Shield, UserRound, Users } from "lucide-react";

import Logout from "@/components/dashboard/sidebar/logout";

const navItems = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/users", label: "All users", icon: Users },
  { href: "/admin/schools", label: "Schools", icon: Building2 },
  { href: "/admin/organizations", label: "Organizations", icon: Network },
  { href: "/admin/parents", label: "Parents", icon: UserRound },
  { href: "/admin/drivers", label: "Drivers", icon: Car },
  { href: "/admin/verification", label: "Verification", icon: ClipboardCheck },
  { href: "/admin/known-drivers", label: "Known drivers", icon: Network },
  { href: "/admin/support", label: "Support", icon: Headphones },
  { href: "/admin/payment-plans", label: "Payment plans", icon: CreditCard },
  { href: "/admin/reports", label: "Reports", icon: BarChart3 },
  { href: "/admin/audit-log", label: "Audit log", icon: ScrollText },
];

export function AdminShell({
  children,
  name,
}: {
  children: React.ReactNode;
  name?: string | null;
}) {
  const pathname = usePathname();

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
          {navItems.map((item) => {
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
            {navItems.map((item) => (
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
