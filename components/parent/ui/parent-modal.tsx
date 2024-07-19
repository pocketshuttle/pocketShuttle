"use client"
import * as z from "zod"
import { CardWrapper } from "@/components/auth/card-wrapper"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormControl, FormField, FormLabel, FormItem, FormMessage } from "@/components/ui/form"
import { ChangeEvent, Dispatch, SetStateAction, useEffect, useState, useTransition } from "react"
import { Input } from "@/components/ui/input"
import { ParentSchema } from "@/schemas"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import avatar from "@/public/images/avatar.jpg"
import { TeacherCardWrapper } from "@/components/ui/card-wrapper"
import { SelectProperty } from "@/components/ui/select-wrapper"
import { useSession } from "next-auth/react"
import { grades, buses, gender } from "@/data/schooldata"
import { usePost } from "@/hooks/usePost"
import { SelectBusWrapper } from "@/components/Teachers/ui/select-bus-wrapper"
import { useFetch } from "@/hooks/useFetch"
import { Textarea } from "@/components/ui/textarea"
import { UploadImage } from "@/components/ui/upload-image"

interface StudentModalProps {
    setIsOpenModal: Dispatch<SetStateAction<boolean>>
    isOpenModal: boolean
}

export const ParentModal = ({ isOpenModal, setIsOpenModal, parentId }: StudentModalProps) => {
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

    console.log(parentId)

    const { data: session } = useSession()
    const userId = session?.user?.id


    const { data, loading, errorMessage, success } = usePost("/api/addparent", submittedData, "POST")
    const { data: parentData, isPending: parentPending, errorMessage: parentError } = useFetch(`/api/addparent/${parentId}`, parentId);


    console.log(userId);

    const form = useForm<z.infer<typeof ParentSchema>>({
        resolver: zodResolver(ParentSchema),
        defaultValues: {
            school_id: userId,
            full_name: "",
            image: newAvatar || "",
            studentId: selectTeacher || undefined,
            password: "",
            phoneNumber: "",
            address: "",
            email: ""
        }
    })


    const onSubmit = (values: z.infer<typeof ParentSchema>) => {
        console.log(values)
        startTransition(() => {
            setSubmittedData(values)
        });
    }

    const handleCloseModal = () => {
        setIsOpenModal(false)
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
            <div className="relative bg-gray-900  rounded-md w-5/6 ">

                <TeacherCardWrapper
                    headLabel="Add Parent"
                    action={() => handleCloseModal()}
                >
                    <div className=" flex ">
                        <div className=" w-[25%] items-center  bg-[var(--bgSoft)] h-[21.5rem] p-2 rounded-md" >
                            < UploadImage newAvatar={newAvatar} avatar={avatar} form={form} setNewAvatar={setNewAvatar} />
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
                                                name="email"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Email</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                {...field}
                                                                placeholder="johndoe@email.com"
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
                                        <div className="w-5/6">
                                            <FormField
                                                control={form.control}
                                                name="phoneNumber"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Phone Number</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                {...field}
                                                                placeholder="johndoe@email.com"
                                                                type="text"
                                                                disabled={isPending}
                                                                className="py-3 border-none bg-[var(--bgSoft)] outline-none h-12"
                                                            // onChange={e => field.onChange(Number(e.target.value))}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>


                                    </div>
                                    < div className="w-5/6">
                                        <FormField
                                            control={form.control}
                                            name="password"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Password</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            {...field}
                                                            placeholder="johndoe@email.com"
                                                            type="password"
                                                            disabled={isPending}
                                                            className="py-3 border-none bg-[var(--bgSoft)] outline-none h-12"
                                                        // onChange={e => field.onChange(Number(e.target.value))}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <FormField
                                            control={form.control}
                                            name="address"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Parent Address</FormLabel>
                                                    <FormControl>
                                                        <Textarea
                                                            {...field}
                                                            placeholder="Parent Address"
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
                                        size="lg" className="w-full bg-[teal] p-5" type="submit">Add Parent
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


