import { Input } from "@/components/ui/input"
import { BiSearch } from "react-icons/bi"

const Navbar = () => {
    return (
        <div className="w-full h-16 bg-[#182237] rounded-sm flex justify-between items-center">
            <div>
                DashBoard
            </div>
            <div className="">
                <div className="flex justify-center items-center border border-gray-600 px-3 focus-visible:ring-ring rounded-md ">
                    <BiSearch className="w-4" />
                    <Input placeholder="Search" className=" border-none  outline-none foc focus-visible:outline-none px-0 py-0 focus-visible:ring-0" />
                </div>
            </div>
        </div>
    )
}

export default Navbar