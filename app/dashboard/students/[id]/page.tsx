"use client"
import * as z from "zod"
import { CardWrapper } from "@/components/auth/card-wrapper"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormControl, FormField, FormLabel, FormItem, FormMessage } from "@/components/ui/form"
import { Dispatch, SetStateAction, useState, useTransition } from "react"
import { Input } from "@/components/ui/input"
import { StudentSchema } from "@/schemas"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import avatar from "@/public/images/avatar.jpg"
import { TeacherCardWrapper } from "@/components/ui/card-wrapper"
import { SelectProperty } from "@/components/ui/select-wrapper"

const SingleStudent = () => {
    const [isPending, startTransition] = useTransition()
    const [isError, setIsError] = useState("")
    const [isSuccess, setIsSuccess] = useState("")
    const [selectAvatar, setSelectedAvatar] = useState<number>(0)
    const [newTryAvatar, setNewTryAvatar] = useState<string>("")
    const [selectImage, setSelectedImage] = useState<string>("")
    const [newAvatar, setNewAvatar] = useState<string>("")

    const form = useForm<z.infer<typeof StudentSchema>>({
        resolver: zodResolver(StudentSchema),
        defaultValues: {
            full_name: "",
            email: "",
            parent: "",
            phoneNumber: "",
            address: "",
            image: "",
            grade: ""
        }
    })

    const onSubmit = () => {
        startTransition(() => { })
    }
    const handleCameraClick = () => {
        const inputElement = document.getElementById("cameraInput")
        inputElement?.click()
        // console.log(inputElement)
    }

    const handleCameraInputChange = async (event) => {
        const file = event.target.files[0]
        console.log(file)
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
            <h2 className="text-center font-semibold text-2xl p-4">Edit Student</h2>
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
                            <div className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="full_name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Full Name</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    placeholder="ciroma@email.com"
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
                            <div className="space-x-4 flex items-center w-full justify-between">
                                <div className="w-3/6">
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
                                                        className="py-3 border-none bg-[var(--bgSoft)] outline-none h-12"
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
                                        name="phoneNumber"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Phone Number</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        placeholder="08012345678"
                                                        type="phone"
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
                                    name="parent"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Parent Name</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    placeholder="Family Name"
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
                            <div className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="address"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Address</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    placeholder="Teachers Address"
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
                            <div className="flex  justify-between w-full ">
                                < SelectProperty placeholder="Grade" label="Student Grade" item="Grade A" />
                                < SelectProperty placeholder="Bus" label="Bus Name" item="Bus A" />
                            </div>
                            {/* <FormError message={isError} /> */}
                            {/* <FormSuccess message={isSuccess} /> */}
                            <Button
                                disabled={isPending}
                                size="lg" className="w-full bg-[teal] p-5" type="submit">Update Student
                            </Button>
                        </form>
                    </Form>
                </div>
            </div>
        </div>
    )
}

export default SingleStudent