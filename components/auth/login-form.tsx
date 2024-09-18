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
import { useState, useTransition } from "react"
import { FormError } from "@/components/errorsandsuccess/form-error"
import { FormSuccess } from "@/components/errorsandsuccess/form-success"
import Link from "next/link"
import { AddRoles } from "../ui/add-role"
import { useSearchParams } from "next/navigation"


export const LoginForm = () => {
    const [isPending, startTransition] = useTransition()
    const [isError, setIsError] = useState<string | undefined>("")
    const [isSuccess, setIsSuccess] = useState<string | undefined>("")
    const [selectedRole, setSelectedRole] = useState<string>("")

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
    const form = useForm<z.infer<typeof LoginSchema>>({
        resolver: zodResolver(LoginSchema),
        defaultValues: {
            email: "",
            password: "",
            role: selectedRole || ""
        }
    })
    const onSubmit = (values: z.infer<typeof LoginSchema>) => {
        setIsError("")
        setIsSuccess("")
        // using the useTransition hook from react
        startTransition(() => {
            Login(values, callbackUrl).then((data) => {
                setIsError(data?.error)
                // setIsSuccess(data?.success)
            })
        })
    }
    const handleSelectRole = (value: string) => {
        setSelectedRole(value)
        console.log(value)
        form.setValue("role", value)
    }

    return (
        <CardWrapper
            headLabel="Welcome Back"
            backButtonLabel="Register?"
            description="Dont have an account"
            backButtonHref="/register"
            showSocial
        >
            <Form {...form}>
                {/* the handle submit comes from the form constant */}
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                    <div className="space-y-4">
                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Password</FormLabel>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            placeholder="******"
                                            type="password"
                                            disabled={isPending}

                                        />
                                    </FormControl>
                                    <div className="flex justify-between items-center">

                                        <Button variant="link" size="sm" asChild className="px-0 font-normal">
                                            <Link href="/reset">
                                                Forgot Password?
                                            </Link>
                                        </Button>
                                        <AddRoles handleSelectChange={handleSelectRole} />
                                    </div>
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
                        size="lg" className="w-full" type="submit">Login</Button>
                </form>
            </Form>
        </CardWrapper>
    )
}
