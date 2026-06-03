"use client"
import * as z from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormControl, FormField, FormLabel, FormItem, FormMessage } from "@/components/ui/form"
import { Dispatch, SetStateAction, useState, useTransition } from "react"
import { Input } from "@/components/ui/input"
import { BusSchema } from "@/schemas"
import { Button } from "@/components/ui/button"
import { TeacherCardWrapper } from "@/components/ui/card-wrapper"
import { usePost } from "@/hooks/usePost"
import { useFetch } from "@/hooks/useFetch"
import { BusSelectWrapper } from "./bus-select-wrapper"
import { useSession } from "@/hooks/useSession"
import { addBus } from "@/actions/add-bus"
import { toast } from "@/components/ui/use-toast"

interface BusModalProps {
    setIsOpenModal: Dispatch<SetStateAction<boolean>>
    isOpenModal: boolean
}

export const BusModal = ({ isOpenModal, setIsOpenModal }: BusModalProps) => {
    const session = useSession()
    const userId = session?.id

    const [isPending, startTransition] = useTransition()
    const [submittedData, setSubmittedData] = useState<object | undefined>(undefined)
    const [selectRoute, setSelectedRoute] = useState<string>("")
    const { data, loading, errorMessage, success } = usePost("/api/addbus", submittedData, "POST")
    const { data: routeData, isPending: routePending, errorMessage: routeError } = useFetch(`/api/addroute/${userId}`, userId);


    const form = useForm<z.infer<typeof BusSchema>>({
        resolver: zodResolver(BusSchema),
        defaultValues: {
            school_id: "",
            bus_number: "",
            driver: "",
            seat_number: 0,
            teacher: "",
            student: "",
            color: "",
            bus_product_name: "",
            route: selectRoute || "",

        }
    })

    const onSubmit = (values: z.infer<typeof BusSchema>) => {
        if (userId) {
            values.school_id = userId;
        }
        startTransition(async () => {
            const res = await addBus(values)
            if (res.status === 200) {
                toast({
                    //@ts-ignore
                    description: res.message,
                });
            } else {
                toast({
                    //@ts-ignore
                    description: res.message,
                });
            }

        });
    }

    const handleCloseModal = () => {
        setIsOpenModal(false)
    }
    const handleSelectChange = (value: string) => {
        setSelectedRoute(value)
        form.setValue("route", value)
    }

    return (
        <div className="modal-overlay">
            <div className="modal-panel w-3/6">

                <TeacherCardWrapper
                    headLabel="Add a Bus"
                    action={() => handleCloseModal()}
                >
                    <div className="form-surface flex justify-center">
                        <div className="flex-1 px-2 text-slate-900 dark:text-slate-100">
                            <Form {...form}>
                                {/* the handle submit comes from the form constant */}
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                                    <div className="flex gap-3">
                                        <div className="w-3/6">
                                            <FormField
                                                control={form.control}
                                                name="bus_product_name"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Bus Name</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                {...field}
                                                                placeholder="Tesla"
                                                                type="text"
                                                                disabled={isPending}
                                                                // className="py-3 border-none bg-[var(--bgSoft)] outline-none h-12"
                                                                className="add-form-input"

                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <div>

                                        </div>
                                        <div className="w-3/6">
                                            <FormField
                                                control={form.control}
                                                name="bus_number"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Bus Number</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                {...field}
                                                                placeholder="abc-1234"
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

                                    <div className="space-x-4 flex items-center w-full justify-between">
                                        <div className="space-y-4 w-3/6">
                                            <FormField
                                                control={form.control}
                                                name="seat_number"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Seat Number</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                {...field}
                                                                placeholder="20"
                                                                type="number"
                                                                disabled={isPending}
                                                                className="add-form-input"
                                                                onChange={(e) => {
                                                                    const value = e.target.value;
                                                                    field.onChange(value === "" ? "" : Number(value));
                                                                }}
                                                            />
                                                        </FormControl>
                                                    </FormItem>
                                                )
                                                }
                                            />
                                        </div>
                                        <div className="w-3/6">
                                            <FormField
                                                control={form.control}
                                                name="color"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Bus Color</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                {...field}
                                                                placeholder="red"
                                                                type="text"
                                                                disabled={isPending}
                                                                className="add-form-input"
                                                            />
                                                        </FormControl>
                                                        <FormMessage />

                                                        {/* <Image src={eye} alt="eye" /> */}
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>

                                    < BusSelectWrapper placeholder="Select Routes" label="Routes" data={routeData} handleSelectChange={handleSelectChange} />
                                    {/* <div className="flex  justify-between ">
                                        < SelectProperty placeholder="Bus" label="Bus Name" item="Bus A" />
                                    </div> */}
                                    <Button
                                        disabled={isPending}
                                        size="lg" className="h-12 w-full rounded-lg bg-[#4a48ff] p-5 text-white shadow-none transition-transform duration-150 hover:scale-[1.01] hover:bg-[#5b5aff]" type="submit">Add Bus
                                    </Button>
                                </form>
                            </Form>
                        </div>
                    </div>
                </TeacherCardWrapper>

            </div >
        </div >
    )
}
