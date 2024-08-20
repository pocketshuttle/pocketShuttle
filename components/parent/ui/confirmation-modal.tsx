type ConfirmProps = {
    handleYes: (confirm: string) => void
    handleCancel: () => void
    isPending: boolean
}
export const ConfirmationModal = ({ handleYes, handleCancel, isPending }: ConfirmProps) => {
    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black bg-opacity-75">
            <div className="relative bg-gray-900  rounded-md w-2/6 p-4 h-52 flex items-center justify-center flex-col space-y-10">
                <p className=" text-lg text-center">
                    This student already belongs to a Parent, confirming yes would change the relationship to a new Parent
                </p>
                <div className="space-x-4">
                    <button
                        disabled={isPending}
                        onClick={() => handleYes("yes")}
                        className="bg-[teal] p-2 w-28 text-md text-[#b7f7f7] rounded-sm">Yes</button>
                    <button

                        onClick={handleCancel}
                        className="bg-[crimson] w-28 p-2 rounded-sm text-[#ffdbe2]">Cancel</button>
                </div>

            </div>
        </div>
    )
}
