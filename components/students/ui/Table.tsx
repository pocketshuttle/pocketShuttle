import { Search } from "@/components/dashboard/search/search"
import { Button } from "@/components/ui/button"
export const StudentsData = () => {
    return (
        <div className="relative overflow-x-auto shadow-md sm:rounded-lg bg-[#182237]">
            <div className="p-4 flex justify-between items-center ">
                <Search placeholder="Search for students..." classname="border border-gray-700  outline-none focus-visible:outline-none px-2 py-0 focus-visible:ring-0 w-2/5" />
                <Button>
                    add new
                </Button>
            </div>
            <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                <thead className="text-xs text-gray-300 capitalize  ">
                    <tr >
                        <th scope="col" className="px-6 py-3" rowSpan={6}>
                            Name
                        </th>
                        <th scope="col" className="px-6 py-3">
                            Grade
                        </th>
                        <th scope="col" className="px-6 py-3">
                            Status
                        </th>
                        <th scope="col" className="px-6 py-3">
                            Date
                        </th>
                        <th scope="col" className="px-6 py-3">
                            Bus No
                        </th>

                    </tr>
                </thead>
                <tbody>
                    <tr className="dark:bg-gray-800  hover:bg-gray-900 cursor-pointer text-gray-300">

                        <td className="px-6 py-4" rowSpan={8}>
                            <div>
                                {/* <Image /> */}
                                <span>John Doe</span>
                            </div>
                        </td>
                        <td className="px-6 py-4 bg-crimson">
                            7
                        </td>
                        <td className="px-6 py-4">
                            status
                        </td>
                        <td className="px-6 py-4">
                            12/20/2024
                        </td>
                        <td className="px-6 py-4">
                            000/20/2024
                        </td>
                        <td className="px-6 py-4">
                            <div className="space-x-2">
                                <button>
                                    edit
                                </button>
                                <button>
                                    delete
                                </button>
                            </div>
                        </td>

                    </tr>
                </tbody>
            </table>
        </div>

    )
}
