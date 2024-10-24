"use client"
import * as z from "zod"
import { CardWrapper } from "@/components/auth/card-wrapper"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormControl, FormField, FormLabel, FormItem, FormMessage } from "@/components/ui/form"
import { NewPasswordSchema } from "@/schemas"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Login } from "@/actions/login"
import { useState, useTransition } from "react"
import { FormError } from "@/components/errorsandsuccess/form-error"
import { FormSuccess } from "@/components/errorsandsuccess/form-success"
import { useSearchParams } from "next/navigation"
import { newPassword } from "@/actions/new-password"
import { Poppins } from "next/font/google"
const poppins = Poppins({ weight: "400", subsets: ["latin"] });

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
        console.log(values)
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
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>New Password</FormLabel>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            placeholder="******"
                                            type="password"
                                            disabled={isPending}
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
                        size="lg" className="w-full" type="submit">Change Password</Button>
                </form>
            </Form>
        </CardWrapper>
    )
}
