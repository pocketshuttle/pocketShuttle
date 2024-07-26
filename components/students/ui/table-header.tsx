import { Search } from "@/components/dashboard/search/search"
import { Button } from "@/components/ui/button"
import Link from "next/link"

const TableHeader = () => {
    return (
        <div>
            <div className="p-4 flex justify-between items-center ">
                <Search placeholder="Search for students..." classname="border border-gray-700  outline-none focus-visible:outline-none px-2 py-0 focus-visible:ring-0 w-2/5" />
                <div className="gap-3">
                    <Link href="/dashboard/students/allstudents">
                        <Button variant="link" className="ml-2 text-blue-600">View All Students</Button>
                    </Link>

                    <Button variant="secondary" onClick={() => setIsOpenModal(true)}>
                        add new
                    </Button>
                </div>
            </div>
            {
                isOpenModal && <StudentModal isOpenModal={isOpenModal} setIsOpenModal={setIsOpenModal} />
            }
        </div>
    )
}

export default TableHeader