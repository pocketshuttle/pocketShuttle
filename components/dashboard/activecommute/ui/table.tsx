import { Poppins } from "next/font/google"
const poppins = Poppins({ weight: "500", subsets: ["latin"] })
export const ActiveCommuteTable = () => {
    return (
        <div className={`relative overflow-x-auto shadow-md sm:rounded-lg bg-[#182237] ${poppins}`} >
            <header className="px-4 py-3 text-[1rem] text-[var(--textSoft)] ">
                Ongoing Commute
            </header>
            <table className="w-full text-[0.8rem] text-left rtl:text-right text-gray-500 dark:text-gray-400">
                <thead className="text-xs text-gray-300 capitalize  ">
                    <tr>
                        <th scope="col" className="px-6 py-3">
                            Bus
                        </th>
                        <th scope="col" className="px-6 py-3">
                            Status
                        </th>
                        <th scope="col" className="px-6 py-3">
                            Date
                        </th>
                        <th scope="col" className="px-6 py-3">
                            Students
                        </th>

                    </tr>
                </thead>
                <tbody>
                    <tr className="dark:bg-gray-800  hover:bg-gray-900 cursor-pointer">
                        <th scope="row" className="px-6 py-4 font-medium text-gray-300 whitespace-nowrap dark:text-white">
                            Apple MacBook Pro 17"
                        </th>
                        <td className="px-6 py-4">
                            Silver
                        </td>
                        <td className="px-6 py-4">
                            Laptop
                        </td>
                        <td className="px-6 py-4">
                            $2999
                        </td>

                    </tr>
                </tbody>
            </table>
        </div>

    )
}
