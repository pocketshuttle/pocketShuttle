"use client"
import * as z from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormControl, FormField, FormLabel, FormItem, FormMessage } from "@/components/ui/form"
import { Dispatch, SetStateAction, useEffect, useState, useTransition } from "react"
import { Input } from "@/components/ui/input"
import { TeacherSchema, DriverSchema } from "@/schemas"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import spinner from "@/public/images/spinner.gif"

import avatar from "@/public/images/avatar.jpg"
import { TeacherCardWrapper } from "@/components/ui/card-wrapper"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { usePost } from "@/hooks/usePost"
import { FormSuccess } from "@/components/ui/form-success"

import { useFetch } from "@/hooks/useFetch"
import { SelectBusWrapper } from "@/components/Teachers/ui/select-bus-wrapper"
import { SelectDataProperty } from "@/components/ui/select-data-wrapper"
import { AddRoles } from "@/components/ui/add-role"
import { useSession } from "@/hooks/useSession"
import { SearchBox } from "@mapbox/search-js-react";
import { AddressComponent } from "@/components/maps/Map/searchbox"


interface DriverModalProps {
    setIsOpenModal: Dispatch<SetStateAction<boolean>>
    isOpenModal?: boolean
    mode?: string
    route?: string
}

export const DriverAndTeacherModal = ({ isOpenModal, setIsOpenModal, mode, route }: DriverModalProps) => {


    const session = useSession()
    const userId = session?.id

    const [isPending, startTransition] = useTransition()
    const [submittedData, setSubmittedData] = useState<object | undefined>(undefined);
    const [addressValue, setAddressValue] = useState('');
    const [isError, setIsError] = useState("")
    const [isSuccess, setIsSuccess] = useState(false)
    const [dataMessage, setDataMessage] = useState("")
    const [newAvatar, setNewAvatar] = useState<string>("")
    const [isLoadingImage, setisLoadingImage] = useState<boolean>(false)
    const [selectBus, setSelectedBus] = useState<string>("")
    const [selectStudent, setSelectedStudent] = useState<string>("")
    const [selectedRole, setSelectedRole] = useState<string>("")
    const url = mode === "driver" ? "/api/addriver" : "/api/addteacher"
    const { data, loading, errorMessage, success } = usePost(`${url}`, submittedData, "POST")

    const { data: busData, isPending: busPending, errorMessage: busError } = useFetch(`/api/addbus/${userId}`, userId);
    const { data: studentData, isPending: studentPending, errorMessage: studentError } = useFetch(`/api/addstudent/${userId}`, userId);


    const useSchema = mode === "driver" ? DriverSchema : TeacherSchema

    const form = useForm<z.infer<typeof useSchema>>({
        resolver: zodResolver(useSchema),
        defaultValues: {
            school_id: "",
            full_name: "",
            email: "",
            phoneNumber: "",
            address: "",
            busId: selectBus || "",
            studentId: selectStudent || "",
            image: newAvatar,
            password: "",
            role: selectedRole || ""
        }
    })

    useEffect(() => {
        if (!session.loading && userId) {
            form.setValue("school_id", userId); // Dynamically update form with userId
        }
    }, [session.loading, userId, form]);

    const onSubmit = (values: z.infer<typeof useSchema>) => {
        if (userId) {
            values.school_id = userId;
        }
        startTransition(() => {
            setSubmittedData(values)
            window.localStorage.removeItem("new_user_selected_avatar_url")
        });
    };

    useEffect(() => {
        if (success && data) {
            setIsSuccess(success);
            //@ts-ignore
            setDataMessage(data.message);
        }
    }, [success]);

    const handleCameraClick = () => {
        const inputElement = document.getElementById("cameraInput")
        inputElement?.click()
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
                form.setValue("image", data.url)

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
    const handleSelectBus = (value: string) => {
        const parsedValue = JSON.parse(value)
        setSelectedBus(parsedValue.id)

        form.setValue("busId", parsedValue.id)
    }
    const handleSelectRole = (value: string) => {
        setSelectedRole(value)
        console.log(value)
        form.setValue("role", value)
    }
    const handleSelectStudent = (value: string) => {
        setSelectedStudent(value)
        form.setValue("studentId", value)
    }
    const handleAddressChange = (d: string) => {
        setAddressValue(d)

        form.setValue("address", d)
    }

    if (isSuccess) {
        return <FormSuccess message={dataMessage} setIsOpenModal={setIsOpenModal} />
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
            <div className="relative bg-gray-900  rounded-md w-5/6 ">
                <TeacherCardWrapper
                    headLabel={mode === "driver" ? "Add a Driver" : "Add a Teacher"}
                    action={() => handleCloseModal()}
                >

                    <div className=" flex ">
                        <div className=" w-[25%] items-center  bg-[var(--bgSoft)] h-[23.5rem] p-2 rounded-md" >
                            <input
                                id="cameraInput"
                                type="file"
                                accept="image/*"
                                capture="environment"
                                style={{ display: 'none' }}
                                onChange={handleCameraInputChange}
                            />
                            <Image src={isLoadingImage ? spinner : newAvatar || avatar} alt="avatar" width={100} height={215} className="cursor-pointer rounded-md h-[22.5rem] w-full  object-fill" onClick={() => handleCameraClick()} />
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
                                    {
                                        mode !== "driver" &&
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

                                        <FormItem>
                                            <FormLabel>Address</FormLabel>
                                            <  AddressComponent handleAddressChange={handleAddressChange} value={addressValue} />
                                            <FormMessage />

                                        </FormItem>

                                    </div>
                                    <div className="flex gap-3 w-full">
                                        <div className="w-3/6">
                                            {
                                                busData &&
                                                < SelectBusWrapper placeholder="Select Bus" label="Select Bus" data={busData} handleSelectChange={handleSelectBus} classname="hello" />
                                            }
                                        </div>
                                        {
                                            mode === "teacher" &&
                                            <div className="w-3/6" >
                                                < AddRoles handleSelectChange={handleSelectRole} />
                                            </div>
                                        }
                                    </div>

                                    {/* <FormError message={isError} /> */}
                                    {/* <FormSuccess message={isSuccess} /> */}
                                    <Button
                                        disabled={session?.loading}
                                        size="lg" className="w-full bg-[teal] " type="submit">{mode === "driver" ? "Add Driver" : "Add Teacher"}
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

