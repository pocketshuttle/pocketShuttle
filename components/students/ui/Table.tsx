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
import { Spinner } from "@/components/ui/spinner"
import { SelectBusWrapper } from "@/components/Teachers/ui/select-bus-wrapper"
import { SelectBus, SelectPassengerBus } from "@/components/ui/select-bus-wrapper"

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
    const [selectBus, setSelectBus] = useState<string>("")
    const searchParams = useSearchParams()
    const search = searchParams.get("q") || ""

    const page = searchParams.get("page") || 1

    const handleGradeChange = (value: string) => {
        setFilterGrade(value)
    }

    const gradeQuery = filterGrade !== "All" ? `&grade=${filterGrade}` : "";

    const { data, isPending, errorMessage } = useFetch(`/api/addstudent/${userId}?q=${search}${gradeQuery}&page=${page}`, userId);
    const { data: busData, isPending: busLoading, errorMessage: busError } = useFetch(`/api/addbus/${userId}?q=${search}&grade=${filterGrade}&page=${page}`, userId);


    const studentsData = data?.students || [];
    const totalCount = data?.count || 0;

    if (isPending) {
        return <Spinner />
    }

    return (
        <div className="relative overflow-x-auto shadow-md sm:rounded-lg bg-[#182237]">
            <div className="p-4 flex justify-end items-center ">
                <div className="gap-3">
                    <Link href="/dashboard/students/allstudents">
                        <Button variant="link" className="ml-2 text-blue-600">View All Students</Button>
                    </Link>

                    <Button variant="secondary" onClick={() => setIsOpenModal(true)}>
                        Add new Student
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
                            < SelectProperty placeholder="Grade" label="Filter by Grade" data={grades} handleSelectChange={handleGradeChange} setFilterGrade={setFilterGrade} />
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
                                        {
                                            student.bus ?
                                                <p> {student.bus && student.bus.bus_product_name}
                                                    <span>
                                                        ({student.bus && student.bus.bus_number})
                                                    </span>
                                                </p> : <div className="w-full">
                                                    {
                                                        busData &&
                                                        < SelectPassengerBus
                                                            placeholder="Select Bus"
                                                            label="Select Bus"
                                                            data={busData}
                                                            studentId={student._id}
                                                        />
                                                    }
                                                </div>
                                        }
                                    </TableCell>
                                    <TableCell>
                                        <div className="space-x-2">
                                            <Link href={`/dashboard/students/${student._id}`}>
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

            <Pagination count={totalCount} />
        </div >

    )
}
