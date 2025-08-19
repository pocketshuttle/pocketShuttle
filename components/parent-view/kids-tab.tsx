"use client"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StudentProps } from "@/types"
import { useRecoilValue } from "recoil"
import { studentETA } from "@/atoms/eta";
type KidsViewTabProps = {
    siblings: StudentProps[]
    selectedStudentId: string | null
    onSelect: (studentId: string) => void
}

export const KidsViewTab = ({ siblings, selectedStudentId, onSelect }: KidsViewTabProps) => {
    const current = selectedStudentId ?? (siblings[0]?.id ?? "")
    const stdentEta = useRecoilValue(studentETA);

  

    return (
        <div>
            <Tabs value={current} onValueChange={onSelect} className="w-full">
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
