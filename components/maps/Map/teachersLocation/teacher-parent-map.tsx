"use client"
import { APIProvider, Map } from '@vis.gl/react-google-maps';
import { Directions } from './directions-to-parent';
import { memo, useMemo } from 'react';

type AddressProps = {
    parentAddress: string;
    teacherId: string;
    teacherLocation: { [teacherId: string]: TeacherLocation }
    parentAddressCoords?: { latitude: number, longitude: number }
    userId: string
};

type TeacherLocation = {
    teacherId: string;
    teacherName: string;
    teacherImage: string;
    latitude: number;
    longitude: number;
};

export const TeacherLocationTracker = memo(function TeacherLocationTracker({ parentAddressCoords, teacherId, teacherLocation, userId }: AddressProps) {


    console.log("Rendering TeacherLocationTracker with props:", { parentAddressCoords, teacherId, teacherLocation, userId });

    const activeTeacher = useMemo(() => {
        return teacherLocation[teacherId] || null;
    }, [teacherId, teacherLocation]);
    const mapCenter = useMemo(() => {
        if (!parentAddressCoords) return null;

        return {
            lat: parentAddressCoords.latitude,
            lng: parentAddressCoords.longitude,
        };
    }, [parentAddressCoords]);

    if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || !mapCenter) {
        return (
            <div className="grid h-full w-full place-items-center bg-gray-200 px-4 text-center text-sm text-black/60">
                Map is unavailable right now.
            </div>
        );
    }

    return (
        <div className="h-full w-full overflow-hidden bg-gray-200">
            <div style={{ width: '100%', height: '100%' }}>
                <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
                    <Map
                        defaultCenter={mapCenter}
                        zoom={12}
                        mapId={process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID!}
                        fullscreenControl={false}
                        scrollwheel={false}
                    >
                        {activeTeacher && <Directions parentAddressCoords={parentAddressCoords!} teacherData={activeTeacher} userId={userId} />}
                    </Map>
                </APIProvider>
            </div>


        </div>


    )
});
