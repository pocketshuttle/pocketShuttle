"use client"

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { AuthHeader } from "@/components/auth/header"
import { Social } from "@/components/auth/social"
import { BackButton } from "@/components/auth/back-button"

interface CardWrapperProps {
    children: React.ReactNode
    headLabel: string
    backButtonLabel: string
    backButtonHref: string
    showSocial?: boolean
    description?: string
    subLabel?: string
}
export const CardWrapper = ({ children, headLabel, backButtonHref, backButtonLabel, showSocial, description, subLabel }: CardWrapperProps) => {
    return (
        <Card className="w-full border-0 bg-transparent text-slate-950 shadow-none">
            <CardHeader className="space-y-0 px-0 pb-4 pt-0">
                <AuthHeader label={headLabel} subtitle={subLabel} />
            </CardHeader>
            <CardContent className="space-y-6 px-0 pb-8 pt-0">
                {children}
            </CardContent>
            {
                showSocial && (
                    <CardFooter className="border-t border-slate-200 px-0 pt-6">
                        <Social />
                    </CardFooter>
                )
            }
            <CardFooter className="border-t border-slate-200 px-0 pb-0 pt-6">
                <BackButton href={backButtonHref} label={backButtonLabel} desc={description} />
            </CardFooter>
        </Card>
    )
}
