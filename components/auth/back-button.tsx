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
        <div className="flex w-full items-center justify-center gap-1.5 text-center text-sm text-slate-600">
            {desc ? (
                <span className="text-sm font-normal">
                    {desc}
                </span>
            ) : null}
            <Button variant="link" asChild size="sm" className="h-auto px-0 text-sm font-semibold text-blue-700 hover:text-blue-900" >
                <Link href={href}>
                    {label}
                </Link>
            </Button>
        </div>
    )
}
