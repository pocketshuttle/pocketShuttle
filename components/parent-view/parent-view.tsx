"use client"

import { useMemo, useState } from "react"
import { BusArrival } from "./bus-arrival"
import { KidsViewTab } from "./kids-tab"
import ParentViewData from "./parentdata"
import { StudentProps } from "@/types"
import { TeacherLocationTracker } from "../maps/Map/teachersLocation/teacher-parent-map"

export const ParentMainView = ({
    parentAddress,
    parentId,
    siblings
}: {
    parentAddress: string
    parentId: string
    siblings: StudentProps[]
}) => {
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(
        siblings.length > 0 ? siblings[0].id : null
    )

    const selectedSibling = useMemo(
        () => siblings.find(s => s.id === selectedStudentId) || null,
        [siblings, selectedStudentId]
    )

    // Precompute teacher IDs for all siblings
    const allTeacherIds = useMemo(
        () => siblings.map(s => s.bus?.teacher?.id).filter(Boolean),
        [siblings]
    )

    const uniqueTeacherIds = useMemo(
        () => new Set(allTeacherIds),
        [allTeacherIds]
    )

    // Decide the teacher ID to use for the map
    const selectedTeacherId = useMemo(() => {
        if (!selectedSibling) return null
        return uniqueTeacherIds.size === 1
            ? allTeacherIds[0] ?? null
            : selectedSibling.bus?.teacher?.id || null
    }, [uniqueTeacherIds, allTeacherIds, selectedSibling])

    if (siblings.length === 0) {
        return <div>No students found for this parent.</div>
    }

    return (
        <div className="space-y-4">
            {/* Tab control for kids */}
            <KidsViewTab
                siblings={siblings}
                selectedStudentId={selectedStudentId}
                onSelect={setSelectedStudentId}
            />

            <  TeacherLocationTracker />

            {/* Map only changes when selectedTeacherId changes
            {selectedTeacherId && (
                <BusArrival
                    key={selectedTeacherId} // Forces re-render only when teacher changes
                    parentAddress={parentAddress || ""}
                    parentId={parentId}
                    teacherId={selectedTeacherId}
                />
            )} */}

            {/* Additional parent info */}
            <ParentViewData userId={parentId} />
        </div>
    )
}
