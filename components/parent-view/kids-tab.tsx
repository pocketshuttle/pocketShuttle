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
        <div>
            <Tabs value={current} onValueChange={onSelect} className="w-full mb-3">
                <TabsList className="flex flex-wrap gap-2">
                    {siblings.map((sibling) => (
                        <TabsTrigger key={sibling.id} value={sibling.id} className="capitalize text-gray-100">
                            {sibling.full_name || "Unnamed"}
                        </TabsTrigger>
                    ))}
                </TabsList>
            </Tabs>
        </div>
    )
}
