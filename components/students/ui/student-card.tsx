import { SelectBusWrapper } from '@/components/Teachers/ui/select-bus-wrapper'
import { Button } from '@/components/ui/button'
import { useFetch } from '@/hooks/useFetch'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import React from 'react'

const StudentCard = ({ data }) => {
    const { data: session } = useSession()
    const userId = session?.user?.id
    const { data: busData, isPending: busPending, errorMessage: busError } = useFetch(`/api/addbus/${userId}`, userId);


    const handleSelectBus = (value: string) => {
        // setSelectedBus(value)
        // form.setValue("busId", value)
    }
    return (
        <div className="bg-[var(--bgSoft)] flex  flex-col items-center max-w-sm p-8 rounded-md">

            <Image src={data.image && data.image} alt={data.full_name} className="rounded-full w-24 h-24 object-cover " width={100} height={100} />
            <h5 className="mb-1 text-xl font-medium text-gray-300 dark:text-white">{data.full_name}</h5>
            <div className='space-x-4'>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{data.grade}</span>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{data.age}yrs old</span>
            </div>
            <div className='mt-4 flex items-center space-x-4'>
                {
                    busData &&
                    < SelectBusWrapper placeholder="Select Bus" label="Select Bus" data={busData} handleSelectChange={handleSelectBus} />
                }
                <Button>
                    Save
                </Button>
            </div>
        </div>
    )
}

export default StudentCard