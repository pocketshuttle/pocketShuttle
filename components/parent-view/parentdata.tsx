"use client"
import { useFetch } from "@/hooks/useFetch"
import { StudentProps } from "@/types"
import Image from "next/image"
import avatar from "@/public/images/avatar.jpg"
import { Spinner } from "@/components/ui/spinner"

type SessionProps = {
    userId: string | undefined
    user: any
}


const ParentViewData = ({ userId, user }: SessionProps) => {
    const { data, isPending: parentPending, errorMessage } = useFetch(`/api/addparent/${userId}`, userId);

    const parentData = data?.parent?.[0]
    console.log(data)

    return (
        <main>
            <div>
                <h3 className="text-center p-5">All kids</h3>
                {
                    parentPending ? <Spinner /> :


                        parentData?.Student?.map((sibling: StudentProps) => {


                            return (
                                <div
                                    key={sibling.id}
                                    className="flex items-center bg-[var(--bgSoft)] py-2 px-4 space-x-4 rounded-md mb-2"
                                >
                                    <Image
                                        src={sibling?.image || avatar}
                                        alt={sibling?.full_name}
                                        className="rounded-md object-cover w-24 h-24 shadow-lg"
                                        width={100}
                                        height={100}
                                    />
                                    <div className="py-4 space-y-2">
                                        <h2 className="capitalize text-gray-200">
                                            {sibling?.full_name}
                                        </h2>
                                        <span>
                                            {sibling.status}
                                        </span>
                                    </div>
                                </div>
                            );
                        })
                }
            </div>
        </main>
    )
}

export default ParentViewData