"use client"
import * as z from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormControl, FormField, FormLabel, FormItem, FormMessage } from "@/components/ui/form"
import { Dispatch, SetStateAction, useState, useTransition } from "react"
import { Input } from "@/components/ui/input"
import { TeacherSchema } from "@/schemas"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import avatar from "@/public/images/avatar.jpg"
import { TeacherCardWrapper } from "@/components/ui/card-wrapper"
import { BiCloset } from "react-icons/bi"
import { IoMdClose } from "react-icons/io"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"


interface DriverModalProps {
    setIsOpenModal: Dispatch<SetStateAction<Boolean>>
    isOpenModal: boolean
}

export const DriverAndTeacherModal = ({ isOpenModal, setIsOpenModal }: DriverModalProps) => {

    const [isPending, startTransition] = useTransition()
    const [isError, setIsError] = useState("")
    const [isSuccess, setIsSuccess] = useState("")
    const [selectAvatar, setSelectedAvatar] = useState<number>(0)
    const [newTryAvatar, setNewTryAvatar] = useState<string>("")
    const [selectImage, setSelectedImage] = useState<string>("")
    const [newAvatar, setNewAvatar] = useState<string>("")
    const { toast } = useToast()

    const form = useForm<z.infer<typeof TeacherSchema>>({
        resolver: zodResolver(TeacherSchema),
        defaultValues: {
            full_name: "",
            email: "",
            password: "",
            phoneNumber: "",
            address: "",
            image: "images",
            // busId: "12345de3e3resd466"
        }
    })

    const onSubmit = (values: z.infer<typeof TeacherSchema>) => {
        // setIsError("");
        // setIsSuccess("");
        console.log("Form values:", values); // Log the form values

        startTransition(async () => {
            try {
                const res = await fetch("/api/addteacher", {
                    method: "POST",
                    body: JSON.stringify(values),
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
                if (res.ok) {
                    const response = await res.json();
                    console.log("success", response);
                    toast({
                        title: "Teacher Added Succesfully",
                        description: "You successfulluy adderd a teacher",
                    })
                    setIsSuccess("Teacher added successfully");
                } else {
                    console.log(res);
                    setIsError("Failed to add teacher");
                }
            } catch (error) {
                console.log(error);
                setIsError("An error occurred while adding the teacher");
            }
        });
    };
    const handleCameraClick = () => {
        const inputElement = document.getElementById("cameraInput")
        inputElement?.click()
        // console.log(inputElement)
    }
    const handleCameraInputChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
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
    const handleCloseModal = () => {
        setIsOpenModal(false)
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
            <div className="relative bg-gray-900  rounded-md w-5/6 ">

                <TeacherCardWrapper
                    headLabel="Add a Teacher"
                    action={() => handleCloseModal()}
                >

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
                                                                type="number"
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
                                    {/* <div className="space-y-4">

                                    </div> */}
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
                                                            placeholder="Teachers Address..."
                                                            type="text"
                                                            disabled={isPending}
                                                            className="py-3 border-none bg-[var(--bgSoft)] outline-none h-12"
                                                        />
                                                        {/* <Textarea
                                                            {...field}
                                                            className="py-3 border-none bg-[var(--bgSoft)] outline-none "
                                                            placeholder="Teachers Address..."
                                                            disabled={isPending}
                                                        /> */}
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
                                        // disabled={isPending}
                                        size="lg" className="w-full" type="submit">Add teacher
                                    </Button>
                                </form>
                            </Form>
                        </div>
                    </div>
                </TeacherCardWrapper>

            </div>
        </div>
    )
}

