"use client"
import * as z from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormControl, FormField, FormLabel, FormItem, FormMessage } from "@/components/ui/form"
import { Dispatch, SetStateAction, useState, useTransition } from "react"
import { Input } from "@/components/ui/input"
import { BusSchema } from "@/schemas"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import avatar from "@/public/images/avatar.jpg"
import { SelectProperty } from "@/components/ui/select-wrapper"
import { useToast } from "@/components/ui/use-toast"

const SingleBus = () => {
    const [isPending, startTransition] = useTransition()
    const [isError, setIsError] = useState("")
    const [isSuccess, setIsSuccess] = useState("")
    const [selectAvatar, setSelectedAvatar] = useState<number>(0)
    const [newTryAvatar, setNewTryAvatar] = useState<string>("")
    const [selectImage, setSelectedImage] = useState<string>("")
    const [newAvatar, setNewAvatar] = useState<string>("")
    const { toast } = useToast()

    const form = useForm<z.infer<typeof BusSchema>>({
        resolver: zodResolver(BusSchema),
        defaultValues: {
            bus_number: "",
            driver: "",
            seat_number: "",
            teacher: "",
            student: "students",
            image: "images",
        }
    })

    const onSubmit = (values: z.infer<typeof BusSchema>) => {
        startTransition(async () => {
            try {
                const res = await fetch("/api/addbus", {
                    method: "POST",
                    body: JSON.stringify(values),
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                if (res.ok) {
                    setIsSuccess("Bus added successfully")
                    toast({
                        title: "Teacher Added Succesfully",
                        description: "You successfulluy adderd a teacher",
                    })
                } else {
                    setIsError("Something went wrong")
                    toast({
                        title: "Failed",
                        description: "Something went wrong",
                    })
                }
            } catch (error) {
                setIsError("An error occurred while adding the teacher");

            }
        })
    }
    const handleCameraClick = () => {
        const inputElement = document.getElementById("cameraInput")
        inputElement?.click()
        // console.log(inputElement)
    }

    const handleCameraInputChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onload = async () => {
                await uploadFile(file)
            }
            if (reader.readyState === FileReader.EMPTY) {
                reader.readAsDataURL(file);
            } else {
                console.error('FileReader is busy reading another file.');
            }
        }
    }

    const uploadFile = async (file: any) => {
        try {
            const data = new FormData()
            data.append('file', file)
            // data.append("upload_preset", 'images')

            const res = await fetch(`api/upload`, {
                method: 'POST',
                body: data,
            })

            if (res.ok) {
                const data = await res.json()
                setNewAvatar(data.url)
                console.log(newAvatar);
            }
        }
        catch (error) {
            console.log(error);
        }
    }

    return (
        <div className="">
            <h2 className="text-center font-semibold text-2xl p-4">Edit Bus Details</h2>
            <div className=" flex ">
                <div className=" w-[25%] items-center  bg-[var(--bgSoft)] h-[14.5rem] p-2 rounded-md" >
                    <input
                        id="cameraInput"
                        type="file"
                        accept="image/*"
                        capture="environment"
                        style={{ display: 'none' }}
                        onChange={handleCameraInputChange}
                    />
                    <Image src={avatar} alt="avatar" className="cursor-pointer rounded-md h-[13.5rem] w-24% object-fill" onClick={() => handleCameraClick()} />
                </div>
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

                            {/* <div className="flex  justify-between w-full ">
                                < SelectProperty placeholder="Grade" label="Student Grade" item="Grade A" />
                                < SelectProperty placeholder="Bus" label="Bus Name" item="Bus A" />
                            </div> */}
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