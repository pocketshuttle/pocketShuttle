import { Poppins } from "next/font/google"
const poppins = Poppins({ weight: "500", subsets: ["latin"] })
export const ActiveCommuteTable = () => {
    return (
        <div className={`relative overflow-x-auto bg-transparent ${poppins}`} >
            <header className="px-4 py-3 text-[1rem] text-[var(--textSoft)] ">
                Ongoing Commute
            </header>
            <table className="w-full border-separate border-spacing-y-3 text-left text-sm text-black dark:text-white rtl:text-right">
                <thead className="text-xs uppercase tracking-wide text-black/60 dark:text-white/55">
                    <tr className="hover:bg-transparent">
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
                    <tr className="cursor-pointer bg-white text-black shadow-[0_8px_22px_rgba(15,23,42,0.06)] transition-colors hover:bg-white dark:bg-white/5 dark:text-white dark:shadow-none dark:hover:bg-white/10">
                        <th scope="row" className="whitespace-nowrap rounded-l-2xl px-6 py-5 font-medium">
                            Apple MacBook Pro 17"
                        </th>
                        <td className="px-6 py-5 text-black/75 dark:text-white/70">
                            Silver
                        </td>
                        <td className="px-6 py-5 text-black/75 dark:text-white/70">
                            Laptop
                        </td>
                        <td className="rounded-r-2xl px-6 py-5 text-black/75 dark:text-white/70">
                            $2999
                        </td>

                    </tr>
                </tbody>
            </table>
        </div>

    )
}
