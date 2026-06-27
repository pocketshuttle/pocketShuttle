"use client"
import * as z from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormControl, FormField, FormLabel, FormItem, FormMessage } from "@/components/ui/form"
import { Dispatch, SetStateAction, useEffect, useState, useTransition } from "react"
import { Input } from "@/components/ui/input"
import { ParentSchema } from "@/schemas"
import { Button } from "@/components/ui/button"
import avatar from "@/public/images/avatar.jpg"
import { TeacherCardWrapper } from "@/components/ui/card-wrapper"
import { UploadImage } from "@/components/ui/upload-image"
import { AddRoles } from "@/components/ui/add-role"
import { useSession } from "@/hooks/useSession"
import { toast } from "@/components/ui/use-toast"
import { addNewParent } from "@/actions/addNewParent"
import { AddressComponent } from "@/components/maps/Map/searchbox"

interface StudentModalProps {
    setIsOpenModal: Dispatch<SetStateAction<boolean>>
    isOpenModal: boolean
}

export const ParentModal = ({ setIsOpenModal }: StudentModalProps) => {
    const [isPending, startTransition] = useTransition()
    const [newAvatar, setNewAvatar] = useState<string>("")
    const [selectStudent] = useState<string>("")
    const [selectRole, setSelectedRole] = useState<string>("")
    const [, setAddressValue] = useState("")
    const session = useSession()
    const userId = session?.id

    const roleData = [
        {
            value: "parent",
            label: "Parent",
        },
        {
            value: "teacher",
            label: "Teacher",
        },
    ];


    const form = useForm<z.infer<typeof ParentSchema>>({
        resolver: zodResolver(ParentSchema),
        defaultValues: {
            school_id: !session.loading ? userId : "",
            full_name: "",
            image: newAvatar || "",
            studentId: selectStudent || undefined,
            password: "",
            phoneNumber: "",
            address: "",
            addressCoords: {},
            email: "",
            role: selectRole || ""
        }
    })
    useEffect(() => {
        if (!session.loading && userId) {
            form.setValue("school_id", userId);
        }
    }, [session.loading, userId, form]);
    const onSubmit = async (values: z.infer<typeof ParentSchema>) => {
        // Guard clause for session check
        if (session.loading || !session.id) {
            toast({ description: "Please wait for session to load" });
            return;
        }

        try {
            startTransition(async () => {
                const response = await addNewParent({
                    ...values,
                    school_id: session.id
                });

                toast({
                    description: response.message || "Parent added successfully",
                    variant: response.status === 200 ? "default" : "destructive"
                });

                if (response.status === 200) {
                    handleCloseModal();
                    form.reset();
                }
            });
        } catch (error) {
            toast({
                description: "Failed to add parent",
                variant: "destructive"
            });
            console.error("Parent creation error:", error);
        }
    };

    const handleCloseModal = () => {
        setIsOpenModal(false)
    }
    const handleSelectRole = (value: string) => {
        setSelectedRole(value)
        form.setValue("role", value)
    }

    // const handleAddressChange = (d: string) => {
    //     setAddressValue(d)

    //     form.setValue("address", d)
    // }

    //  handle address selection (geocode once)
    const handleSuggestionChange = (suggestion: { address: string; lat: number; lng: number }) => {
        setAddressValue(suggestion.address)

        form.setValue("address", suggestion.address)
        form.setValue("addressCoords", { latitude: suggestion.lat, longitude: suggestion.lng })
    }
    return (
        <div className="modal-overlay">
            <div className="modal-panel w-5/6 text-slate-900 dark:text-slate-100">

                <TeacherCardWrapper
                    headLabel="Add Parent"
                    action={() => handleCloseModal()}
                >
                    <div className="form-surface flex gap-5">
                        {/* <div className=" w-[25%] items-center  bg-gray-200 h-[21.5rem] p-2 rounded-md" > */}
                        < UploadImage newAvatar={newAvatar} avatar={avatar} form={form} setNewAvatar={setNewAvatar} />
                        {/* </div> */}
                        <div className="flex-1 px-2 ">

                            <Form {...form}>
                                {/* the handle submit comes from the form constant */}
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 text-slate-900 dark:text-slate-100">
                                    <div className="space-y-4 ">
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
                                                                className="py-3 border-none bg-transparent border-1 border-gray-500 shadow-md outline-none h-12"

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
                                                                placeholder="08123456789"
                                                                type="text"
                                                                disabled={isPending}
                                                                className="py-3 border-none bg-transparent border-1 border-gray-500 shadow-md outline-none h-12"

                                                            // onChange={e => field.onChange(Number(e.target.value))}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>


                                    </div>
                                    < div className="w-full flex items-center justify-center space-x-2" >
                                        <div className="w-4/6">
                                            <FormField
                                                control={form.control}
                                                name="password"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Password</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                {...field}
                                                                placeholder="**********"
                                                                type="password"
                                                                disabled={isPending}
                                                                className="py-3 border-none bg-transparent border-1 border-gray-500 shadow-md outline-none h-12"
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <div className="w-2/6 mt-7">
                                            <AddRoles handleSelectChange={handleSelectRole} data={roleData} />
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <FormItem>
                                            <FormLabel>Parent Address</FormLabel>
                                            <AddressComponent
                                                value={form.watch("address")}
                                                handleAddressChange={(v) => form.setValue("address", v)}
                                                handleSuggestionChange={handleSuggestionChange}
                                            />
                                            <FormMessage />

                                        </FormItem>
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
