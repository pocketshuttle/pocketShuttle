import * as React from "react"
import { StudentProps } from "@/types"
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import Image from "next/image"
import avatar from "@/public/images/avatar.jpg"
import Link from "next/link"

{/* @ts-ignore */ }
export const ViewStudent = ({ data }) => {
    return (
        <Select >
            <SelectTrigger className="w-[100px] text-[0.7rem] text-gray-200">
                <SelectValue placeholder="View Kids" />
            </SelectTrigger>
            <SelectContent>
                <SelectGroup>
                    <SelectLabel >Kids</SelectLabel>
                    {
                        data.map((student: StudentProps) => (
                            <SelectItem key={student.id} value="apple">
                                <Link href="#">
                                    <div className="flex gap-2 items-center   justify-between ">
                                        <Image src={student.image} width={40} height={50} alt="avatar" className="rounded-md" />
                                        <span className="text-sm">{student.full_name}</span>
                                        <span className="text-[0.6rem]">{student.status}</span>
                                    </div>
                                </Link>
                            </SelectItem>
                        ))
                    }


                </SelectGroup>
            </SelectContent>
        </Select>
    )
}
