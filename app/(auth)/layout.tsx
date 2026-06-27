import Image from "next/image"
import { AuthFooter } from "./style/footer/footer"
import { LgScreen } from "./style/lg-screen"
import bluefullname from "@/public/bluefullname.png"


const AuthLayout = ({ children }: { children: React.ReactNode }) => {
    return (
        <div className="min-h-screen bg-slate-100 px-4 py-5 text-slate-950 md:px-8 lg:px-10 lg:py-8">
            <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] w-full max-w-7xl flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_120px_rgba(15,23,42,0.14)] lg:flex-row">
                <div className="flex items-center justify-center border-b border-slate-200 px-6 py-8 lg:hidden">
                    <Image
                        src={bluefullname}
                        alt="Pocket Shuttle"
                        width={220}
                        height={72}
                        priority
                    />
                </div>

                <div className="hidden lg:flex lg:w-[48%] lg:border-r lg:border-slate-200">
                    <LgScreen />
                </div>

                <div className="flex flex-1 flex-col justify-center bg-white px-4 py-8 sm:px-8 lg:px-12">
                    <div className="mx-auto w-full max-w-[480px]">
                        {children}
                    </div>
                </div>

                <div className="border-t border-slate-200 px-4 pb-6 pt-2 lg:hidden">
                    <AuthFooter />
                </div>
            </div>
        </div>
    )
}

export default AuthLayout
