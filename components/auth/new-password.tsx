"use client"
import * as z from "zod"
import { CardWrapper } from "@/components/auth/card-wrapper"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormControl, FormField, FormLabel, FormItem, FormMessage } from "@/components/ui/form"
import { NewPasswordSchema } from "@/schemas"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useState, useTransition } from "react"
import { FormError } from "@/components/errorsandsuccess/form-error"
import { FormSuccess } from "@/components/errorsandsuccess/form-success"
import { useSearchParams } from "next/navigation"
import { newPassword } from "@/actions/new-password"

export const NewPasswordForm = () => {
    const searchParams = useSearchParams()
    const token = searchParams.get("token")

    const [isPending, startTransition] = useTransition()
    const [isError, setIsError] = useState<string | undefined>("")
    const [isSuccess, setIsSuccess] = useState<string | undefined>("")

    {/**
     Initialize the form with react-hook-form, integrating Zod for validation
 - The form's validation schema is defined using Zod's `NewPasswordSchema`
 - `useForm` hook is used to handle form state and validation
 - `zodResolver` is used to connect Zod schema validation with react-hook-form
 - Default values for the form fields are set to empty strings
 @Usage:
 This setup enables the form to use `NewPasswordSchema` for validating the email and password fields.
*/}
    const form = useForm<z.infer<typeof NewPasswordSchema>>({
        resolver: zodResolver(NewPasswordSchema),
        defaultValues: {
            password: "",
        }
    })

    const onSubmit = (values: z.infer<typeof NewPasswordSchema>) => {
        setIsError("")
        setIsSuccess("")

        // using the useTransition hook from react
        startTransition(() => {
            newPassword(values, token).then((data) => {
                setIsError(data?.error)
                setIsSuccess(data?.success)
            })
        })
    }

    return (
        <CardWrapper
            headLabel="Create a new password"
            subLabel="Choose a fresh password to regain access securely."
            backButtonLabel="Back to Login?"
            backButtonHref="/login"
        >
            <Form {...form}>
                {/* the handle submit comes from the form constant */}
                <form onSubmit={form.handleSubmit(onSubmit)} className={`space-y-5 text-slate-800`}>
                    <div className="space-y-5">
                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem className="space-y-2.5">
                                    <FormLabel className="text-sm font-medium text-slate-700">New Password</FormLabel>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            placeholder="******"
                                            type="password"
                                            disabled={isPending}
                                            className="h-12 rounded-xl border-slate-200 bg-slate-50 px-4 text-slate-900 shadow-none placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-slate-300"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        >
                        </FormField>
                    </div>
                    <FormError message={isError} />
                    <FormSuccess message={isSuccess} />
                    <Button
                        disabled={isPending}
                        size="lg" className="h-12 w-full rounded-xl bg-slate-900 text-base font-semibold text-white hover:bg-slate-800" type="submit">Change Password</Button>
                </form>
            </Form>
        </CardWrapper>
    )
}
