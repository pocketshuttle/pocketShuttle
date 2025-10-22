"use client"
import { APIProvider, Map } from '@vis.gl/react-google-maps';
import { Directions } from './directions-to-parent';
import { useMemo } from 'react';
import { StudentProps } from '@/types';

type AddressProps = {
    parentAddress: string;
    teacherId: string;
    siblings: StudentProps
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

export const TeacherLocationTracker = ({ parentAddressCoords, teacherId, teacherLocation, userId }: AddressProps) => {

    const activeTeacher = useMemo(() => {
        return teacherLocation[teacherId] || null;
    }, [teacherId, teacherLocation]);

    return (
        <div className='rounded-bl-md'>
            <div style={{ width: '100%', height: '100vh', borderRadius: "100px" }}>
                <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
                    <Map
                        defaultCenter={{ lat: (parentAddressCoords?.latitude as number), lng: (parentAddressCoords?.longitude as number) }}
                        zoom={12}
                        mapId={process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID!}
                        fullscreenControl={false}
                        scrollwheel={false}
                    >
                        {/* @ts-ignore */}
                        {teacherLocation && <Directions parentAddressCoords={parentAddressCoords} teacherData={activeTeacher?.newLocation} userId={userId} />}
                    </Map>
                </APIProvider>
            </div>


        </div>


    )
};
