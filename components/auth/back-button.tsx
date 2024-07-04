"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"

interface BackButtonProps {
    href: string
    label: string
    desc: string | undefined
}
export const BackButton = ({ href, label, desc }: BackButtonProps) => {
    return (
        <div className="text-center flex justify-center items-center w-full">
            <span className="text-[0.75rem] font-normal ">
                {desc}
            </span>
            <Button variant="link" asChild size="sm" className="font-normal" >
                <Link href={href}>
                    {label}
                </Link>
            </Button>
        </div>
    )
}