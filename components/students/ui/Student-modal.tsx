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
import { grades, buses, gender } from "@/data/schooldata"
import { usePost } from "@/hooks/usePost"
import { SelectBusWrapper } from "@/components/Teachers/ui/select-bus-wrapper"
import { useFetch } from "@/hooks/useFetch"
import { Textarea } from "@/components/ui/textarea"
import { UploadImage } from "@/components/ui/upload-image"
import { FormSuccess } from "@/components/ui/form-success"
import { useSession } from "@/hooks/useSession"
import { AddressComponent } from "@/components/maps/Map/searchbox"

interface StudentModalProps {
    setIsOpenModal: Dispatch<SetStateAction<boolean>>
    isOpenModal: boolean
}

export const StudentModal = ({ isOpenModal, setIsOpenModal }: StudentModalProps) => {
    const [submittedData, setSubmittedData] = useState<object | undefined>(undefined);
    const [isPending, startTransition] = useTransition()
    const [isError, setIsError] = useState("")
    const [isSuccess, setIsSuccess] = useState("")
    const [newAvatar, setNewAvatar] = useState<string>("")

    const [selectGender, setSelectGender] = useState<string>("")
    const [selectGrade, setClassGrade] = useState<string>("")
    const [selectBus, setSelectBus] = useState<string>("")
    const [selectParent, setSelectParent] = useState<string>("")
    const [selectDriver, setSelectDriver] = useState<string>("")
    const [selectTeacher, setSelectTeacher] = useState<string>("")
    const [addressValue, setAddressValue] = useState("")


    const session = useSession()
    const userId = session?.id


    const { data, loading, errorMessage, success } = usePost("/api/addstudent", submittedData, "POST")
    const { data: busData, isPending: busPending, errorMessage: busError } = useFetch(`/api/addbus/${userId}`, userId);

    const form = useForm<z.infer<typeof StudentSchema>>({
        resolver: zodResolver(StudentSchema),
        defaultValues: {
            school_id: "",
            full_name: "",
            age: 0,
            image: newAvatar || "",
            parentId: selectParent || "",
            teacherId: selectTeacher || undefined,
            driverId: selectDriver || "",
            busId: selectBus || undefined,
            address: "",
            grade: selectGrade || "",
            gender: selectGender || "",
        }
    })

    useEffect(() => {
        if (!session.loading && userId) {
            form.setValue("school_id", userId);
        }
    }, [session.loading, userId, form]);

    const onSubmit = (values: z.infer<typeof StudentSchema>) => {
        if (userId) {
            values.school_id = userId;
        }
        startTransition(() => {
            setSubmittedData(values)
            // setNewAvatar("")
        });

    }

    const handleCloseModal = () => {
        setIsOpenModal(false)
    }

    const handleGenderChange = (value: string) => {
        setSelectGender(value);
        form.setValue("gender", value); // Update form value
    };
    const handleSelectBus = (value: string) => {
        const parsedValue = JSON.parse(value)
        setSelectBus(parsedValue.id)
        form.setValue("busId", parsedValue.id);
    };

    const handleSelectParent = (value: string) => {
        setSelectParent(value);
        form.setValue("parentId", value);
    };
    const handleSuggestionChange = (d: unknown) => {
        // setAddressValue(d)
        // const selectedValue = d.features?.[0]?.place_name || "";
        console.log(d)
        // form.setValue("address", d)
    }

    const handleGradeChange = (value: string) => {
        setClassGrade(value);
        form.setValue("grade", value);
    };

    const handleAddressChange = (d: string) => {
        setAddressValue(d)

        form.setValue("address", d)
    }

    if (success) {
        return <FormSuccess message={"Successfully added"} setIsOpenModal={setIsOpenModal} />
    }

    return (
        <div className="modal-overlay">
            <div className="modal-panel w-4/6">
                <TeacherCardWrapper
                    headLabel="Add Student"
                    action={() => handleCloseModal()}
                >
                    <div className="form-surface flex gap-5">
                        {/* @ts-ignore */}
                        < UploadImage form={form} newAvatar={newAvatar} setNewAvatar={setNewAvatar} avatar={avatar} />
                        <div className="flex-1 px-2 text-slate-900 dark:text-slate-100 ">

                            <Form {...form} >
                                {/* the handle submit comes from the form constant */}
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" >
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
                                                            className="add-form-input"
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        >
                                        </FormField>
                                    </div>

                                    <div className="space-x-4 flex items-center w-full justify-between">
                                        <div className="w-3/6 flex-1">
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
                                                                className="add-form-input"
                                                                onChange={e => field.onChange(Number(e.target.value))}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <div className="w-3/6 flex-1 mt-8">
                                            < SelectProperty placeholder="Gender" label="Student Grade" data={gender} handleSelectChange={handleGenderChange} />
                                        </div>

                                    </div>

                                    <div className="flex space-x-3 justify-between w-full ">
                                        < SelectProperty placeholder="Grade" label="Select Grade" data={grades} handleSelectChange={handleGradeChange} />
                                        <div className="w-full">
                                            {
                                                busData &&
                                                < SelectBusWrapper placeholder="Select Bus" label="Select Bus" data={busData} handleSelectChange={handleSelectBus} classname="" />
                                            }
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <FormItem>
                                            <FormLabel>Parent Address</FormLabel>
                                            <  AddressComponent handleAddressChange={handleAddressChange} value={addressValue} handleSuggestionChange={handleSuggestionChange} />
                                            <FormMessage />
                                        </FormItem>
                                    </div>

                                    {/* <FormError message={isError} /> */}
                                    {/* <FormSuccess message={isSuccess} /> */}
                                    <Button
                                        disabled={isPending}
                                        size="lg" className="w-full bg-[#1B1464] p-5" type="submit">Add Student
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
