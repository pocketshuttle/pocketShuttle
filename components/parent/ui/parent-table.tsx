import { Pagination } from "@/components/dashboard/pagination/pagination"
import { Search } from "@/components/dashboard/search/search"
import { Button } from "@/components/ui/button"
import dashboard from "@/public/images/dashboard.svg"
import Image from "next/image"
import { useState } from "react"
import Link from "next/link"
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { useFetch } from "@/hooks/useFetch"
import { useSession } from "next-auth/react"
import { ParentModal } from "./parent-modal"
import { ViewStudent } from "@/components/students/ui/view-student-wrapper"
import { Spinner } from "@/components/ui/spinner"

type ParentProps = {
    _id: string,
    full_name: string,
    phoneNumber: number,
    email: string,
    students: string,
    address: string,
    image: string
    student?: string
}

export const ParentData = () => {
    const { data: session } = useSession()
    const userId = session?.user?.id


    const [isOpenModal, setIsOpenModal] = useState<boolean>(false)
    const { data: parentData, isPending, errorMessage } = useFetch(`/api/addparent/${userId}`, userId);
    const [selectedParent, setSelectedParent] = useState<ParentProps | null>(null);

    const handleModal = (parentId: ParentProps) => {
        setIsOpenModal(true)
        setSelectedParent(parentId);
    }

    if (isPending) {
        return <Spinner />
    }

    return (
        <div className="relative overflow-x-auto shadow-md sm:rounded-lg bg-[#182237]">
            <div className="p-4 flex justify-between items-center ">
                <Search placeholder="Search for parents..." classname="border border-gray-700  outline-none focus-visible:outline-none px-2 py-0 focus-visible:ring-0 w-2/5" />
                <Button variant="secondary" onClick={() => handleModal("")}>
                    add new
                </Button>
            </div>
            {
                isOpenModal && <ParentModal isOpenModal={isOpenModal} setIsOpenModal={setIsOpenModal} parentId={selectedParent} />
            }

            <Table>
                <TableHeader>
                    <TableRow className=" uppercase text-[0.7rem]">
                        <TableHead className="w-[250px]">Full Name</TableHead>
                        <TableHead className="">No of kids</TableHead>
                        <TableHead className="w-[250px]">Address</TableHead>
                        <TableHead className="">Email</TableHead>
                        <TableHead className="">Phone Number</TableHead>
                    </TableRow>

                </TableHeader>
                <TableBody className="text-[0.8rem] text-[var(--textSoft)]">
                    {
                        parentData && parentData?.map((parent: ParentProps) => {
                            return (
                                <TableRow key={parent._id}>
                                    <TableCell className="">
                                        <div className="flex items-center gap-2">
                                            <Image src={parent.image && parent.image || dashboard} alt={parent.full_name} className="rounded-md object-cover w-9 h-9" width={100} height={100} />
                                            <span className="">{parent.full_name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {parent.students.length ? <ViewStudent /> : "no kids"}


                                    </TableCell>
                                    <TableCell>
                                        {parent.address}
                                    </TableCell>
                                    <TableCell>
                                        {parent.email}
                                    </TableCell>
                                    <TableCell>
                                        {parent.phoneNumber}
                                    </TableCell>

                                    <TableCell>
                                        <div className="space-x-2">
                                            {/* <Link href={`/dashboard/parents/${parent._id}`}> */}
                                            <button className="bg-[teal] px-2 text-[0.5rem] rounded-sm" onClick={() => handleModal(parent._id)}>
                                                view
                                            </button>
                                            {/* </Link> */}
                                            <Link href="/dashboard">
                                                <button className="bg-destructive px-2 text-[0.5rem] rounded-sm">
                                                    delete
                                                </button>
                                            </Link>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )
                        })
                    }
                </TableBody>
            </Table>


            <Pagination />
        </div >

    )
}
