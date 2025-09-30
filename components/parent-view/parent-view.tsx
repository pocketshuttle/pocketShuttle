"use client"

import { useEffect, useMemo, useState } from "react"
import { BusArrival } from "./bus-arrival"
import { KidsViewTab } from "./kids-tab"
import ParentViewData from "./parentdata"
import { StudentProps } from "@/types"
import { TeacherLocationTracker } from "../maps/Map/teachersLocation/teacher-parent-map"
import { useRecoilValue } from "recoil"
import { sendPushNotification } from "@/onesignal/send-push"
import OneSignal from "react-onesignal";


export const ParentMainView = ({
    parentAddress,
    parentId,
    siblings
}: {
    parentAddress: string
    parentId: string
    siblings: StudentProps[]
}) => {

    useEffect(() => {
        if (!parentId) return;

        const loginToOneSignal = async () => {
            try {
                // Make sure SDK is initialized before trying login
                await OneSignal.User.PushSubscription.optIn();
                await OneSignal.login(parentId);

                // console.log(" OneSignal logged in:", parentId);
            } catch (err) {
                console.error(" OneSignal login failed:", err);
            }
        };

        // Small delay to ensure SDK has finished bootstrapping
        const timer = setTimeout(loginToOneSignal, 500);

        return () => clearTimeout(timer);
    }, [parentId]);

    //we take the first teahcer
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(
        siblings.length > 0 ? siblings[0].id : null
    )

    const selectedSibling = useMemo(
        () => siblings.find(s => s.id === selectedStudentId) || null,
        [siblings, selectedStudentId]
    )

    // get the teacher IDs for all siblings
    const allTeacherIds = useMemo(
        () => siblings.map(s => s.bus?.teacher?.id).filter(Boolean),
        [siblings]
    )
    const allTeacher = useMemo(
        () => siblings.map(s => s.bus?.teacher).filter(Boolean),
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
        <div className="">
            {/* Tab control for kids */}

            <KidsViewTab
                siblings={siblings}
                selectedStudentId={selectedStudentId}
                onSelect={setSelectedStudentId}
            />

            <  TeacherLocationTracker
                parentAddress={parentAddress || ""}
                // parentId={parentId}
                teacherId={selectedTeacherId || ""}
                siblings={siblings}
            />
        
            <ParentViewData userId={parentId} />
        </div>
    )
}
    {/* <button
                onClick={() => sendPushNotification("bus coming", parentId)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg"
            >
                Send Push Notification
            </button> */}
            {/* 
            Map only changes when selectedTeacherId changes
            */}
            {/* {selectedTeacherId && (
                <BusArrival
                    key={selectedTeacherId}
                    parentAddress={parentAddress || ""}
                    parentId={parentId}
                    teacherId={selectedTeacherId}
                    teachers={allTeacher || []}
                    page="parent_view"
                />
            )} */}

            {/* Additional parent info */}