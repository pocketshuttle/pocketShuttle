"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Shield } from "lucide-react";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { AdminLogin } from "@/actions/admin-login";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoginSchema } from "@/schemas";

export function AdminLoginForm() {
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof LoginSchema>>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: "",
      role: "superadmin",
    },
  });

  const onSubmit = (values: z.infer<typeof LoginSchema>) => {
    setError("");
    startTransition(() => {
      AdminLogin(values).then((data) => {
        if (data?.error) setError(data.error);
      });
    });
  };

  return (
    <div className="w-full max-w-md rounded-lg border border-white/10 bg-[#101624] p-6 text-white shadow-2xl">
      <div className="mb-6 flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-lg bg-[#4a48ff]">
          <Shield className="h-6 w-6" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">Super admin</h1>
          <p className="text-sm text-slate-400">Platform operations access</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-200">Email</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="email"
                    disabled={isPending}
                    className="h-12 border-white/10 bg-[#141c2a] text-white"
                    placeholder="admin@pocketshuttle.com"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-200">Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      {...field}
                      type={showPassword ? "text" : "password"}
                      disabled={isPending}
                      className="h-12 border-white/10 bg-[#141c2a] pr-12 text-white"
                      placeholder="******"
                    />
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => setShowPassword((current) => !current)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {error && <p className="rounded-md bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}

          <Button disabled={isPending} className="h-12 w-full bg-[#4a48ff] text-white hover:bg-[#5b5aff]">
            Sign in
          </Button>
        </form>
      </Form>
    </div>
  );
}
