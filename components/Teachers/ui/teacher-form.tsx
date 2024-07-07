"use client"
import * as z from "zod"
import { CardWrapper } from "@/components/auth/card-wrapper"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormControl, FormField, FormLabel, FormItem, FormMessage } from "@/components/ui/form"
import { useState, useTransition } from "react"
import { Input } from "@/components/ui/input"
import { TeacherSchema } from "@/schemas"
import { Button } from "@/components/ui/button"

const AddTeacher = () => {
    const [isPending, startTransition] = useTransition()
    const [isError, setIsError] = useState("")
    const [isSuccess, setIsSuccess] = useState("")
    const form = useForm<z.infer<typeof TeacherSchema>>({
        resolver: zodResolver(TeacherSchema),
        defaultValues: {
            full_name: "",
            email: "",
            password: "",
            phoneNumber: "",
            address: "",
            image: ""
        }
    })
    const onSubmit = () => {
        startTransition(() => { })
    }
    return (
        <div>
            <Form {...form}>
                {/* the handle submit comes from the form constant */}
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="space-y-4">
                        <FormField
                            control={form.control}
                            name="full_name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            placeholder="ciroma@email.com"
                                            type="text"
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
                                    <FormMessage />

                                    {/* <Image src={eye} alt="eye" /> */}
                                </FormItem>
                            )}
                        >

                        </FormField>
                    </div>
                    <div className="space-y-4">
                        <FormField
                            control={form.control}
                            name="phoneNumber"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Password</FormLabel>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            placeholder="08012345678"
                                            type="number"
                                            disabled={isPending}

                                        />
                                    </FormControl>
                                    <FormMessage />

                                    {/* <Image src={eye} alt="eye" /> */}
                                </FormItem>
                            )}
                        >

                        </FormField>
                    </div>
                    <div className="space-y-4">
                        <FormField
                            control={form.control}
                            name="address"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Password</FormLabel>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            placeholder="Teachers Address"
                                            type="text"
                                            disabled={isPending}

                                        />
                                    </FormControl>
                                    <FormMessage />

                                    {/* <Image src={eye} alt="eye" /> */}
                                </FormItem>
                            )}
                        >

                        </FormField>
                    </div>
                    {/* <FormError message={isError} /> */}
                    {/* <FormSuccess message={isSuccess} /> */}
                    <Button
                        disabled={isPending}
                        size="lg" className="w-full" type="submit">Add teacher
                    </Button>
                </form>
            </Form>
        </div>
    )
}

export default AddTeacher