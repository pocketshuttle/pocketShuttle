import Image from "next/image"
import { AuthFooter } from "./footer/footer"

export const LgScreen = () => {
    return (
        <div className="flex items-center justify-center flex-col" >
            <div className="flex flex-col items-center justify-center space-y-4">
                < Image src="/whitefullname.png" alt="Pocket shuttle" width={400} height={200} />
                < Image src="/images/buus.png" alt="Pocket shuttle" width={400} height={200} />
            </div>
            <div className="space-y-3 mt-8 w-full ">
                < AuthFooter />
            </div>
        </div>
    )
}

