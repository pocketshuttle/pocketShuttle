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
};

type TeacherLocation = {
    teacherId: string;
    teacherName: string;
    teacherImage: string;
    latitude: number;
    longitude: number;
};

export const TeacherLocationTracker = ({ parentAddress, teacherId }: AddressProps) => {


    // console.log(siblings, "sibling of te united united satate")
    const [teacherLocation, setTeacherLocation] = useState<
        Record<string, { teacherId: string; teacherName: string; teacherImage: string; latitude: number; longitude: number }>
    >({});




    useEffect(() => {
        let socket: any;
        const connectToTeacher = async () => {
            try {
                socket = await connectSocket(teacherId, "");

                await new Promise((resolve, reject) => {
                    const timeout = setTimeout(() => {
                        reject(new Error("Socket Connection Time out"));
                    }, 1000);

                    socket.on("connect", () => {
                        clearTimeout(timeout);
                        // console.log("Socket connected and ready!, from parent", socket.id);

                        //since we using teacher id to subscribe does tha mean, all the parentsa can see all the location?
                        // subscribe parent to teacher room
                        socket.emit("subscribe-teacher", { teacherId });

                        resolve(true);
                    });

                    socket.on("connect_error", (error: any) => {
                        console.log(error, "errors from socket");
                        clearTimeout(timeout);
                        reject(error);
                    });
                });


                socket.on("teacher-location-update", (location: TeacherLocation) => {
                    // console.log(" Location update received at parent:", location);
                    setTeacherLocation((prev) => ({
                        ...prev,
                        [location.teacherId]: location,
                    }));
                });

                socket.on("disconnect", (reason: string) => {
                    console.log("Parent socket disconnected:", reason);
                });
            } catch (error) {
                console.error("Failed to connect parent socket:", error);
            }
        };

        connectToTeacher();

        return () => {
            if (socket) socket.disconnect();
        };
    }, [teacherId]);

    // console.log(teacherLocation, "this is a teachers location")


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

    // console.log(activeTeacher?.newLocation, "from parent teacher")



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
            {/* )
            } */}

        </div>


    )
};




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