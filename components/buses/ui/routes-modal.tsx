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

            <div className="modal-overlay">
                <div className="modal-panel w-3/6">

                    <TeacherCardWrapper
                        headLabel="Add a Route"
                        action={() => handleCloseModal()}
                    >
                        <div className="form-surface flex justify-center text-slate-900 dark:text-slate-100">
                            <div className="flex-1 px-2">
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
                                                                    className="add-form-input"

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
                                                                    className="add-form-input"
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        </div>
                                        <Button variant="secondary" type="submit" className="h-12 w-full rounded-lg bg-[#4a48ff] text-white shadow-none transition-transform duration-150 hover:scale-[1.01] hover:bg-[#5b5aff]">
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
