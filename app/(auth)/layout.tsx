import Image from "next/image"
import { AuthFooter } from "./style/footer/footer"

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
    return (
        <div className="flex flex-col h-screen items-center justify-center ">
            <div className='p-6'>
                < Image src="/images/pslogo.png" alt="Pocket shuttle" width={250} height={200} />
            </div>
            {children}
            <div className="space-y-3 mt-8 w-full ">
                < AuthFooter />
            </div>
        </div>
    )
}

export default AuthLayout