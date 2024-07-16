"use client"
import * as z from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormControl, FormField, FormLabel, FormItem, FormMessage } from "@/components/ui/form"
import { Dispatch, SetStateAction, useEffect, useState, useTransition } from "react"
import { Input } from "@/components/ui/input"
import { DriverSchema } from "@/schemas"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import spinner from "@/public/images/spinner.gif"

import avatar from "@/public/images/avatar.jpg"
import { TeacherCardWrapper } from "@/components/ui/card-wrapper"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { usePost } from "@/hooks/usePost"
import { FormSuccess } from "@/components/ui/form-success"
import { useSession } from "next-auth/react"
import { useFetch } from "@/hooks/useFetch"


interface DriverModalProps {
    setIsOpenModal: Dispatch<SetStateAction<boolean>>
    isOpenModal?: boolean
    mode?: string
    route?: string
}

export const DriverModal = ({ isOpenModal, setIsOpenModal, mode, route }: DriverModalProps) => {

    const [isPending, startTransition] = useTransition()
    const [submittedData, setSubmittedData] = useState<object | undefined>(undefined);

    const [isError, setIsError] = useState("")
    const [isSuccess, setIsSuccess] = useState(false)
    const [dataMessage, setDataMessage] = useState("")
    const [selectAvatar, setSelectedAvatar] = useState<number>(0)
    const [newTryAvatar, setNewTryAvatar] = useState<string>("")
    const [selectImage, setSelectedImage] = useState<string>("")
    const [newAvatar, setNewAvatar] = useState<string>("")
    const [isLoadingImage, setisLoadingImage] = useState<boolean>(false)


    const { data, loading, errorMessage, success } = usePost("/api/adddriver", submittedData, "POST")
    const { data: session } = useSession()
    const userId = session?.user?.id



    const form = useForm<z.infer<typeof DriverSchema>>({
        resolver: zodResolver(DriverSchema),
        defaultValues: {
            school_id: userId,
            full_name: "",
            image: newAvatar,
            email: "",
            phone_number: "",
            address: "",
            bus_id: "",
            student_id: ""
        }
    })

    const onSubmit = (values: z.infer<typeof DriverSchema>) => {
        startTransition(() => {
            setSubmittedData(values)
        });
    };

    useEffect(() => {
        if (success && data) {
            setIsSuccess(success); // handle the response data
            setDataMessage(data.message);
        }
    }, [success]);

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
        setisLoadingImage(true)
        try {

            const data = new FormData()
            data.append('file', file)
            // data.append("upload_preset", 'images')

            const res = await fetch(`/api/upload/`, {
                method: 'POST',
                body: data,
            })

            if (res.ok) {
                const data = await res.json()
                setNewAvatar(data.url)
                window.localStorage.setItem("new_user_selected_avatar_url", data.url)
            }
        }
        catch (error) {
            console.log(error);
        } finally {
            setisLoadingImage(false)
        }
    }
    useEffect(() => {
        const storedSelectedAvatar = window.localStorage.getItem("new_user_selected_avatar_url")
        if (storedSelectedAvatar) {
            setNewAvatar(storedSelectedAvatar)
        }
    }, [])
    const handleCloseModal = () => {
        setIsOpenModal(false)
    }

    if (isSuccess) {
        return <FormSuccess message={dataMessage} setIsOpenModal={setIsOpenModal} />
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
            <div className="relative bg-gray-900  rounded-md w-4/6 ">
                <TeacherCardWrapper
                    headLabel={mode === "driver" ? "Add a Driver" : "Add a Teacher"}
                    action={() => handleCloseModal()}
                >

                    <div className=" flex  w-full ">
                        <div className=" w-[25%] flex  items-center  bg-[var(--bgSoft)] h-[14.5rem] p-2 rounded-md" >
                            <input
                                id="cameraInput"
                                type="file"
                                accept="image/*"
                                capture="environment"
                                style={{ display: 'none' }}
                                onChange={handleCameraInputChange}
                            />
                            <Image src={isLoadingImage ? spinner : newAvatar || avatar} alt="avatar" width={100} height={215} className="cursor-pointer rounded-md h-[13.5rem] w-full  object-fill" onClick={() => handleCameraClick()} />
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
                                                            placeholder="John Doe"
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
                                                name="phone_number"
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
                                    {
                                        mode === "driver" ? "" :
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
                                    }


                                    <div className="space-y-4">
                                        <FormField
                                            control={form.control}
                                            name="address"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Address</FormLabel>
                                                    <FormControl>
                                                        <Textarea
                                                            {...field}
                                                            className="py-3 border-none bg-[var(--bgSoft)] outline-none "
                                                            placeholder="Drivers Address..."
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
                                        size="lg" className="w-full" type="submit">Add Driver
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

