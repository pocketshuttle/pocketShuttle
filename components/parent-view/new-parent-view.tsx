"use client";

import { motion, useMotionValue, useTransform } from "framer-motion";
import { useState } from "react";
import ParentViewData from "./parentdata";
import { TeacherLocationTracker } from "../maps/Map/teachersLocation/teacher-parent-map";

export default function NewParentPage({
    parentAddress,
    parentId,
    selectedTeacherId,
    siblings,
}: any) {
    const y = useMotionValue(0);
    const [expanded, setExpanded] = useState(true);

    const expandedHeight = "80vh";
    const collapsedHeight = "20vh";

    // Background overlay opacity
    const overlayOpacity = useTransform(y, [0, 300], [0.5, 0]);

    return (
        <div className="relative w-full h-screen overflow-hidden">
            {/* Map at full screen */}
            <div className="absolute inset-0">
                {/* <TeacherLocationTracker
                    parentAddress={parentAddress || ""}
                    teacherId={selectedTeacherId || ""}
                    siblings={siblings}
                /> */}
            </div>

            {/* Semi-transparent backdrop (for clicking outside to collapse) */}
            {expanded && (
                <motion.div
                    className="absolute inset-0 bg-black"
                    style={{ opacity: overlayOpacity }}
                    onClick={() => setExpanded(false)}
                />
            )}

            {/* Bottom sheet */}
            <motion.div
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={0.2}
                onDragEnd={(_, info) => {
                    if (info.offset.y > 100) {
                        setExpanded(false);
                    } else {
                        setExpanded(true);
                    }
                }}
                initial={{ y: 0 }}
                animate={{
                    height: expanded ? expandedHeight : collapsedHeight,
                    y: 0,
                }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-lg overflow-y-auto"
            >
                {/* Drag handle */}
                <div className="w-full flex justify-center p-2">
                    <div className="w-12 h-1.5 bg-gray-400 rounded-full" />
                </div>

                {/* Parent kids data */}
                <ParentViewData userId={parentId} />
            </motion.div>
        </div>
    );
}
