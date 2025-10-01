"use client"
import { APIProvider, Map, useMapsLibrary, useMap } from '@vis.gl/react-google-maps';
import { Directions } from './directions-to-parent';
import { useEffect, useMemo, useState } from 'react';
import { googleFetchCoordinates } from '../../lib/utils';
import { useTeacherLocation } from '@/hooks/useTeacher-location';
import { connectSocket } from '@/utils/socket-client';
import { StudentProps } from '@/types';

type AddressProps = {
    parentAddress: string;
    teacherId: string;
    siblings: StudentProps
    teacherLocation: TeacherLocation
};

type TeacherLocation = {
    teacherId: string;
    teacherName: string;
    teacherImage: string;
    latitude: number;
    longitude: number;
};

export const TeacherLocationTracker = ({ parentAddress, teacherId, teacherLocation }: AddressProps) => {


    // useTeacherLocation(teacherId, setTeacherLocation);
    // useTeacherLocation(teacherId, (data) => {
    //     setTeacherLocation(prev => ({
    //         ...prev,
    //         [data.teacherId]: {
    //             teacherId: data.teacherId,
    //             teacherName: data.teacherName,
    //             teacherImage: data.teacherImage,
    //             latitude: data.latitude,
    //             longitude: data.longitude
    //         }
    //     }));
    // });

    const activeTeacher = useMemo(() => {
        return teacherLocation[teacherId] || null;
    }, [teacherId, teacherLocation]);

    return (
        <div className='rounded-bl-md'>
            {/* {
                teacherLocation && ( */}

            <div style={{ width: '100%', height: '100vh', borderRadius: "100px" }}>
                <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
                    <Map
                        defaultCenter={{ lat: 6.5244, lng: 3.3792 }}
                        zoom={12}
                        mapId={process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID!}
                        fullscreenControl={false}
                        scrollwheel={false}
                    >
                        {/* @ts-ignore */}
                        {teacherLocation && <Directions parentAddress={parentAddress} teacherData={activeTeacher?.newLocation} />}
                    </Map>
                </APIProvider>
            </div>
            

        </div>


    )
};
