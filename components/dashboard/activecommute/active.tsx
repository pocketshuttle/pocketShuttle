import { ActiveCommuteTable } from "./ui/table"

const ActiveCommute = () => {
    return (
        <div>
            <header className="px-4 py-3 text-lg ">
                Ongoing Commute
            </header>
            <div>
                <ActiveCommuteTable />
            </div>
        </div>
    )
}

export default ActiveCommute