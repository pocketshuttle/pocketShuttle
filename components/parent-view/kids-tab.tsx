"use client"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StudentProps } from "@/types"
import { useRecoilValue } from "recoil"

type KidsViewTabProps = {
    siblings: StudentProps[]
    selectedStudentId: string | null
    onSelect: (studentId: string) => void
}

export const KidsViewTab = ({ siblings, selectedStudentId, onSelect }: KidsViewTabProps) => {
    const current = selectedStudentId ?? (siblings[0]?.id ?? "")
    // "#38BDF8",
    //   "background_color": "#16171c",
    return (
        <div className="bg-gray-100 px-4 py-3">
            <Tabs value={current} onValueChange={onSelect} className="w-full">
                <TabsList className="flex h-auto w-full justify-start gap-2 overflow-x-auto rounded-lg border border-black/10 bg-white p-1.5">
                    {siblings.map((sibling) => (
                        <TabsTrigger
                            key={sibling.id}
                            value={sibling.id}
                            className="shrink-0 rounded-lg px-4 py-2 text-sm capitalize text-black/60 data-[state=active]:bg-black data-[state=active]:text-white"
                        >
                            {sibling.full_name || "Unnamed"}
                        </TabsTrigger>
                    ))}
                </TabsList>
            </Tabs>
        </div>
    )
}
