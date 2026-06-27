import { AuthHeader } from "@/components/auth/header"
import { BackButton } from "@/components/auth/back-button"
import { Card, CardFooter, CardHeader } from "@/components/ui/card"
const AuthErrorCard = () => {
    return (
        <Card className="w-full max-w-[460px] border-white/60 bg-white/95 text-slate-900 shadow-[0_24px_80px_rgba(15,23,42,0.24)] backdrop-blur">
            <CardHeader className="p-8 pb-6">
                <AuthHeader label="Oops, something went wrong" subtitle="The authentication flow hit a problem before we could complete your request." />
            </CardHeader>
            <CardFooter className="border-t border-slate-200/80 px-8 pb-8 pt-6">
                <BackButton label="Back to login" href="/login" desc="" />
            </CardFooter>
        </Card>

    )
}

export default AuthErrorCard
