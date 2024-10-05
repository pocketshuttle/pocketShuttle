'use client';

import React, { useEffect, useRef, useState } from 'react';
import Map, { Marker, Popup } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import mapboxgl from 'mapbox-gl';
import { getSchoolLocation } from '../lib/utils'; // Removed sendLocationToServer as it's no longer needed
import Pusher from 'pusher-js';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX!;

type TeacherLocation = {
    teacherId: string;
    teacherName: string;
    teacherImage: string;
    latitude: number;
    longitude: number;
};

export const DriversLocation = () => {
    const mapRef = useRef(null);
    const [teachersLocations, setTeachersLocations] = useState<TeacherLocation[]>([]);
    const [mySchoolLocation, setSchoolLocation] = useState({ latitude: 0, longitude: 0 });
    const [isMapLoaded, setIsMapLoaded] = useState(false);

    useEffect(() => {
        const fetchSchoolLocation = async () => {
            try {
                const [longitude, latitude] = await getSchoolLocation();
                setSchoolLocation({ latitude, longitude });

                if (mapRef.current) {
                    (mapRef.current as any).flyTo({
                        center: [longitude, latitude],
                        zoom: 10,
                        speed: 0.5,
                        curve: 1.5,
                        essential: true, // Ensures animation runs on all devices
                    });
                }
            } catch (error) {
                console.error('Error fetching school location:', error);
            }
        };

        fetchSchoolLocation();
    }, []);

    useEffect(() => {
        const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
            cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
        });

        const teacherChannel = pusher.subscribe('live-teachers-channel');

        // Listen for teacher location updates
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

        // Cleanup Pusher subscriptions on component unmount
        return () => {
            teacherChannel.unbind_all();
            pusher.unsubscribe('live-teachers-channel');
        };
    }, []);

    return (
        <div>
            {mySchoolLocation.latitude && mySchoolLocation.longitude ? (
                <Map
                    initialViewState={{
                        latitude: mySchoolLocation.latitude,
                        longitude: mySchoolLocation.longitude,
                        zoom: 10,
                    }}
                    style={{ width: '100%', height: '700px' }}
                    mapStyle="mapbox://styles/mapbox/streets-v11"
                    ref={mapRef}
                    onLoad={() => setIsMapLoaded(true)}
                    mapboxAccessToken={mapboxgl.accessToken}
                >
                    {/* Static marker for school if no teachers are online */}
                    {teachersLocations.length === 0 && (
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
                    )}

                    {/* Render dynamic markers for all teachers */}
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
            ) : (
                <div>Loading map...</div>
            )}
        </div>
    );
};
