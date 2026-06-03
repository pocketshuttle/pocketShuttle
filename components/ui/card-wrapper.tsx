"use client"

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { AuthHeader } from "@/components/auth/header"
import { Social } from "@/components/auth/social"
import { BackButton } from "@/components/auth/back-button"
import { Button } from "@/components/ui/button"
import { IoMdClose } from "react-icons/io"
import { Separator } from "@/components/ui/separator"

interface CardWrapperProps {
    children: React.ReactNode
    headLabel: string
    action?: () => void
}
export const TeacherCardWrapper = ({ children, headLabel, action }: CardWrapperProps) => {
    return (
        <Card className="w-full border-none bg-transparent text-[var(--text)] shadow-none">

            <CardHeader className="px-5 pb-3 pt-5">
                <div className="flex items-start justify-between gap-4">
                    <AuthHeader label={headLabel} />
                    <button
                        type="button"
                        onClick={action}
                        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
                        aria-label="Close"
                    >
                        <IoMdClose className="h-5 w-5" />
                    </button>
                </div>
                <Separator className="mt-4 bg-slate-200 dark:bg-white/10" />

            </CardHeader>
            <CardContent className="px-5 pb-5">
                {children}
            </CardContent>
            <CardFooter>
            </CardFooter>
        </Card>
    )
}
