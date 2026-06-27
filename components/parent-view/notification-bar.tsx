type StudentNotificationBarProps = {
    eta?: string; // Estimated Time of Arrival
}

export const StudentNotificationBar = ({ eta }: StudentNotificationBarProps) => {
    return (
        <div className='bg-green-400/30 px-2 w-[95%] m-auto rounded-md py-5 text-green-950 border border-green-200 '>StudentNotificationBar</div>
    )
}
