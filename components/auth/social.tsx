"use client"

import { Button } from "@/components/ui/button"
import { FcGoogle } from "react-icons/fc"
import { signIn } from "next-auth/react"
import { DEFAULT_LOGIN_REDIRECT } from "@/routes"
import { FaFacebook } from "react-icons/fa"

export const Social = () => {
    const onClick = (provider: "google") => {
        signIn(provider, {
            callbackUrl: DEFAULT_LOGIN_REDIRECT
        })
    }
    return (
        <div className="flex items-center gap-x-2 w-full">
            <Button size="lg" variant="outline" className="w-full" onClick={() => onClick("google")}>
                <FcGoogle />
            </Button>
            <Button size="lg" variant="outline" className="w-full" onClick={() => { }}>
                <FaFacebook />
            </Button>

        </div>
    )
}