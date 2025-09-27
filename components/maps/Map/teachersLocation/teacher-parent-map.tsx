"use client"
import { APIProvider, Map, useMapsLibrary, useMap } from '@vis.gl/react-google-maps';
import { Directions } from './directions-to-parent';
import { useEffect, useMemo, useState } from 'react';
import { googleFetchCoordinates } from '../../lib/utils';
import { useTeacherLocation } from '@/hooks/useTeacher-location';
import { resolve } from 'path';

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

    const [teacherLocation, setTeacherLocation] = useState<
        Record<string, { teacherId: string; teacherName: string; teacherImage: string; latitude: number; longitude: number }>
    >({});


    useEffect(() => {
        let socket: any

        const connectToTeacerLocation = async () => {
            try {
                await new Promise((resolve, reject) => {
                    const timeOut = setTimeout(() => {
                        reject(new Error("Socket connection timeout"))
                    }, 10000)

                    socket.on("connect", () => {
                        clearTimeout(timeOut)
                        console.log("Parent socket connected", socket.id)

                        //if we join with the teacher Id, doeosnt that mean every parent with teh teacher Id can see the same location
                        //we join the parent room with the teacherId
                        socket.emit("subscribe-teacher", teacherId);
                        resolve(true)
                    })

                    socket.on("connect_error", (error: any) => {
                        clearTimeout(timeOut)
                        reject(error)
                    })
                })

                
            } catch (error) {

            }
        }
    }, [teacherId])



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

            <div style={{ width: '100%', height: '60vh', borderRadius: "100px" }}>
                <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
                    <Map
                        defaultCenter={{ lat: 6.5244, lng: 3.3792 }}
                        zoom={12}
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

