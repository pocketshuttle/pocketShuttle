"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AdminInviteAcceptForm() {
  const params = useSearchParams();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, setPending] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (password.length < 12) {
      setMessage("Password must contain at least 12 characters.");
      return;
    }
    if (password !== confirmation) {
      setMessage("Passwords do not match.");
      return;
    }
    setPending(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/admin-invites/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Unable to accept invitation");
      setSuccess(true);
      setMessage(data.message);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to accept invitation");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
      <h1 className="text-2xl font-semibold">Join Platform Admin</h1>
      <p className="mt-1 text-sm text-slate-500">
        Create a private password to accept your PocketShuttle invitation.
      </p>
      {success ? (
        <div className="mt-5 grid gap-4">
          <p className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">
            {message}
          </p>
          <Button asChild>
            <Link href="/admin/login">Sign in</Link>
          </Button>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-5 grid gap-3">
          <Input
            type="password"
            autoComplete="new-password"
            placeholder="Password (12+ characters)"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <Input
            type="password"
            autoComplete="new-password"
            placeholder="Confirm password"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
          />
          {message ? (
            <p className="rounded-md bg-rose-50 p-3 text-sm text-rose-700">{message}</p>
          ) : null}
          <Button disabled={pending || !token} type="submit">
            {pending ? "Creating account…" : "Accept invitation"}
          </Button>
        </form>
      )}
    </div>
  );
}
