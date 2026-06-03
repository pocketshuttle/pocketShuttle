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
import { Login } from "@/actions/login"
import { useState, useTransition } from "react"
import { register } from "@/actions/register"
import { Poppins } from "next/font/google"
import { Eye, EyeOff } from "lucide-react"
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
            schoolname: "",
            email: "",
            password: "",
        }
    })
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
            subLabel="Set up your school account and bring parents, teachers, and transport updates into one workspace."
            backButtonLabel="Login?"
            description="Already have an account?"
            backButtonHref="/login"
        >
            <Form {...form}>
                {/* the handle submit comes from the form constant */}
                <form onSubmit={form.handleSubmit(onSubmit)} className={`space-y-5 ${poppins.className} text-white`}>
                    <div className="space-y-5 ">
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
                        >

                        </FormField>
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

                    <Button
                        disabled={isPending}
                        size="lg" className="h-14 w-full rounded-lg bg-[#4a48ff] text-base font-semibold text-white shadow-none hover:bg-[#5b5aff]" type="submit">Join Us</Button>
                </form>
            </Form>
        </CardWrapper>
    )
}

export default RegisterForm
