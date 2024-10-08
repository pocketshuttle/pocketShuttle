"use client"
import Pusher from 'pusher-js';
import { useEffect, useState } from "react";
import Location from '../maps/Map/new-map';


interface TeacherLocation {
    teacherId: string;
    teacherName: string;
    teacherImage: string;
    latitude: number;
    longitude: number;
};

//@ts-expect-error
export const BusArrival = ({ parentAddress, parentId }) => {
    const [teacherLocation, setTeacherLocation] = useState<TeacherLocation | null>(null);

    useEffect(() => {
        // Ensure environment variables are set
        const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
        const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

        if (!pusherKey || !pusherCluster) {
            console.error("Pusher key or cluster not set in environment variables.");
            return;
        }

        const pusher = new Pusher(pusherKey, {
            cluster: pusherCluster,
        });

        // Subscribe to the parent-specific channel for updates
        const channel = pusher.subscribe(`parent-${parentId}`);

        // Handle location updates from the teacher
        const handleLocationUpdate = (data: TeacherLocation) => {
            // Check if the new location is different before updating state to avoid redundant re-renders
            if (data.latitude !== teacherLocation?.latitude || data.longitude !== teacherLocation?.longitude) {
                setTeacherLocation(data);
            }
        };

        channel.bind("teacher-location-update", handleLocationUpdate);

        // Cleanup on component unmount
        return () => {
            channel.unbind("teacher-location-update", handleLocationUpdate); // Unbind specific event
            pusher.unsubscribe(`parent-${parentId}`); // Unsubscribe from the parent-specific channel
            pusher.disconnect(); // Cleanly disconnect from Pusher
        };
    }, [parentId, teacherLocation]);

    return (
        <div>
            {/* Render the map component only when valid teacher data is available */}
            {teacherLocation && (
                <Location
                    parentAddress={parentAddress}
                    teacherData={teacherLocation}
                />
            )}
        </div>
    );
};
