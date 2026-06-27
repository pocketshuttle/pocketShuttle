"use client"
import * as z from "zod"
import { CardWrapper } from "@/components/auth/card-wrapper"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormControl, FormField, FormLabel, FormItem, FormMessage } from "@/components/ui/form"
import { RegisterSchema } from "@/schemas"
import { Input } from "@/components/ui/input"
import { Button } from "../ui/button"
import { FormError } from "@/components/errorsandsuccess/form-error"
import { FormSuccess } from "@/components/errorsandsuccess/form-success"
import { useState, useTransition } from "react"
import { register } from "@/actions/register"
import { Car, Eye, EyeOff, GraduationCap, Users } from "lucide-react"

const roleOptions = [
    {
        value: "school",
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
] as const;

export const RegisterForm = ({
    initialRole,
    inviteToken,
}: {
    initialRole?: "school" | "parent" | "driver";
    inviteToken?: string;
}) => {
    const [isPending, startTransition] = useTransition()
    const [isError, setIsError] = useState<string | undefined>("")
    const [isSuccess, setIsSuccess] = useState<string | undefined>("")
    const [showPassword, setShowPassword] = useState(false)
    const [selectedRole, setSelectedRole] = useState<"school" | "parent" | "driver">(initialRole || "school")
    const [isRoleStep, setIsRoleStep] = useState(!initialRole && !inviteToken)

    {/**
            Initialize the form with react-hook-form, integrating Zod for validation
        - The form's validation schema is defined using Zod's `LoginSchema`
        - `useForm` hook is used to handle form state and validation
        - `zodResolver` is used to connect Zod schema validation with react-hook-form
        - Default values for the form fields are set to empty strings
        @Usage:
        This setup enables the form to use `LoginSchema` for validating the email and password fields.
*/}

    const form = useForm<z.infer<typeof RegisterSchema>>({
        resolver: zodResolver(RegisterSchema),
        defaultValues: {
            accountRole: initialRole || selectedRole,
            schoolname: "",
            full_name: "",
            email: "",
            password: "",
            phoneNumber: "",
            address: "",
            serviceAreas: "",
            carMake: "",
            carModel: "",
            carColor: "",
            plateNumber: "",
            vehicleCapacity: undefined,
            inviteToken,
        }
    })

    const accountRole = form.watch("accountRole")
    const isSchool = accountRole === "school"
    const isDriver = accountRole === "driver"
    const selectedRoleLabel = roleOptions.find((role) => role.value === accountRole)?.label || "School"

    const handleSelectRole = (value: "school" | "parent" | "driver") => {
        setSelectedRole(value)
        form.setValue("accountRole", value)
        setIsRoleStep(false)
    }

    const onSubmit = (values: z.infer<typeof RegisterSchema>) => {
        setIsError("")
        setIsSuccess("")
        // using the useTransition hook from react
        startTransition(() => {
            register(values).then((data) => {
                setIsError(data?.error)
                // setIsSuccess(data.success)
            })
        })
    }
    return (

        <CardWrapper
            headLabel="Create an Account"
            subLabel={inviteToken ? "Complete your secure driver registration to respond to parent invites." : "Create a school workspace, parent account, or standalone driver profile."}
            backButtonLabel="Login?"
            description="Already have an account?"
            backButtonHref="/login"
        >
            {isRoleStep ? (
                <div className={`space-y-5 text-slate-950`}>
                    <div className="space-y-3">
                        <p className="text-sm font-medium text-slate-700">Who are you registering as?</p>
                        <div className="grid grid-cols-2 gap-3">
                            {roleOptions.map((role) => {
                                const Icon = role.icon

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
                </div>
            ) : (
            <Form {...form}>
                {/* the handle submit comes from the form constant */}
                <form onSubmit={form.handleSubmit(onSubmit)} className={`space-y-5 text-slate-950`}>
                    <FormField
                        control={form.control}
                        name="accountRole"
                        render={({ field }) => (
                            <input type="hidden" {...field} value={field.value || selectedRole} />
                        )}
                    />
                    <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                        <div>
                            <p className="text-xs text-slate-500">Registering as</p>
                            <p className="font-semibold text-slate-950">{selectedRoleLabel}</p>
                        </div>
                        {!inviteToken && (
                            <Button
                                type="button"
                                variant="link"
                                onClick={() => setIsRoleStep(true)}
                                className="h-auto px-0 text-blue-700 hover:text-slate-950"
                            >
                                Change
                            </Button>
                        )}
                    </div>
                    {inviteToken && (
                        <FormField
                            control={form.control}
                            name="inviteToken"
                            render={({ field }) => (
                                <input type="hidden" {...field} value={field.value || inviteToken} />
                            )}
                        />
                    )}

                    <div className="space-y-5 ">
                        {isSchool ? (
                            <FormField
                                control={form.control}
                                name="schoolname"
                                render={({ field }) => (
                                    <FormItem className="space-y-2.5">
                                        <FormLabel className="text-sm font-medium text-slate-700">Name of Your School</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                placeholder="school name"
                                                type="text"
                                                disabled={isPending}
                                                className="h-14 rounded-lg border-slate-200 bg-slate-50 px-4 text-slate-950 shadow-none placeholder:text-slate-500 focus-visible:ring-1 focus-visible:ring-blue-200"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        ) : (
                            <FormField
                                control={form.control}
                                name="full_name"
                                render={({ field }) => (
                                    <FormItem className="space-y-2.5">
                                        <FormLabel className="text-sm font-medium text-slate-700">Full Name</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                placeholder="full name"
                                                type="text"
                                                disabled={isPending}
                                                className="h-14 rounded-lg border-slate-200 bg-slate-50 px-4 text-slate-950 shadow-none placeholder:text-slate-500 focus-visible:ring-1 focus-visible:ring-blue-200"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}
                    </div>
                    <div className="space-y-4">
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem className="space-y-2.5">
                                    <FormLabel className="text-sm font-medium text-slate-700">Email Address</FormLabel>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            placeholder="iwinosa@gmail.com"
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
                    {!isSchool && (
                        <div className="grid gap-4 sm:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="phoneNumber"
                                render={({ field }) => (
                                    <FormItem className="space-y-2.5">
                                        <FormLabel className="text-sm font-medium text-slate-700">Phone Number</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                placeholder="08123456789"
                                                type="text"
                                                disabled={isPending}
                                                className="h-14 rounded-lg border-slate-200 bg-slate-50 px-4 text-slate-950 shadow-none placeholder:text-slate-500 focus-visible:ring-1 focus-visible:ring-blue-200"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="address"
                                render={({ field }) => (
                                    <FormItem className="space-y-2.5">
                                        <FormLabel className="text-sm font-medium text-slate-700">Address</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                placeholder="home address"
                                                type="text"
                                                disabled={isPending}
                                                className="h-14 rounded-lg border-slate-200 bg-slate-50 px-4 text-slate-950 shadow-none placeholder:text-slate-500 focus-visible:ring-1 focus-visible:ring-blue-200"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    )}
                    {isDriver && (
                        <>
                            <FormField
                                control={form.control}
                                name="serviceAreas"
                                render={({ field }) => (
                                    <FormItem className="space-y-2.5">
                                        <FormLabel className="text-sm font-medium text-slate-700">Service Areas</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                placeholder="Lekki to VI, Ajah to Ikoyi"
                                                type="text"
                                                disabled={isPending}
                                                className="h-14 rounded-lg border-slate-200 bg-slate-50 px-4 text-slate-950 shadow-none placeholder:text-slate-500 focus-visible:ring-1 focus-visible:ring-blue-200"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="grid gap-4 sm:grid-cols-2">
                                {[
                                    ["carMake", "Car Make", "Toyota"],
                                    ["carModel", "Car Model", "Sienna"],
                                    ["carColor", "Car Color", "Silver"],
                                    ["plateNumber", "Plate Number", "ABC-123XY"],
                                ].map(([name, label, placeholder]) => (
                                    <FormField
                                        key={name}
                                        control={form.control}
                                        name={name as keyof z.infer<typeof RegisterSchema>}
                                        render={({ field }) => (
                                            <FormItem className="space-y-2.5">
                                                <FormLabel className="text-sm font-medium text-slate-700">{label}</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        value={(field.value as string | undefined) ?? ""}
                                                        placeholder={placeholder}
                                                        type="text"
                                                        disabled={isPending}
                                                        className="h-14 rounded-lg border-slate-200 bg-slate-50 px-4 text-slate-950 shadow-none placeholder:text-slate-500 focus-visible:ring-1 focus-visible:ring-blue-200"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                ))}
                                <FormField
                                    control={form.control}
                                    name="vehicleCapacity"
                                    render={({ field }) => (
                                        <FormItem className="space-y-2.5">
                                            <FormLabel className="text-sm font-medium text-slate-700">Vehicle Capacity</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    value={field.value ?? ""}
                                                    onChange={(event) => field.onChange(event.target.value)}
                                                    placeholder="4"
                                                    type="number"
                                                    min={1}
                                                    disabled={isPending}
                                                    className="h-14 rounded-lg border-slate-200 bg-slate-50 px-4 text-slate-950 shadow-none placeholder:text-slate-500 focus-visible:ring-1 focus-visible:ring-blue-200"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </>
                    )}
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
                                    <FormMessage />

                                    {/* <Image src={eye} alt="eye" /> */}
                                </FormItem>
                            )}
                        >

                        </FormField>
                    </div>
                    <FormError message={isError} />
                    <FormSuccess message={isSuccess} />

                    <Button
                        disabled={isPending}
                        size="lg" className="h-14 w-full rounded-lg bg-blue-700 text-base font-semibold text-white shadow-none hover:bg-blue-800" type="submit">Join Us</Button>
                </form>
            </Form>
            )}
        </CardWrapper>
    )
}

export default RegisterForm
