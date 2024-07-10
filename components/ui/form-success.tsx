import { CheckCircledIcon } from "@radix-ui/react-icons";
import { Button } from "./button";
import { Dispatch, SetStateAction } from "react";

interface FormSuccessProps {
    message?: string;
    setIsOpenModal: Dispatch<SetStateAction<boolean>>
}
export const FormSuccess = ({ message, setIsOpenModal }: FormSuccessProps) => {
    if (!message) {
        return null
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
            <div className="relative bg-gray-900  rounded-md space-y-2 ">
                <div className="bg-emerald-500/15 rounded-md p-3 flex items-center justify-center flex-col gap-x-2 text-sm text-emerald-500">
                    <CheckCircledIcon className="w-4 h-4" />
                    <p>{message}</p>
                    <Button size="lg" className="mt-3" onClick={() => setIsOpenModal(false)}>Add More</Button>
                </div>
            </div>
        </div>

    )

}