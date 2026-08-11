"use client";

import { useTransition } from "react";
import { LogOut } from "lucide-react";

import { logout } from "@/actions/logout";

export function SettingsLogoutButton() {
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      await logout(window.location.pathname);
    });
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isPending}
      className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-600 transition hover:bg-rose-100 disabled:opacity-60"
    >
      <LogOut className="h-4 w-4" aria-hidden="true" />
      Log out
    </button>
  );
}
