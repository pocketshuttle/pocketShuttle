'use client';

import React, { useEffect, useRef, useState } from 'react';
import Map, { Marker, Popup } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import mapboxgl from 'mapbox-gl';
import { getSchoolLocation } from '../lib/utils';
import Pusher from 'pusher-js';
import GoogleMapView from './google-map';
import { useTeacherLocation } from '@/hooks/useTeacher-location';
import { useSchoolTeacherLocations } from '@/hooks/useTeacherAblyLocation';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX!;

type TeacherLocation = {
    teacherId: string;
    teacherName: string;
    teacherImage: string;
    latitude: number;
    longitude: number;
};

export const DriversLocation = () => {
    const mapRef = useRef<any>(null);
    const [teachersLocations, setTeachersLocations] = useState<TeacherLocation[]>([]);
    const [mySchoolLocation, setSchoolLocation] = useState({ latitude: 0, longitude: 0 });
    const [schoolLocation, setschoolLocation] = useState({ latitude: 0, longitude: 0 });
    const [isMapLoaded, setIsMapLoaded] = useState(false);
    const pusherRef = useRef<Pusher | null>(null);

    const [teacherLocation, setTeacherLocation] = useState<TeacherLocation | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<string>("Connecting...");

    const teachers = useSchoolTeacherLocations()

    console.log("Teachers locations:", teachers);



    useEffect(() => {

        function getLocation() {
            if (navigator.geolocation) {
                const pos = navigator.geolocation.getCurrentPosition(pos => {
                    const { latitude, longitude } = pos.coords;
                    setschoolLocation({ latitude, longitude });
                    // console.log("School location updated:", { latitude, longitude });
                    console.log("Current position:", latitude, longitude);
                });

                console.log("Geolocation watchPosition started:", pos);

            } else {
                console.log("Geolocation is not supported by this browser.");
            }
        }

        getLocation();

        const fetchSchoolLocation = async () => {
            try {
                const [longitude, latitude] = await getSchoolLocation();
                setSchoolLocation({ latitude, longitude });

                if (mapRef.current) {
                    mapRef.current.flyTo({
                        center: [longitude, latitude],
                        zoom: 10,
                        speed: 0.5,
                        curve: 1.5,
                        essential: true,
                    });
                }
            } catch (error: any) {
                console.error("Error fetching school location:", error.message);
                // if (error.message.includes("denied")) {
                //     alert(error.message);
                // }
            }
        };

        fetchSchoolLocation();
    }, []);

    useEffect(() => {
        // Initialize Pusher only once
        if (!pusherRef.current) {
            pusherRef.current = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
                cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
            });

            const teacherChannel = pusherRef.current.subscribe('live-teachers-channel');

            teacherChannel.bind('teacher-location-update', (data: TeacherLocation) => {
                setTeachersLocations((prev) => {
                    const existingTeacherIndex = prev.findIndex((t) => t.teacherId === data.teacherId);
                    if (existingTeacherIndex >= 0) {
                        const updatedLocations = [...prev];
                        updatedLocations[existingTeacherIndex] = data;
                        return updatedLocations;
                    } else {
                        return [...prev, data];
                    }
                });
            });
        }

        return () => {
            if (pusherRef.current) {
                pusherRef.current.unsubscribe('live-teachers-channel');
                pusherRef.current.disconnect();
                pusherRef.current = null;
            }
        };
    }, []);

    return (
        <div className="w-full h-full">
            {/*     <Map 
                ref={mapRef}
                initialViewState={{
                    latitude: mySchoolLocation.latitude,
                    longitude: mySchoolLocation.longitude,
                    zoom: 10,
                }}
                style={{ width: '100%', height: '700px' }}
                mapStyle="mapbox://styles/mapbox/streets-v11"
                onLoad={() => setIsMapLoaded(true)}
                mapboxAccessToken={mapboxgl.accessToken}
            >
          
                <Marker
                    latitude={mySchoolLocation.latitude}
                    longitude={mySchoolLocation.longitude}
                >
                    <img
                        src="/images/school.png"
                        alt="My School"
                        style={{ width: '50px', height: '50px', borderRadius: '50%' }}
                    />
                </Marker>

              
                {teachersLocations.map((teacher) => (
                    <Marker
                        key={teacher.teacherId}
                        latitude={teacher.latitude}
                        longitude={teacher.longitude}
                    >
                        <img
                            src={teacher.teacherImage}
                            alt={teacher.teacherName}
                            style={{ width: '30px', height: '30px', borderRadius: '50%' }}
                        />
                        <Popup
                            closeButton={true}
                            closeOnClick={false}
                            longitude={teacher.longitude}
                            latitude={teacher.latitude}
                        >
                            <p className="capitalize text-gray-950">{teacher.teacherName}</p>
                        </Popup>
                    </Marker>
                ))}
            </Map>
*/}

            {/* <GoogleMapView latitude={mySchoolLocation.latitude} longitude={mySchoolLocation.longitude} /> */}


            {!isMapLoaded && (
                <div className="flex items-center justify-center h-[700px]">
                    <p>Loading map...</p>
                </div>
            )}
        </div>
    );
};