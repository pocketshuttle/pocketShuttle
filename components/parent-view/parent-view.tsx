"use client"

import { useMemo, useState } from "react"
import { BusArrival } from "./bus-arrival"
import { KidsViewTab } from "./kids-tab"
import ParentViewData from "./parentdata"
import { StudentProps } from "@/types"

export const ParentMainView = ({ parentAddress, parentId, siblings }: { parentAddress: string, parentId: string, siblings: StudentProps[] }) => {
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(siblings[0]?.id ?? null)

    const selectedSibling = useMemo(() => {
        return siblings.find(s => s.id === selectedStudentId) || null
    }, [siblings, selectedStudentId])

    const selectedTeacherId = selectedSibling?.bus?.teacher?.id

    return (
        <div className="space-y-4">
            <KidsViewTab siblings={siblings} selectedStudentId={selectedStudentId} onSelect={setSelectedStudentId} />

            <div>
                {selectedTeacherId && (
                    <BusArrival parentAddress={parentAddress || ""} parentId={parentId} teacherId={selectedTeacherId} />
                )}
            </div>

            <ParentViewData userId={parentId} />
        </div>
    )
}
