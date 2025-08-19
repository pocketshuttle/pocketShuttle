"use client"
import { APIProvider, Map, useMapsLibrary, useMap } from '@vis.gl/react-google-maps';
import { Directions } from './directions-to-parent';
import { useEffect, useMemo, useState } from 'react';
import { googleFetchCoordinates } from '../../lib/utils';
import { useTeacherLocation } from '@/hooks/useTeacher-location';

type AddressProps = {
    parentAddress: string;
    teacherId: string;
};

type TeacherLocation = {
    teacherId: string;
    teacherName: string;
    teacherImage: string;
    latitude: number;
    longitude: number;
};

export const TeacherLocationTracker = ({ parentAddress, teacherId }: AddressProps) => {

    const [teacherLocation, setTeacherLocation] = useState<TeacherLocation | null>(null);

    useTeacherLocation(teacherId, setTeacherLocation);


   

    return (

        <div style={{ width: '100%', height: '80vh' }}>
            <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
                <Map

                    // defaultCenter={{ lat: 6.5244, lng: 3.3792 }}

                    zoom={13}
                    mapId={process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID!}
                    fullscreenControl={false}
                    scrollwheel={false}
                >
                    {teacherData && <Directions teacherData={teacherLocation} />}
                </Map>
            </APIProvider>
        </div>
    )
};

