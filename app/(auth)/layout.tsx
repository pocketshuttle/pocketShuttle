import Image from "next/image"
import { AuthFooter } from "./style/footer/footer"
import { LgScreen } from "./style/lg-screen"
import whitefullname from "@/public/Whitefullname.png"


const AuthLayout = ({ children }: { children: React.ReactNode }) => {
    return (
        <div className="min-h-screen bg-[#030713] px-4 py-5 text-white md:px-8 lg:px-10 lg:py-8">
            <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] w-full max-w-7xl flex-col overflow-hidden rounded-[28px] border border-white/10 bg-[#060b18] shadow-[0_30px_120px_rgba(0,0,0,0.5)] lg:flex-row">
                <div className="flex items-center justify-center border-b border-white/10 px-6 py-8 lg:hidden">
                    <Image
                        src={whitefullname}
                        alt="Pocket Shuttle"
                        width={220}
                        height={72}
                        priority
                    />
                </div>

                <div className="hidden lg:flex lg:w-[48%] lg:border-r lg:border-white/10">
                    <LgScreen />
                </div>

                <div className="flex flex-1 flex-col justify-center bg-[#030713] px-4 py-8 sm:px-8 lg:px-12">
                    <div className="mx-auto w-full max-w-[480px]">
                        {children}
                    </div>
                </div>

                <div className="border-t border-white/10 px-4 pb-6 pt-2 lg:hidden">
                    <AuthFooter />
                </div>
            </div>
        </div>
    )
}

export default AuthLayout
