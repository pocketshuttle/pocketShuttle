import Image from "next/image"
import { AuthFooter } from "./footer/footer"

export const LgScreen = () => {
    return (
        <div className="flex items-center justify-center flex-col" >
            <div className="flex flex-col items-center justify-center">

                < Image src="/images/pslogo.png" alt="Pocket shuttle" width={350} height={200} />
                < Image src="/images/busima.png" alt="Pocket shuttle" width={400} height={200} />
            </div>
            <div className="space-y-3 mt-8 w-full ">
                < AuthFooter />
            </div>
        </div>
    )
}

