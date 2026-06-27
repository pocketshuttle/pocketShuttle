interface AveragePickUpProps {
    headLabel: string
    avgTime: string
}

export const AveragePickUp = ({ headLabel, avgTime }: AveragePickUpProps) => {
    return (
        <div className="rounded-lg border border-black/10 bg-white p-4 text-black transition-colors hover:bg-black/[0.02] dark:border-white/10 dark:bg-zinc-950 dark:text-white dark:hover:bg-white/[0.04]">
            <div className="space-y-2">
                <p className="text-sm font-medium text-black/55 dark:text-white/55">
                    {headLabel}
                </p>
                <p className="text-3xl font-semibold">
                    {avgTime || "--"}
                </p>
            </div>
        </div>
    )
}
