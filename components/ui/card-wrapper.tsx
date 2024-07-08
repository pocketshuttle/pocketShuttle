"use client"

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { AuthHeader } from "@/components/auth/header"
import { Social } from "@/components/auth/social"
import { BackButton } from "@/components/auth/back-button"
import { Button } from "@/components/ui/button"
import { IoMdClose } from "react-icons/io"

interface CardWrapperProps {
    children: React.ReactNode
    headLabel: string
    action?: () => void
}
export const TeacherCardWrapper = ({ children, headLabel, action }: CardWrapperProps) => {
    return (
        <Card className="w-full shadow-md bg-inherit border-none text-gray-300">

            <CardHeader>
                <div className="flex justify-end p-3">
                    <AuthHeader label={headLabel} />
                    <IoMdClose width={30} className="cursor-pointer w-6" onClick={action} />
                </div>

            </CardHeader>
            <CardContent>
                {children}
            </CardContent>
            <CardFooter>
            </CardFooter>
        </Card>
    )
}
