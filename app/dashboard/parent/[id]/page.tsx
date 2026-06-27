"use client"

import * as z from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormControl, FormField, FormLabel, FormItem, FormMessage } from "@/components/ui/form"
import { useEffect, useState, useTransition } from "react"
import { Input } from "@/components/ui/input"
import { ParentUpdateSchema } from "@/schemas"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import avatar from "@/public/images/avatar.jpg"
import { useFetch } from "@/hooks/useFetch"
import { usePathname } from "next/navigation"
import spinner from "@/public/images/spinner.gif"
import { Spinner } from "@/components/ui/spinner"
import { updateParent } from "@/actions/update-parent"
import { toast } from "@/components/ui/use-toast"
import { useSession } from "@/hooks/useSession"
import { AddressComponent } from "@/components/maps/Map/searchbox"
import { googleFetchCoordinates } from "@/components/maps/lib/utils"

const SingleParentPage = () => {
    const [isPending, startTransition] = useTransition()
    const [newAvatar, setNewAvatar] = useState<string>("")
    const [isLoadingImage, setIsLoadingImage] = useState<boolean>(false)
    const pathname = usePathname()
    const id = pathname.split("/").pop()
    const session = useSession()
    const userId = session?.id

    const { data: parentsData, isPending: parentPending } = useFetch(`/api/addparent/${id}`, userId)
    const parentData = parentsData

    const form = useForm<z.infer<typeof ParentUpdateSchema>>({
        resolver: zodResolver(ParentUpdateSchema),
        defaultValues: {
            school_id: userId,
            full_name: "",
            email: "",
            password: "",
            phoneNumber: "",
            address: "",
            addressCoords: {},
            image: "",
            role: "parent",
        },
    })

    //  Reset form with existing parent data
    useEffect(() => {
        if (parentData) {
            form.reset({
                school_id: userId,
                full_name: parentData.full_name || "",
                email: parentData.email || "",
                password: "",
                phoneNumber: parentData.phoneNumber || "",
                address: parentData.address || "",
                addressCoords: parentData.addressCoords || {},
                image: newAvatar || parentData.image || "",
                role: parentData.role || "parent",
            });
        }
    }, [parentData, userId, newAvatar, form]);

    const handleAddressChange = (value: string) => {
        form.setValue("address", value, { shouldDirty: true, shouldValidate: true })
        form.setValue("addressCoords", undefined, { shouldDirty: true, shouldValidate: true })
    }

    //  handle address selection (geocode once)
    const handleSuggestionChange = (suggestion: { address: string; lat: number; lng: number }) => {
        form.setValue("address", suggestion.address, { shouldDirty: true, shouldValidate: true })
        form.setValue("addressCoords", { latitude: suggestion.lat, longitude: suggestion.lng }, { shouldDirty: true, shouldValidate: true })
    }

    const onSubmit = (values: z.infer<typeof ParentUpdateSchema>) => {
        startTransition(async () => {
            let payload = values

            if (values.address && !values.addressCoords) {
                const coords = await googleFetchCoordinates(values.address)

                if (coords) {
                    payload = {
                        ...values,
                        addressCoords: {
                            latitude: coords[0],
                            longitude: coords[1],
                        },
                    }
                }
            }

            const response = await updateParent(id!, payload)
            if (response.status === 200) {
                toast({ description: response.message })
            } else {
                toast({ description: response.message || "An error occurred. Please try again.", variant: "destructive" })
            }
        })
    }

    //  avatar upload
    const handleCameraClick = () => {
        document.getElementById("cameraInput")?.click()
    }

    const handleCameraInputChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            const data = new FormData()
            data.append("file", file)

            setIsLoadingImage(true)
            try {
                const res = await fetch(`/api/upload/`, { method: "POST", body: data })
                if (res.ok) {
                    const result = await res.json()
                    setNewAvatar(result.url)
                    form.setValue("image", result.url)
                    window.localStorage.setItem(`parent_avatar_${id}`, result.url)
                }
            } catch (error) {
                console.error(error)
            } finally {
                setIsLoadingImage(false)
            }
        }
    }

    useEffect(() => {
        const storedAvatar = window.localStorage.getItem(`parent_avatar_${id}`)
        if (storedAvatar) setNewAvatar(storedAvatar)
    }, [id])

    return (
        <div>
            <h1 className="text-center p-3 text-xl">Update Parent</h1>
            {parentPending ? (
                <Spinner />
            ) : (
                <div className="flex">
                    {/* Avatar */}
                    <div className="w-[25%] bg-[var(--bgSoft)] h-[16.5rem] p-2 rounded-md">
                        <input
                            id="cameraInput"
                            type="file"
                            accept="image/*"
                            style={{ display: "none" }}
                            onChange={handleCameraInputChange}
                        />
                        <Image
                            src={newAvatar ? (isLoadingImage ? spinner : newAvatar) : parentData?.image || avatar}
                            alt="avatar"
                            width={180}
                            height={260}
                            className="cursor-pointer rounded-md h-[16rem] w-full object-fill"
                            onClick={handleCameraClick}
                        />
                    </div>

                    {/* Form */}
                    <div className="flex-1 px-5">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <FormField
                                    control={form.control}
                                    name="full_name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Full Name</FormLabel>
                                            <FormControl>
                                                <Input {...field} type="text" disabled={isPending} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="flex space-x-4">
                                    <FormField
                                        control={form.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem className="w-1/2">
                                                <FormLabel>Email</FormLabel>
                                                <FormControl>
                                                    <Input {...field} type="email" disabled={isPending} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="phoneNumber"
                                        render={({ field }) => (
                                            <FormItem className="w-1/2">
                                                <FormLabel>Phone Number</FormLabel>
                                                <FormControl>
                                                    <Input {...field} type="tel" disabled={isPending} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Password</FormLabel>
                                            <FormControl>
                                                <Input {...field} type="password" disabled={isPending} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Address with coords */}
                                <FormItem>
                                    <FormLabel>Parent Address</FormLabel>
                                    <AddressComponent
                                        value={form.watch("address")}
                                        handleAddressChange={handleAddressChange}
                                        handleSuggestionChange={handleSuggestionChange}
                                    />
                                    <FormMessage />
                                </FormItem>

                                <Button size="lg" className="w-full border border-[var(--text)] bg-[var(--text)] text-[var(--bg-root)] hover:bg-[var(--bg-root)] hover:text-[var(--text)]" type="submit" disabled={isPending}>
                                    {isPending ? "Updating..." : "Update Parent"}
                                </Button>
                            </form>
                        </Form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default SingleParentPage
