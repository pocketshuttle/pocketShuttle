"use client"
import * as z from "zod"
import { CardWrapper } from "@/components/auth/card-wrapper"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormControl, FormField, FormLabel, FormItem, FormMessage } from "@/components/ui/form"
import { LoginSchema } from "@/schemas"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Login } from "@/actions/login"
import { useEffect, useState, useTransition } from "react"
import { FormError } from "@/components/errorsandsuccess/form-error"
import { FormSuccess } from "@/components/errorsandsuccess/form-success"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Bus, Car, Eye, EyeOff, GraduationCap, Users } from "lucide-react"

const LOGIN_ROLE_STORAGE_KEY = "pocketshuttle-login-role";

const roleOptions = [
    {
        value: "admin",
        label: "School",
        icon: GraduationCap,
    },
    {
        value: "parent",
        label: "Parent",
        icon: Users,
    },
    {
        value: "driver",
        label: "Driver",
        icon: Car,
    },
    {
        value: "teacher",
        label: "Teacher",
        icon: Bus,
    },
];

export const LoginForm = () => {
    const [isPending, startTransition] = useTransition()
    const [isError, setIsError] = useState<string | undefined>("")
    const [isSuccess, setIsSuccess] = useState<string | undefined>("")
    const [selectedRole, setSelectedRole] = useState<string>("")
    const [rememberedRole, setRememberedRole] = useState<string>("")
    const [isRoleStep, setIsRoleStep] = useState(true)
    const [showPassword, setShowPassword] = useState(false)

    const searchParams = useSearchParams()
    const callbackUrl = searchParams.get("callbackUrl")


    {/**
     Initialize the form with react-hook-form, integrating Zod for validation
 - The form's validation schema is defined using Zod's `LoginSchema`
 - `useForm` hook is used to handle form state and validation
 - `zodResolver` is used to connect Zod schema validation with react-hook-form
 - Default values for the form fields are set to empty strings
 @Usage:
 This setup enables the form to use `LoginSchema` for validating the email and password fields.
*/}
    const rememberedRoleLabel = roleOptions.find((role) => role.value === rememberedRole)?.label || "";

    const form = useForm<z.infer<typeof LoginSchema>>({
        resolver: zodResolver(LoginSchema),
        defaultValues: {
            email: "",
            password: "",
            role: selectedRole || ""
        }
    })

    useEffect(() => {
        const storedRole = window.localStorage.getItem(LOGIN_ROLE_STORAGE_KEY) || "";
        if (storedRole && roleOptions.some((role) => role.value === storedRole)) {
            setRememberedRole(storedRole);
        }
    }, []);

    useEffect(() => {
        if (searchParams.get("reason") === "suspended") {
            setIsError("This account has been suspended. Please contact support.");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const onSubmit = (values: z.infer<typeof LoginSchema>) => {
        setIsError("")
        setIsSuccess("")
        window.localStorage.setItem(LOGIN_ROLE_STORAGE_KEY, values.role || "admin")
        // using the useTransition hook from react
        startTransition(() => {
            Login(values, callbackUrl).then((data) => {
                setIsError(data?.error)
            })
        })
    }
    const handleSelectRole = (value: string) => {
        setSelectedRole(value)
        form.setValue("role", value)
        setIsRoleStep(false)
    }

    const handleRememberedRole = () => {
        if (!rememberedRole) return;
        handleSelectRole(rememberedRole);
    }

    const handleSwitchRole = () => {
        setRememberedRole("");
        window.localStorage.removeItem(LOGIN_ROLE_STORAGE_KEY);
        setSelectedRole("");
        form.setValue("role", "");
        setIsRoleStep(true);
    }

    return (
        <CardWrapper
            headLabel="Welcome Back"
            subLabel="Sign in to manage routes, notifications, and daily drop-off activity."
            backButtonLabel="Register?"
            description="Don't have an account?"
            backButtonHref="/register"
        >
            {isError && (
                <div className="mb-4">
                    <FormError message={isError} />
                </div>
            )}
            {isRoleStep ? (
                <div className={`space-y-5 text-slate-950`}>
                    {rememberedRole && (
                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                            <p className="text-sm text-slate-600">Welcome back</p>
                            <Button
                                type="button"
                                onClick={handleRememberedRole}
                                className="mt-3 h-12 w-full rounded-lg bg-blue-700 text-base font-semibold text-white shadow-none hover:bg-blue-800"
                            >
                                Login as {rememberedRoleLabel}
                            </Button>
                            <Button
                                type="button"
                                variant="link"
                                onClick={handleSwitchRole}
                                className="mt-2 h-auto w-full text-blue-700 hover:text-slate-950"
                            >
                                Login as someone else
                            </Button>
                        </div>
                    )}

                    {!rememberedRole && (
                        <div className="space-y-3">
                            <p className="text-sm font-medium text-slate-700">Who are you logging in as?</p>
                            <div className="grid grid-cols-2 gap-3">
                                {roleOptions.map((role) => {
                                    const Icon = role.icon;

                                    return (
                                        <button
                                            key={role.value}
                                            type="button"
                                            onClick={() => handleSelectRole(role.value)}
                                            className="flex h-24 flex-col items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 text-sm font-medium text-slate-700 transition-colors hover:border-blue-300 hover:bg-white hover:text-slate-950"
                                        >
                                            <Icon className="h-6 w-6" aria-hidden="true" />
                                            {role.label}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
            <Form {...form}>
                {/* the handle submit comes from the form constant */}
                <form onSubmit={form.handleSubmit(onSubmit)} className={`space-y-5 text-slate-950`}>
                    <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                        <div>
                            <p className="text-xs text-slate-500">Logging in as</p>
                            <p className="font-semibold text-slate-950">
                                {roleOptions.find((role) => role.value === selectedRole)?.label || "School"}
                            </p>
                        </div>
                        <Button
                            type="button"
                            variant="link"
                            onClick={() => setIsRoleStep(true)}
                            className="h-auto px-0 text-blue-700 hover:text-slate-950"
                        >
                            Change
                        </Button>
                    </div>
                    <div className="space-y-5">
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem className="space-y-2.5">
                                    <FormLabel className="text-sm font-medium text-slate-700">Email Address</FormLabel>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            placeholder="ciroma@email.com"
                                            type="email"
                                            disabled={isPending}
                                            className="h-14 rounded-lg border-slate-200 bg-slate-50 px-4 text-slate-950 shadow-none placeholder:text-slate-500 focus-visible:ring-1 focus-visible:ring-blue-200"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        >

                        </FormField>
                    </div>
                    <div className="space-y-4">
                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem className="space-y-2.5">
                                    <FormLabel className="text-sm font-medium text-slate-700">Password</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Input
                                                {...field}
                                                placeholder="******"
                                                type={showPassword ? "text" : "password"}
                                                disabled={isPending}
                                                className="h-14 rounded-lg border-slate-200 bg-slate-50 px-4 pr-12 text-slate-950 shadow-none placeholder:text-slate-500 focus-visible:ring-1 focus-visible:ring-blue-200"

                                            />
                                            <button
                                                type="button"
                                                disabled={isPending}
                                                aria-label={showPassword ? "Hide password" : "Show password"}
                                                onClick={() => setShowPassword((current) => !current)}
                                                className="absolute right-4 top-1/2 inline-flex -translate-y-1/2 items-center justify-center text-slate-500 transition-colors hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                {showPassword ? (
                                                    <EyeOff className="h-5 w-5" aria-hidden="true" />
                                                ) : (
                                                    <Eye className="h-5 w-5" aria-hidden="true" />
                                                )}
                                            </button>
                                        </div>
                                    </FormControl>
                                    <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
                                        <Button variant="link" size="sm" asChild className="h-auto justify-start px-0 text-sm font-medium text-blue-700 hover:text-slate-950">
                                            <Link href="/reset">
                                                Forgot Password?
                                            </Link>
                                        </Button>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        >

                        </FormField>
                    </div>
                    <FormSuccess message={isSuccess} />
                    <Button
                        disabled={isPending}
                        size="lg" className="h-14 w-full rounded-lg bg-blue-700 text-base font-semibold text-white shadow-none hover:bg-blue-800" type="submit">Login</Button>
                </form>
            </Form>
            )}
        </CardWrapper>
    )
}
