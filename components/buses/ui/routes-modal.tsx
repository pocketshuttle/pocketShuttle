"use client"
import * as z from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { TeacherCardWrapper } from '@/components/ui/card-wrapper'
import { Form, FormControl, FormField, FormLabel, FormItem, FormMessage } from "@/components/ui/form"
import { Input } from '@/components/ui/input'
import React, { Dispatch, SetStateAction, useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { RouteSchema } from "@/schemas"
import { usePost } from "@/hooks/usePost"
import { Button } from "@/components/ui/button"
import { useSession } from "@/hooks/useSession"


interface RouteModalProps {
    setIsOpenModal: Dispatch<SetStateAction<boolean>>
    isOpenModal: boolean
}
const RoutesModal = ({ setIsOpenModal, isOpenModal }: RouteModalProps) => {
    const session = useSession()
    const userId = session?.id

    const [isPending, startTransition] = useTransition()
    const [submittedData, setSubmittedData] = useState<object | undefined>(undefined)
    const { data, loading, errorMessage, success } = usePost("/api/addroute", submittedData, "POST")

    const handleCloseModal = () => {
        setIsOpenModal(false)
    }

    const form = useForm<z.infer<typeof RouteSchema>>({
        resolver: zodResolver(RouteSchema),
        defaultValues: {
            school_id: "",
            route_name: "",
            route_description: ""
        }
    })

    const onSubmit = async (values: z.infer<typeof RouteSchema>) => {
        if (userId) {
            values.school_id = userId;
        }
        startTransition(() => {
            setSubmittedData(values)
        })
    }

    return (
        <div>

            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 ">
                <div className="relative bg-gray-50  rounded-md w-3/6 ">

                    <TeacherCardWrapper
                        headLabel="Add a Route"
                        action={() => handleCloseModal()}
                    >
                        <div className=" flex justify-center text-gray-950">
                            <div className="flex-1 px-5 ">
                                <Form {...form}>
                                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                        <div className="flex gap-3">
                                            <div className="w-3/6">
                                                <FormField
                                                    control={form.control}
                                                    name="route_name"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Route Name</FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    {...field}
                                                                    placeholder="Tesla"
                                                                    type="text"
                                                                    disabled={isPending}
                                                                    className="py-3 border-none bg-transparent border-1 border-gray-500 shadow-md outline-none h-12"

                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                            <div className="w-3/6">
                                                <FormField
                                                    control={form.control}
                                                    name="route_description"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Route Descriptions</FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    {...field}
                                                                    placeholder="Tesla"
                                                                    type="text"
                                                                    disabled={isPending}
                                                                    className="py-3 border-none bg-transparent border-1 border-gray-500 shadow-md outline-none h-12"
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        </div>
                                        <Button variant="secondary" type="submit" className="bg-[#1d146d] w-full text-green-200 hover:bg-green-900">
                                            Submit
                                        </Button>
                                    </form>
                                </Form>
                            </div>
                        </div>

                    </TeacherCardWrapper>
                </div>
            </div>
        </div>
    )
}

export default RoutesModal