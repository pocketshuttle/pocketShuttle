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
import avatar from "@/public/images/avatar.jpg"
import { TeacherCardWrapper } from "@/components/ui/card-wrapper"
import { Textarea } from "@/components/ui/textarea"
import { usePost } from "@/hooks/usePost"
import { FormSuccess } from "@/components/ui/form-success"
import { useFetch } from "@/hooks/useFetch"
import { usePathname, useSearchParams } from "next/navigation"
import { SelectTrigger } from "@/components/ui/select"
import { SelectProperty } from "@/components/ui/select-wrapper"
import spinner from "@/public/images/spinner.gif"
import { SelectDataProperty } from "@/components/ui/select-data-wrapper"
import { SelectBusWrapper } from "@/components/Teachers/ui/select-bus-wrapper"
import { Spinner } from "@/components/ui/spinner"
import { AddressComponent } from "@/components/maps/Map/searchbox"
import { useSession } from "@/hooks/useSession"


const SingleDriverPage = () => {

    const [isPending, startTransition] = useTransition()
    const [submittedData, setSubmittedData] = useState<object | undefined>(undefined);
    const [isError, setIsError] = useState("")
    const [isSuccess, setIsSuccess] = useState(false)
    const [dataMessage, setDataMessage] = useState("")
    const [addressValue, setAddressValue] = useState("")
    const [newAvatar, setNewAvatar] = useState<string>("")

    const [selectBus, setSelectedBus] = useState<string>("")

    const pathname = usePathname()
    const id = pathname.split('/').pop()

    const session = useSession()
    const userId = session?.id
    const { data: busData, isPending: busPending, errorMessage: busError } = useFetch(`/api/addbus/${userId}`, userId);
    const [newData, setNewData] = useState(null)

    const { data, loading, errorMessage, success } = usePost(`/api/addriver/${id}`, submittedData, "PATCH")
    const { data: driversData, isPending: isLoading, errorMessage: editMessage } = useFetch(`/api/addriver/${id}`, userId);
    const driverData = driversData?.driver
    const [isLoadingImage, setisLoadingImage] = useState<boolean>(false)

    const form = useForm<z.infer<typeof DriverSchema>>({
        resolver: zodResolver(DriverSchema),
        defaultValues: {
            school_id: userId,
            full_name: "",
            email: "",
            phoneNumber: "",
            address: "",
            busId: selectBus || driverData?.[0].busId,
            // studentId: selectStudent || "",
            image: newAvatar || driverData?.[0].image,
        }
    })

    useEffect(() => {
        if (driverData) {
            form.reset({
                school_id: userId,
                full_name: driverData[0]?.full_name,
                email: driverData[0]?.email,
                phoneNumber: driverData[0]?.phoneNumber,
                address: driverData[0]?.address,
                image: newAvatar || driverData?.[0].image,
                busId: selectBus || driverData?.[0].busId
            });
        }
    }, [driverData, form, userId]);

    useEffect(() => {
        if (userId) {
            form.setValue('school_id', userId);  // Set the userId after session is loaded
        }
    }, [userId, form])

    useEffect(() => {
        setNewData(driverData && driverData[0].full_name)
    }, [id, driverData])

    const onSubmit = (values: z.infer<typeof DriverSchema>) => {
        startTransition(() => {
            setSubmittedData(values)
            window.localStorage.removeItem("user_selected_avatar_url")
        });
    };

    useEffect(() => {
        if (success && data) {
            setIsSuccess(success);
            //@ts-ignore
            setDataMessage(data.message);
        }
    }, [success]);

    const handleSuggestionChange = (d: {}) => {
        // setAddressValue(d)
        // const selectedValue = d.features?.[0]?.place_name || "";
        console.log(d)
        // form.setValue("address", d)
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
        setisLoadingImage(true)
        try {
            const data = new FormData()
            data.append('file', file)

            const res = await fetch(`/api/upload/`, {
                method: 'POST',
                body: data,
            })

            if (res.ok) {
                const data = await res.json()
                setNewAvatar(data.url)
                form.setValue("image", data.url)

                window.localStorage.setItem('user_selected_avatar_url', data.url)

            }
        }
        catch (error) {
            console.log(error);
        } finally {
            setisLoadingImage(false)
        }
    }

    useEffect(() => {
        const storedSelectedAvatar = window.localStorage.getItem('user_selected_avatar_url');
        if (storedSelectedAvatar) {
            setNewAvatar(storedSelectedAvatar);
        }
    }, [])

    const handleSelectBus = (value: string) => {
        setSelectedBus(value)
        //@ts-ignore
        form.setValue("busId", value.id)
    }

    const handleAddressChange = (d: string) => {
        setAddressValue(d)

        form.setValue("address", d)
    }
    // useEffect(() => {
    //     window.localStorage.setItem('user_selected_avatar_url', newAvatar)
    // }, [newAvatar])


    // if (isSuccess) {
    //     return <FormSuccess message={dataMessage} setIsOpenModal={setIsOpenModal} />
    // }


    return (
        <div >
            <div >
                <div>
                    <h1 className="text-center p-3 text-xl">Update driver</h1>
                </div>
                {
                    isLoading ? <Spinner /> :
                        (<div className=" flex ">
                            <div className=" w-[25%] items-center  bg-[var(--bgSoft)] h-[14.5rem] p-2 rounded-md" >
                                <input
                                    id="cameraInput"
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    style={{ display: 'none' }}
                                    onChange={handleCameraInputChange}
                                />

                                <Image src={
                                    newAvatar ? isLoadingImage ? spinner : newAvatar :
                                        driverData && driverData[0]?.image ?
                                            driverData[0]?.image : avatar
                                } alt="avatar" width={100} height={215} className="cursor-pointer rounded-md h-[13.5rem] w-full  object-fill" onClick={() => handleCameraClick()} />
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
                                            <FormItem>
                                                <FormLabel>Drivers Address</FormLabel>
                                                <AddressComponent handleAddressChange={handleAddressChange} value={addressValue} handleSuggestionChange={handleSuggestionChange} />
                                                <FormMessage />
                                            </FormItem>
                                        </div>
                                        <div className="flex gap-3">
                                            <div className="w-3/6">
                                                {
                                                    busData &&
                                                    < SelectBusWrapper placeholder="Select Bus" label="Select Bus" data={busData} handleSelectChange={handleSelectBus} classname="" edit={driverData[0]?.bus} />
                                                }
                                            </div>
                                        </div>
                                        {/* <FormError message={isError} /> */}
                                        {/* <FormSuccess message={isSuccess} /> */}
                                        <Button
                                            // disabled={isPending}
                                            size="lg" className="w-full" type="submit">Update driver
                                        </Button>
                                    </form>
                                </Form>
                            </div>
                        </div>)

                }
            </div>
        </div>
    )
}

export default SingleDriverPage
