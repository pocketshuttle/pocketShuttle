"use client"
import * as z from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormControl, FormField, FormLabel, FormItem, FormMessage } from "@/components/ui/form"
import { Dispatch, SetStateAction, useEffect, useState, useTransition } from "react"
import { Input } from "@/components/ui/input"
import { TeacherSchema } from "@/schemas"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import avatar from "@/public/images/avatar.jpg"
import { TeacherCardWrapper } from "@/components/ui/card-wrapper"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { usePost } from "@/hooks/usePost"
import { FormSuccess } from "@/components/ui/form-success"
import { useSession } from "next-auth/react"
import { useFetch } from "@/hooks/useFetch"
import { usePathname, useSearchParams } from "next/navigation"
import { SelectTrigger } from "@/components/ui/select"
import { SelectProperty } from "@/components/ui/select-wrapper"


interface SingleTeacherlProps {
    setIsOpenModal: Dispatch<SetStateAction<boolean>>
    isOpenModal?: boolean
    mode?: string
    route?: string
}

const SingleTeacherPage = ({ isOpenModal, setIsOpenModal, mode, route }: SingleTeacherlProps) => {

    const [isPending, startTransition] = useTransition()
    const [submittedData, setSubmittedData] = useState(null);

    const [isError, setIsError] = useState("")
    const [isSuccess, setIsSuccess] = useState(false)
    const [dataMessage, setDataMessage] = useState("")
    const [selectAvatar, setSelectedAvatar] = useState<number>(0)
    const [newTryAvatar, setNewTryAvatar] = useState<string>("")
    const [selectImage, setSelectedImage] = useState<string>("")
    const [newAvatar, setNewAvatar] = useState<string>("")
    const pathname = usePathname()
    const id = pathname.split('/').pop()
    const { data: session } = useSession()
    const userId = session?.user?.id

    const [newData, setNewData] = useState(null)

    const { data, loading, errorMessage, success } = usePost(`/api/addteacher/${id}`, submittedData, "PATCH")
    const { data: teacherData, isPending: isLoading, errorMessage: editMessage } = useFetch(`/api/addteacher/${id}`, userId);

    const form = useForm<z.infer<typeof TeacherSchema>>({
        resolver: zodResolver(TeacherSchema),
        defaultValues: {
            userId: userId,
            full_name: teacherData && teacherData[0].full_name,
            email: "",
            password: "",
            phoneNumber: "",
            address: "",
            image: "",
            busId: ""
        }
    })
    useEffect(() => {
        if (teacherData) {
            form.reset({
                userId: userId,
                full_name: teacherData[0]?.full_name,
                email: teacherData[0]?.email,
                phoneNumber: teacherData[0]?.phoneNumber,
                address: teacherData[0]?.address,
                image: teacherData[0]?.image,
            });
        }
    }, [teacherData, form, userId]);

    useEffect(() => {
        setNewData(teacherData && teacherData[0].full_name)
    }, [id, teacherData])

    const onSubmit = (values: z.infer<typeof TeacherSchema>) => {
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
    if (isLoading) {
        return <p>Loading...</p>;
    }
    if (isSuccess) {
        return <FormSuccess message={dataMessage} setIsOpenModal={setIsOpenModal} />
    }


    return (
        <div >
            <div >
                <div>
                    <h1 className="text-center p-3 text-xl">Update Teacher</h1>
                </div>
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
                                                        placeholder="Teachers Address..."
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
                                <div>
                                    {
                                        teacherData[0].busId && <SelectProperty />
                                    }

                                </div>
                                {/* <FormError message={isError} /> */}
                                {/* <FormSuccess message={isSuccess} /> */}
                                <Button
                                    // disabled={isPending}
                                    size="lg" className="w-full" type="submit">Update teacher
                                </Button>
                            </form>
                        </Form>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default SingleTeacherPage
