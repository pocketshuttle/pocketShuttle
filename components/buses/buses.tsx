import { BusData } from "@/components/buses/ui/Table"

const Buses = () => {
    return (
        <div>
            <BusData />

            <div className="h-[40rem] w-full flex flex-col items-center justify-center bg-black space-y-5">
                <h1 className="text-lg font-semibold">Please confirm your account</h1>

                <p className="text-sm text-slate-600">Thank you for signing up for PocketShuttle, to confirm your account please click the button below</p>

                <button></button>
            </div>
        </div>
    )
}

export default Buses 