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
import { Poppins } from "next/font/google"
import { Car, Eye, EyeOff, GraduationCap, Users } from "lucide-react"
const poppins = Poppins({ weight: "400", subsets: ["latin"] });


export const RegisterForm = () => {
    const [isPending, startTransition] = useTransition()
    const [isError, setIsError] = useState<string | undefined>("")
    const [isSuccess, setIsSuccess] = useState<string | undefined>("")
    const [showPassword, setShowPassword] = useState(false)

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
            accountRole: "school",
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
        }
    })

    const accountRole = form.watch("accountRole")
    const isSchool = accountRole === "school"
    const isDriver = accountRole === "driver"

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
            subLabel="Create a school workspace, parent account, or standalone driver profile."
            backButtonLabel="Login?"
            description="Already have an account?"
            backButtonHref="/login"
        >
            <Form {...form}>
                {/* the handle submit comes from the form constant */}
                <form onSubmit={form.handleSubmit(onSubmit)} className={`space-y-5 ${poppins.className} text-white`}>
                    <FormField
                        control={form.control}
                        name="accountRole"
                        render={({ field }) => (
                            <FormItem className="space-y-2.5">
                                <FormLabel className="text-sm font-medium text-slate-200">Register as</FormLabel>
                                <FormControl>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { value: "school", label: "School", icon: GraduationCap },
                                            { value: "parent", label: "Parent", icon: Users },
                                            { value: "driver", label: "Driver", icon: Car },
                                        ].map((item) => {
                                            const Icon = item.icon
                                            const active = field.value === item.value

                                            return (
                                                <button
                                                    key={item.value}
                                                    type="button"
                                                    disabled={isPending}
                                                    onClick={() => field.onChange(item.value)}
                                                    className={`flex h-12 items-center justify-center gap-2 rounded-lg border text-sm font-medium transition-colors ${active ? "border-[#6d72c9] bg-[#232b42] text-white" : "border-white/5 bg-[#141c2a] text-slate-300 hover:bg-[#1b2435]"}`}
                                                >
                                                    <Icon className="h-4 w-4" aria-hidden="true" />
                                                    {item.label}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="space-y-5 ">
                        {isSchool ? (
                            <FormField
                                control={form.control}
                                name="schoolname"
                                render={({ field }) => (
                                    <FormItem className="space-y-2.5">
                                        <FormLabel className="text-sm font-medium text-slate-200">Name of Your School</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                placeholder="school name"
                                                type="text"
                                                disabled={isPending}
                                                className="h-14 rounded-lg border-white/5 bg-[#141c2a] px-4 text-white shadow-none placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-[#6d72c9]"
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
                                        <FormLabel className="text-sm font-medium text-slate-200">Full Name</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                placeholder="full name"
                                                type="text"
                                                disabled={isPending}
                                                className="h-14 rounded-lg border-white/5 bg-[#141c2a] px-4 text-white shadow-none placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-[#6d72c9]"
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
                                    <FormLabel className="text-sm font-medium text-slate-200">Email Address</FormLabel>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            placeholder="iwinosa@gmail.com"
                                            type="email"
                                            disabled={isPending}
                                            className="h-14 rounded-lg border-white/5 bg-[#141c2a] px-4 text-white shadow-none placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-[#6d72c9]"
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
                                        <FormLabel className="text-sm font-medium text-slate-200">Phone Number</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                placeholder="08123456789"
                                                type="text"
                                                disabled={isPending}
                                                className="h-14 rounded-lg border-white/5 bg-[#141c2a] px-4 text-white shadow-none placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-[#6d72c9]"
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
                                        <FormLabel className="text-sm font-medium text-slate-200">Address</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                placeholder="home address"
                                                type="text"
                                                disabled={isPending}
                                                className="h-14 rounded-lg border-white/5 bg-[#141c2a] px-4 text-white shadow-none placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-[#6d72c9]"
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
                                        <FormLabel className="text-sm font-medium text-slate-200">Service Areas</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                placeholder="Lekki to VI, Ajah to Ikoyi"
                                                type="text"
                                                disabled={isPending}
                                                className="h-14 rounded-lg border-white/5 bg-[#141c2a] px-4 text-white shadow-none placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-[#6d72c9]"
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
                                                <FormLabel className="text-sm font-medium text-slate-200">{label}</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        value={(field.value as string | undefined) ?? ""}
                                                        placeholder={placeholder}
                                                        type="text"
                                                        disabled={isPending}
                                                        className="h-14 rounded-lg border-white/5 bg-[#141c2a] px-4 text-white shadow-none placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-[#6d72c9]"
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
                                            <FormLabel className="text-sm font-medium text-slate-200">Vehicle Capacity</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    value={field.value ?? ""}
                                                    onChange={(event) => field.onChange(event.target.value)}
                                                    placeholder="4"
                                                    type="number"
                                                    min={1}
                                                    disabled={isPending}
                                                    className="h-14 rounded-lg border-white/5 bg-[#141c2a] px-4 text-white shadow-none placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-[#6d72c9]"
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
                                    <FormLabel className="text-sm font-medium text-slate-200">Password</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Input
                                                {...field}
                                                placeholder="******"
                                                type={showPassword ? "text" : "password"}
                                                disabled={isPending}
                                                className="h-14 rounded-lg border-white/5 bg-[#141c2a] px-4 pr-12 text-white shadow-none placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-[#6d72c9]"

                                            />
                                            <button
                                                type="button"
                                                disabled={isPending}
                                                aria-label={showPassword ? "Hide password" : "Show password"}
                                                onClick={() => setShowPassword((current) => !current)}
                                                className="absolute right-4 top-1/2 inline-flex -translate-y-1/2 items-center justify-center text-slate-400 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
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
                        size="lg" className="h-14 w-full rounded-lg bg-[#4a48ff] text-base font-semibold text-white shadow-none hover:bg-[#5b5aff]" type="submit">Join Us</Button>
                </form>
            </Form>
        </CardWrapper>
    )
}

export default RegisterForm
