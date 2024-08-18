import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

type StudentPresenceProps = {
    data: string;
};

export const StudentPresence = ({ data }: StudentPresenceProps) => {
    console.log(data);
    return (
        <div className={`h-3 w-3 rounded-full ${data === "NONE" ? "bg-gray-700" : data === "IN_BUS" ? "bg-[teal]" : data === "AT_SCHOOL" ? "bg-blue-900" : ""}`}>

        </div>
    );
};
