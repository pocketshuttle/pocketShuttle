import Image from "next/image"
import { AuthFooter } from "./style/footer/footer"
import { LgScreen } from "./style/lg-screen"

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
    return (
        <div className="flex flex-col lg:flex-row lg:px-10  h-screen items-center justify-center lg:w-4/5">
            <div className='p-6 lg:hidden'>
                < Image src="/images/pslogo.png" alt="Pocket shuttle" width={250} height={200} />
            </div>
            <div className="hidden lg:flex md:flex w-full items-center justify-center">
                <LgScreen />
            </div>
            <div className=" ">
                {children}
            </div>
            <div className="space-y-3 mt-8 w-full lg:hidden ">
                < AuthFooter />
            </div>
        </div>
    )
}

export default AuthLayout