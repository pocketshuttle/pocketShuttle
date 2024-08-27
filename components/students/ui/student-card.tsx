"use client"
import { removeStudentFromBus } from '@/actions/remove-student-bus'
import { SelectBusWrapper } from '@/components/Teachers/ui/select-bus-wrapper'
import { SelectPassengerBus } from '@/components/ui/select-bus-wrapper'
import { toast } from '@/components/ui/use-toast'
import Image from 'next/image'
import React, { useState, useTransition } from 'react'
import LottieAnimation from "@/components/dashboard/sidebar/menuLink/lottie-animation"
import minus from "@/public/images/minus.json"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

const StudentCard = ({ data, busData }) => {
    const [selectedBus, setSelectedBus] = useState<{ id: string; bus_product_name: string | null } | null>(null);
    const [isPending, startTransition] = useTransition()
    const [isHovering, setIsHovering] = useState(false);

    const handleSelectBus = (value: string) => {
        const parsedValues = JSON.parse(value);
        setSelectedBus(parsedValues);
    }

    const handleRemove = (studentId: string, busId: string | undefined) => {
        startTransition(() => {
            removeStudentFromBus(studentId, busId).then((data) => {
                toast({
                    description: data.message,
                });
            }).catch((error) => {
                console.error("Error:", error);
                toast({
                    description: "An error occurred. Please try again.",
                });
            });
        })
    }
    return (
        <div className="bg-[var(--bgSoft)] flex  flex-col items-center max-w-sm px-8 py-4 rounded-md">

            <Image src={data.image && data.image} alt={data.full_name} className="rounded-full w-24 h-24 object-cover " width={100} height={100} />

            <div className='flex items-center gap-1'>
                <h5 className="mb-1 text-xl font-medium text-gray-300 dark:text-white ">{data.full_name}
                </h5>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{data.age}yrs old</span>
            </div>
            <div className='space-x-2'>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{data.grade},</span>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{data.address}</span>
            </div>
            <div className='mt-4 flex items-center space-x-4'>
                {
                    data.bus ?
                        <div>
                            <p className='space-x-2 text-sm capitalize'>
                                <span>
                                    {data.bus?.color}
                                </span>
                                <span>
                                    {data.bus?.bus_product_name}
                                </span>
                                <span>
                                    {data.bus?.bus_number}
                                </span>
                            </p>

                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <div
                                        className='w-[20px] h-[20px] mr-[0.2rem]'
                                        onMouseEnter={() => setIsHovering(true)}
                                        onMouseLeave={() => setIsHovering(false)}
                                    >
                                        <LottieAnimation isHovering={isHovering} animationData={minus} />
                                    </div>

                                </AlertDialogTrigger>
                                <AlertDialogContent className="bg-gray-900 border-none">
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                        <AlertDialogDescription className="text-gray-500 text-md">
                                            {` You're about to remove 
                                                 ${data.full_name} 
                                                  from ${data.bus.bus_product_name}  with bus Number ${data.bus.bus_number}`}
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel className="bg-inherit">Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                            className="bg-destructive"
                                            onClick={() => handleRemove(data.id, data?.bus?.id)}
                                        >
                                            Continue
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                        :
                        busData &&
                        < SelectPassengerBus
                            placeholder="Select Bus"
                            label="Select Bus"
                            data={busData}
                            studentId={data.id}
                        />
                    // < SelectBusWrapper placeholder="Select Bus" label="Select Bus" data={busData} handleSelectChange={handleSelectBus} classname="w-full" />
                }
            </div>

            {selectedBus &&
                <div className='p-2 flex items-center justify-center space-x-2'>
                    <h2>
                        route:
                    </h2>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{selectedBus.bus_product_name}</span>
                </div>
            }
        </div >
    )
}

export default StudentCard