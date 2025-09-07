"use client"
import * as z from "zod"
import { CardWrapper } from "@/components/auth/card-wrapper"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormControl, FormField, FormLabel, FormItem, FormMessage } from "@/components/ui/form"
import { ResetPasswordSchema } from "@/schemas"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Login } from "@/actions/login"
import { useState, useTransition } from "react"
import { FormError } from "@/components/errorsandsuccess/form-error"
import { FormSuccess } from "@/components/errorsandsuccess/form-success"
import Link from "next/link"
import { reset } from "@/actions/reset"
import { Poppins } from "next/font/google"
import { AddRoles } from "../ui/add-role"
const poppins = Poppins({ weight: "400", subsets: ["latin"] });

export const ResetPasswordForm = () => {
    const [isPending, startTransition] = useTransition()
    const [isError, setIsError] = useState<string | undefined>("")
    const [isSuccess, setIsSuccess] = useState<string | undefined>("")
    const [selectedRole, setSelectedRole] = useState<string>("")
    {/**
     Initialize the form with react-hook-form, integrating Zod for validation
 - The form's validation schema is defined using Zod's `ResetPasswordSchema`
 - `useForm` hook is used to handle form state and validation
 - `zodResolver` is used to connect Zod schema validation with react-hook-form
 - Default values for the form fields are set to empty strings
 @Usage:
 This setup enables the form to use `ResetPasswordSchema` for validating the email and password fields.
*/}
    const form = useForm<z.infer<typeof ResetPasswordSchema>>({
        resolver: zodResolver(ResetPasswordSchema),
        defaultValues: {
            email: "",
            role: ""
        }
    })

    const handleSelectRole = (value: string) => {
        setSelectedRole(value)
        form.setValue("role", value)
    }
    const onSubmit = (values: z.infer<typeof ResetPasswordSchema>) => {
        setIsError("")
        setIsSuccess("")
        // using the useTransition hook from react
        startTransition(() => {
            reset(values).then((data) => {
                setIsError(data?.error)
                setIsSuccess(data?.success)
            })
        })
    }

    return (
        <CardWrapper
            headLabel="Forgot your password"
            backButtonLabel="Back to Login?"
            backButtonHref="/login"
        >
            <Form {...form}>
                {/* the handle submit comes from the form constant */}
                <form onSubmit={form.handleSubmit(onSubmit)} className={`space-y-6 ${poppins.className}`}>
                    <div className="space-y-4">
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            placeholder="ciroma@email.com"
                                            type="email"
                                            disabled={isPending}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        >
                        </FormField>
                    </div>
                    <div>
                        <AddRoles handleSelectChange={handleSelectRole} />

                    </div>
                    <FormError message={isError} />
                    <FormSuccess message={isSuccess} />
                    <Button
                        disabled={isPending}
                        size="lg" className="w-full" type="submit">Send reset email</Button>
                </form>
            </Form>
        </CardWrapper>
    )
}
