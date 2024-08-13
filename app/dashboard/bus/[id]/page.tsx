"use client"
import * as z from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormControl, FormField, FormLabel, FormItem, FormMessage } from "@/components/ui/form"
import { Dispatch, SetStateAction, useEffect, useState, useTransition } from "react"
import { Input } from "@/components/ui/input"
import { BusSchema } from "@/schemas"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { useFetch } from "@/hooks/useFetch"
import { useSession } from "next-auth/react"
import { usePost } from "@/hooks/usePost"
import { SelectDataProperty } from "@/components/ui/select-data-wrapper"
import { usePathname, useSearchParams } from "next/navigation"

const SingleBus = () => {
    const { data: session } = useSession()
    const userId = session?.user?.id
    const [submittedData, setSubmittedData] = useState<object | undefined>(undefined)
    const getPathname = usePathname()
    const busId = getPathname.split("/").pop()

    const [isPending, startTransition] = useTransition()
    const [selectTeacher, setSelectedTeacher] = useState<string>("")
    const [selectBusDriver, setSelectedBusDriver] = useState<string>("")
    const [selectStudent, setSelectedStudent] = useState<string>("")


    const { data: teachersData, isPending: loading, errorMessage } = useFetch(`/api/addteacher/${userId}`, userId);
    const { data: driversData, isPending: driverLoading, errorMessage: driversError } = useFetch(`/api/addteacher/${userId}`, userId);
    const { data: routeData, isPending: routeLoading, errorMessage: routeError } = useFetch(`/api/addroute/${userId}`, userId);
    const { data: busData, isPending: busPending, errorMessage: busError } = useFetch(`/api/addbus/${busId}`, busId);
    const { data: postData, loading: postLoading, errorMessage: postError, success } = usePost(`/api/addbus/${busId}`, submittedData, "PATCH")


    console.log(busData)

    const form = useForm<z.infer<typeof BusSchema>>({
        resolver: zodResolver(BusSchema),
        defaultValues: {
            school_id: userId,
            bus_number: "",
            driver: selectBusDriver || "",
            seat_number: 0,
            teacher: selectTeacher || "",
            student: selectStudent || "",
            color: "",
            bus_product_name: ""

        }
    });
    useEffect(() => {
        if (busData) {
            form.reset({
                school_id: userId,
                bus_product_name: busData[0]?.bus_product_name,
                bus_number: busData[0]?.bus_number,
                color: busData[0]?.color,
                seat_number: busData[0]?.seat_number,
                teacher: selectTeacher,
                driver: selectBusDriver,
            });
        }
    }, [busData, form, userId]);

    const onSubmit = (values: z.infer<typeof BusSchema>) => {
        console.log(values)
        startTransition(async () => {
            setSubmittedData(values)
        })
    }

    const handleTeacherChange = (value: string) => {
        setSelectedTeacher(value);
        form.setValue("teacher", value);
    };
    const handleDriverChange = (value: string) => {
        setSelectedBusDriver(value);

        form.setValue("driver", value);
    };

    return (
        <div className="">
            <h2 className="text-center font-semibold text-2xl p-4">Edit Bus Details</h2>
            <div className=" flex ">
                <div className="flex-1 px-5 ">

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
                                                        className="py-3 border-none bg-[var(--bgSoft)] outline-none h-12"
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
                                                        className="py-3 border-none bg-[var(--bgSoft)] outline-none h-12"
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
                                                        className="py-3 border-none bg-[var(--bgSoft)] outline-none h-12"
                                                        onChange={(e) => field.onChange(Number(e.target.value))}

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
                                                        className="py-3 border-none bg-[var(--bgSoft)] outline-none h-12"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            <div className="flex  justify-between w-full gap-3 ">
                                <div className="w-3/6">
                                    {
                                        teachersData &&
                                        < SelectDataProperty placeholder="Select Bus Teacher" label="Select Teachers" data={teachersData.teacher} handleSelectChange={handleTeacherChange} />
                                    }
                                </div>
                                <div className="w-3/6">
                                    {
                                        driversData &&
                                        < SelectDataProperty placeholder="Select Bus Driver" label="Select Drivers" data={driversData.driver} handleSelectChange={handleDriverChange} />
                                    }
                                </div>
                                {/* < SelectProperty placeholder="Select Bus Drivers" label="Bus Name" item="Bus A" /> */}
                            </div>

                            {/* <FormError message={isError} /> */}
                            {/* <FormSuccess message={isSuccess} /> */}
                            <Button
                                disabled={isPending}
                                size="lg" className="w-full bg-[teal] p-5" type="submit">Add Bus
                            </Button>
                        </form>
                    </Form>

                </div>
            </div>
        </div >
    )
}

export default SingleBus