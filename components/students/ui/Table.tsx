import { Pagination } from "@/components/dashboard/pagination/pagination"
import { Search } from "@/components/dashboard/search/search"
import { Button } from "@/components/ui/button"
import dashboard from "@/public/images/dashboard.svg"
import Image from "next/image"
import { useEffect, useState } from "react"
import { StudentModal } from "@/components/students/ui/Student-modal"
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
import { useSearchParams } from "next/navigation"
import { SelectProperty } from "@/components/ui/select-wrapper"
import { grades } from "@/data/schooldata"

type StudentProps = {
    _id: string,
    full_name: string,
    age: number,
    gender: string,
    grade: string,
    address: string,
    bus: BusProps,
    image: string
}

type BusProps = {
    bus_product_name: string
    bus_number: string
}
export const StudentsData = () => {
    const { data: session } = useSession()
    const userId = session?.user?.id
    const [filterGrade, setFilterGrade] = useState<string>("")
    const [isOpenModal, setIsOpenModal] = useState<boolean>(false)
    const searchParams = useSearchParams()
    const search = searchParams.get("q") || ""
    const handleGradeChange = (value: string) => {
        setFilterGrade(value)
    }

    const { data: studentsData, isPending, errorMessage } = useFetch(`/api/addstudent/${userId}?q=${search}&grade=${filterGrade}`, userId);

    console.log(studentsData)
    return (
        <div className="relative overflow-x-auto shadow-md sm:rounded-lg bg-[#182237]">
            <div className="p-4 flex justify-between items-center ">
                <Search placeholder="Search for students..." classname="border border-gray-700  outline-none focus-visible:outline-none px-2 py-0 focus-visible:ring-0 w-2/5" />
                <div className="gap-3">
                    <Link href="/dashboard/students/allstudents">
                        <Button variant="link" className="ml-2 text-blue-600">View All Students</Button>
                    </Link>

                    <Button variant="secondary" onClick={() => setIsOpenModal(true)}>
                        add new
                    </Button>
                </div>
            </div>
            {
                isOpenModal && <StudentModal isOpenModal={isOpenModal} setIsOpenModal={setIsOpenModal} />
            }

            <Table>
                <TableHeader>
                    <TableRow className=" uppercase text-[0.7rem]">
                        <TableHead className="w-[250px]">Full Name</TableHead>
                        <TableHead>Gender</TableHead>
                        <TableHead className="">Age</TableHead>
                        <TableHead className="w-[185px]">
                            < SelectProperty placeholder="Grade" label="Filter by Grade" data={grades} handleSelectChange={handleGradeChange} />
                        </TableHead>
                        <TableHead className="w-[300px]">Address</TableHead>
                        <TableHead className="w-[170px]">Bus</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>

                </TableHeader>
                <TableBody className="text-[0.8rem] text-[var(--textSoft)]">
                    {
                        studentsData && studentsData?.map((student: StudentProps) => {
                            return (
                                <TableRow key={student._id}>
                                    <TableCell className="">
                                        <div className="flex items-center gap-2">
                                            <Image src={student.image && student.image || dashboard} alt={student.full_name} className="rounded-md object-cover w-9 h-9" width={100} height={100} />
                                            <span className="capitalize">{student.full_name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {student.gender}
                                    </TableCell>
                                    <TableCell>
                                        {student.age}
                                    </TableCell>
                                    <TableCell>
                                        {student.grade}
                                    </TableCell>
                                    <TableCell>
                                        {student.address}
                                    </TableCell>
                                    <TableCell className="capitalize">
                                        <p> {student.bus && student.bus.bus_product_name}
                                            <span>
                                                ({student.bus && student.bus.bus_number})
                                            </span>
                                        </p>
                                    </TableCell>
                                    <TableCell>
                                        <div className="space-x-2">
                                            <Link href={`/ dashboard / students / ${student._id}`}>
                                                <button className="bg-[teal] px-2 text-[0.5rem] rounded-sm">
                                                    view
                                                </button>
                                            </Link>
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
