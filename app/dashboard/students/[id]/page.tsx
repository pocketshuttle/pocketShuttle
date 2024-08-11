"use client"
import * as z from "zod"
import { CardWrapper } from "@/components/auth/card-wrapper"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormControl, FormField, FormLabel, FormItem, FormMessage } from "@/components/ui/form"
import { ChangeEvent, Dispatch, SetStateAction, useEffect, useState, useTransition } from "react"
import { Input } from "@/components/ui/input"
import { StudentSchema } from "@/schemas"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import avatar from "@/public/images/avatar.jpg"
import { TeacherCardWrapper } from "@/components/ui/card-wrapper"
import { SelectProperty } from "@/components/ui/select-wrapper"
import { usePathname } from "next/navigation"
import { useFetch } from "@/hooks/useFetch"
import { Textarea } from "@/components/ui/textarea"
import { SelectBusWrapper } from "@/components/Teachers/ui/select-bus-wrapper"
import { useSession } from "next-auth/react"
import { grades, buses, gender } from "@/data/schooldata"
import spinner from "@/public/images/spinner.gif"
import { usePost } from "@/hooks/usePost"
import { BeatLoader } from "react-spinners"
import { Spinner } from "@/components/ui/spinner"



const SingleStudent = () => {
    const pathname = usePathname()
    const id = pathname.split('/').pop()

    const { data: session } = useSession()
    const userId = session?.user?.id

    const { data, isPending: studentPending, errorMessage: studentError } = useFetch(`/api/addstudent/${id}`, id);
    const { data: busData, isPending: busPending, errorMessage: busError } = useFetch(`/api/addbus/${userId}`, userId);

    const studentData = data?.students

    console.log(studentData)

    const [isPending, startTransition] = useTransition()
    const [isError, setIsError] = useState("")
    const [isSuccess, setIsSuccess] = useState("")
    const [selectAvatar, setSelectedAvatar] = useState<number>(0)
    const [newTryAvatar, setNewTryAvatar] = useState<string>("")
    const [selectImage, setSelectedImage] = useState<string>("")
    const [newAvatar, setNewAvatar] = useState<string>("")
    const [selectGender, setSelectGender] = useState<string>("")
    const [selectGrade, setClassGrade] = useState<string>("")
    const [isLoadingImage, setisLoadingImage] = useState<boolean>(false)

    const [selectBus, setSelectBus] = useState<string>("")
    const [selectParent, setSelectParent] = useState<string>("")
    const [selectDriver, setSelectDriver] = useState<string>("")
    const [selectTeacher, setSelectTeacher] = useState<string>("")
    const [filterGrade, setFilterGrade] = useState<string>("")
    const [submittedData, setSubmittedData] = useState<object | undefined>(undefined);

    const { data: postData, loading, errorMessage, success } = usePost(`/api/addstudent/${id}`, submittedData, "PATCH")

    const form = useForm<z.infer<typeof StudentSchema>>({
        resolver: zodResolver(StudentSchema),
        defaultValues: {
            school_id: userId || "",
            full_name: "",
            age: 0,
            image: newAvatar || "",
            parentId: selectParent || "",
            teacherId: selectTeacher || undefined,
            driverId: selectDriver || "",
            busId: "",
            address: "",
            grade: selectGrade || "",
            gender: selectGender || "",
        }
    })

    useEffect(() => {
        if (studentData) {
            form.reset({
                school_id: userId,
                full_name: studentData[0]?.full_name,
                address: studentData[0]?.address,
                age: studentData[0]?.age,
                image: newAvatar || studentData[0]?.image,
                gender: studentData?.[0]?.gender,
                grade: studentData?.[0]?.grade
            });
        }
    }, [studentData, form, userId]);

    const onSubmit = (values: z.infer<typeof StudentSchema>) => {
        startTransition(() => {
            setSubmittedData(values)
        })
    }
    const handleCameraClick = () => {
        const inputElement = document.getElementById("cameraInput")
        inputElement?.click()
        // console.log(inputElement)
    }

    const handleCameraInputChange = async (event: ChangeEvent<HTMLInputElement>) => {

        const file = event?.target?.files[0]

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
    const handleGenderChange = (value: string) => {
        setSelectGender(value);
        form.setValue("gender", value); // Update form value
    };
    const handleSelectBus = (value: string) => {
        setSelectBus(value);
        form.setValue("busId", value);
    };
    const handleSelectParent = (value: string) => {
        setSelectParent(value);
        form.setValue("parentId", value);
    };

    const handleGradeChange = (value: string) => {
        setClassGrade(value);
        form.setValue("grade", value);
    };


    return (
        <div className="">
            <h2 className="text-center font-semibold text-2xl p-4">Edit Student</h2>
            {
                studentPending ? <Spinner /> :
                    (<div className=" flex ">
                        <div className=" w-[25%] items-center  bg-[var(--bgSoft)] h-[15.8rem] p-2 rounded-md" >
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
                                    studentData && studentData[0]?.image ?
                                        studentData[0]?.image : avatar

                            } alt="avatar" className="cursor-pointer rounded-md object-fill object-center w-full " width={300} height={100} onClick={() => handleCameraClick()} />
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
                                    <div className="space-x-4 flex items-center w-full justify-center">
                                        <div className="w-5/6">
                                            <FormField
                                                control={form.control}
                                                name="age"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Age</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                {...field}
                                                                placeholder="mm/dd/yyyy"
                                                                type="number"
                                                                disabled={isPending}
                                                                className="py-3 border-none bg-[var(--bgSoft)] outline-none h-12"
                                                                onChange={e => field.onChange(Number(e.target.value))}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <div className="w-full">
                                            < SelectProperty placeholder="Gender" label="Student Grade" data={gender} handleSelectChange={handleGenderChange} mode="edit"
                                                edit={studentData?.[0]?.gender}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex space-x-3 justify-between w-full ">
                                        < SelectProperty placeholder="Grade" label="Select Grade" data={grades} handleSelectChange={handleGradeChange} mode="edit"
                                            edit={studentData?.[0]?.grade}
                                        />
                                        <div className="w-full">
                                            {
                                                busData &&
                                                < SelectBusWrapper placeholder="Select Bus" label="Select Bus" data={busData} handleSelectChange={handleSelectBus} classname="ks" />
                                            }
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <FormField
                                            control={form.control}
                                            name="address"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Student Address</FormLabel>
                                                    <FormControl>
                                                        <Textarea
                                                            {...field}
                                                            placeholder="Student Address..."
                                                            disabled={isPending}
                                                            className="py-3 border-none bg-[var(--bgSoft)] outline-none "
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
                                        size="lg" className="w-full bg-[teal] p-5" type="submit">
                                        Update Student
                                    </Button>
                                </form>
                            </Form>
                        </div>
                    </div>)
            }
        </div>
    )
}

export default SingleStudent