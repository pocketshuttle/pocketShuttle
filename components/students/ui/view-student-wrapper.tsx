import * as React from "react"

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

export const ViewStudent = () => {
    return (
        <Select>
            <SelectTrigger className="w-[100px] text-[0.7rem]">
                <SelectValue placeholder="View Kids" />
            </SelectTrigger>
            <SelectContent>
                <SelectGroup>
                    <SelectLabel>Kids</SelectLabel>
                    <SelectItem value="apple">
                        <Link href="#">
                            <div className="flex gap-2 items-center   justify-between">
                                <Image src={avatar} width={30} height={30} alt="avatar" className="rounded-full" />
                                <span className="text-[0.8rem]">Full Name</span>
                                <span className="text-[0.6rem]">status</span>
                            </div>
                        </Link>

                    </SelectItem>

                </SelectGroup>
            </SelectContent>
        </Select>
    )
}
