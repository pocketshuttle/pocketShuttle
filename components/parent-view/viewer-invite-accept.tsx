"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export function ViewerInviteAccept() {
  const token = useSearchParams().get("token") || "";
  const [state, setState] = useState<"idle" | "loading" | "accepted" | "login" | "error">("idle");
  const [message, setMessage] = useState("Sign in with the invited PocketShuttle account, then accept access.");

  const accept = async () => {
    setState("loading");
    const response = await fetch("/api/trip-viewer-invites/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const data = await response.json().catch(() => ({}));
    if (response.status === 401) {
      setState("login");
      setMessage(data.message || "Sign in to accept this invitation.");
      return;
    }
    if (!response.ok) {
      setState("error");
      setMessage(data.message || "Unable to accept this invitation.");
      return;
    }
    setState("accepted");
    setMessage("Trip access has been added to your account.");
  };

  return (
    <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
      <h1 className="text-2xl font-semibold text-slate-950">Trip viewer invitation</h1>
      <p className="mt-2 text-sm text-slate-600">{message}</p>
      {!token ? (
        <p className="mt-5 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">The invitation token is missing.</p>
      ) : state === "accepted" ? (
        <Button asChild className="mt-5">
          <Link href="/parent">Open PocketShuttle</Link>
        </Button>
      ) : state === "login" ? (
        <Button asChild className="mt-5">
          <Link href={`/login?callbackUrl=${encodeURIComponent(`/viewer/invite?token=${token}`)}`}>Sign in</Link>
        </Button>
      ) : (
        <Button className="mt-5" disabled={state === "loading"} onClick={accept}>
          {state === "loading" ? "Accepting…" : "Accept invitation"}
        </Button>
      )}
    </section>
  );
}
