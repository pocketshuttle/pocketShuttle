"use client"
import * as z from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormControl, FormField, FormLabel, FormItem, FormMessage } from "@/components/ui/form"
import { Dispatch, SetStateAction, useState, useTransition } from "react"
import { Input } from "@/components/ui/input"
import { BusSchema } from "@/schemas"
import { Button } from "@/components/ui/button"
import { SelectProperty } from "@/components/ui/select-wrapper"
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
    const [isError, setIsError] = useState("")
    const [isSuccess, setIsSuccess] = useState("")
    const [selectTeacher, setSelectedTeacher] = useState<string>("")
    const [selectBusDriver, setSelectedBusDriver] = useState<string>("")
    const [selectStudent, setSelectedStudent] = useState<string>("")
    const [newAvatar, setNewAvatar] = useState<string>("")
    const { toast } = useToast()


    const { data: teachersData, isPending: loading, errorMessage } = useFetch(`/api/addteacher/${userId}`, userId);
    const { data: busData, isPending: busPending, errorMessage: busError } = useFetch(`/api/addbus/${userId}`, userId);
    const { data: postData, loading: postLoading, errorMessage: postError, success } = usePost(`/api/addbus/${userId}`, submittedData, "PATCH")

    console.log(teachersData)

    const form = useForm<z.infer<typeof BusSchema>>({
        resolver: zodResolver(BusSchema),
        defaultValues: {
            school_id: '',
            bus_number: '',
            driver: selectBusDriver || "",
            teacher: selectTeacher || "",
            student: '',
            color: '',
            bus_product_name: '',
        },
    });

    const onSubmit = (values: z.infer<typeof BusSchema>) => {
        startTransition(async () => {
            setSubmittedData(values)
        })
    }

    const handleTeacherChange = (value: string) => {
        setSelectedTeacher(value);
        form.setValue("teacher", value);
    };

    console.log(selectTeacher)

    return (
        <div className="">
            <h2 className="text-center font-semibold text-2xl p-4">Edit Bus Details</h2>
            <div className=" flex ">
                <div className="flex-1 px-5 ">

                    <Form {...form}>
                        {/* the handle submit comes from the form constant */}
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <div >
                                <FormField
                                    control={form.control}
                                    name="driver"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Driver Name</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    placeholder="John Doe"
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

                            <div className="space-x-4 flex items-center w-full justify-between">

                                <div className="space-y-4 w-3/6">
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
                                    >

                                    </FormField>
                                </div>
                                <div className="w-3/6">
                                    <FormField
                                        control={form.control}
                                        name="seat_number"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Seat Number</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        placeholder="50"
                                                        type="text"
                                                        disabled={isPending}
                                                        className="py-3 border-none bg-[var(--bgSoft)] outline-none h-12"
                                                    />
                                                </FormControl>
                                                <FormMessage />

                                                {/* <Image src={eye} alt="eye" /> */}
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">

                                <FormField
                                    control={form.control}
                                    name="teacher"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Teacher Name</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    placeholder="Teacher Name"
                                                    type="text"
                                                    disabled={isPending}
                                                    className="py-3 border-none bg-[var(--bgSoft)] outline-none h-12"
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

                            </div>

                            <div className="flex  justify-between w-full gap-3 ">
                                < SelectDataProperty placeholder="Select Bus Teacher" label="Select Teachers" data={teachersData} handleSelectChange={handleTeacherChange} />
                                {/* < SelectProperty placeholder="Select Bus Drivers" label="Bus Name" item="Bus A" /> */}
                            </div>
                            {/* <FormError message={isError} /> */}
                            {/* <FormSuccess message={isSuccess} /> */}
                            <Button
                                disabled={isPending}
                                size="lg" className="w-full bg-[teal] p-5" type="submit">Update Bus
                            </Button>
                        </form>
                    </Form>
                </div>
            </div>
        </div >
    )
}

export default SingleBus