"use client"
import Pusher from 'pusher-js';

import { useEffect, useState } from "react";
import Location from '../maps/Map/new-map';
type TeacherLocation = {
    teacherId: string;
    teacherName: string;
    teacherImage: string;
    latitude: number;
    longitude: number;
};

//@ts-expect-error
export const BusArrival = ({ parentAddress }) => {
    //We are using teacher and not bus, because
    // 1. if teacher is coming Soon, it most certainly bus is Coming_Soon,
    // II. teachers have logins and drivers dont
    //III> so when the teacher trigger the button to alert the parent, theyre on their way for pick up, the parent c an visualize the movement of the teacher 
    const [teachersLocations, setTeachersLocations] = useState<TeacherLocation>();

    useEffect(() => {
        const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
            cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
        });

        const teacherChannel = pusher.subscribe('live-teachers-channel');
        teacherChannel.bind("teacher-location-update", (data: TeacherLocation) => {
            setTeachersLocations(data)
        })

        // Cleanup Pusher subscriptions on component unmount
        return () => {
            teacherChannel.unbind_all();
            pusher.unsubscribe('live-teachers-channel');
        };
    }, [])

    return (
        <div>
            <Location address={"lagos, NG"}
                parentAddress={parentAddress}
                teacherData={teachersLocations}
            />
        </div>
    )
}
