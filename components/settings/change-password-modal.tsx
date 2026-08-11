"use client";

import { useState } from "react";
import { Loader2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";

import { jsonFetch } from "./utils";

const inputClass = "h-11 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-none";

export function ChangePasswordModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const reset = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const close = () => {
    reset();
    onClose();
  };

  const submit = async () => {
    if (newPassword.length < 6) {
      toast({ description: "New password must be at least 6 characters.", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ description: "New passwords do not match.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const data = await jsonFetch("/api/account/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      toast({ description: data.message || "Password updated." });
      close();
    } catch (error) {
      toast({
        description: error instanceof Error ? error.message : "Unable to update password.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-0 sm:items-center sm:p-4">
      <div className="w-full max-w-md rounded-t-xl bg-white p-5 shadow-2xl sm:rounded-xl">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Change password</h2>
            <p className="mt-0.5 text-sm text-slate-500">Use a new password you haven&apos;t used before.</p>
          </div>
          <button type="button" onClick={close} className="shrink-0 rounded-md p-2 hover:bg-slate-100" aria-label="Close change password">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-4">
          <div>
            <p className="mb-1.5 text-sm font-medium text-slate-700">Current password</p>
            <Input
              type="password"
              className={inputClass}
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              placeholder="Enter current password"
              autoComplete="current-password"
            />
          </div>
          <div>
            <p className="mb-1.5 text-sm font-medium text-slate-700">New password</p>
            <Input
              type="password"
              className={inputClass}
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="At least 6 characters"
              autoComplete="new-password"
            />
          </div>
          <div>
            <p className="mb-1.5 text-sm font-medium text-slate-700">Confirm new password</p>
            <Input
              type="password"
              className={inputClass}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Re-enter new password"
              autoComplete="new-password"
            />
          </div>
        </div>

        <Button
          className="mt-5 h-12 w-full gap-2 text-base font-semibold"
          disabled={submitting || !currentPassword || !newPassword || !confirmPassword}
          onClick={submit}
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          Update password
        </Button>
      </div>
    </div>
  );
}
