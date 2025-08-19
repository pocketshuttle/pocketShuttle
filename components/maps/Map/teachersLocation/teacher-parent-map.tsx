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

const TeacherLocations: TeacherLocation = {
    teacherId: 'cm0wc7v7800003827vzhr5m5q',
    teacherName: 'mercy',
    teacherImage: 'https://res.cloudinary.com/du5poiq3l/image/upload/v1725967013/f7sqdmgryzbycgyopwij.jpg',
    latitude: 9.2177996,
    longitude: 7.367077,
}

export const TeacherLocationTracker = ({ parentAddress, teacherId }: AddressProps) => {

    // const [teacherLocation, setTeacherLocation] = useState<TeacherLocation | null>(TeacherLocation);
    const [teacherLocation, setTeacherLocation] = useState<
        Record<string, { teacherId: string; teacherName: string; teacherImage: string; latitude: number; longitude: number }>
    >({});

    // useTeacherLocation(teacherId, setTeacherLocation);
    useTeacherLocation(teacherId, (data) => {
        setTeacherLocation(prev => ({
            ...prev,
            [data.teacherId]: {
                teacherId: data.teacherId,
                teacherName: data.teacherName,
                teacherImage: data.teacherImage,
                latitude: data.latitude,
                longitude: data.longitude
            }
        }));
    });

    const activeTeacher = useMemo(() => {
        return teacherLocation[teacherId] || null;
    }, [teacherId, teacherLocation]);



    return (
        <div>
            {/* {
                teacherLocation && ( */}

            <div style={{ width: '100%', height: '80vh' }}>
                <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
                    <Map

                        defaultCenter={{ lat: 6.5244, lng: 3.3792 }}
                        zoom={13}
                        mapId={process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID!}
                        fullscreenControl={false}
                        scrollwheel={false}
                    >
                        {teacherLocation && <Directions parentAddress={parentAddress} teacherData={activeTeacher} />}
                    </Map>
                </APIProvider>
            </div>
            {/* )
            } */}

        </div>


    )
};

