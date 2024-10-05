'use client';

import React, { useEffect, useRef, useState } from 'react';
import Map, { Marker, Popup } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import mapboxgl from 'mapbox-gl';
import { getCurrentLocation, sendLocationToServer } from '../lib/utils';
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

    useEffect(() => {
        // Pusher setup to receive teacher location updates
        const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
            cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
        });

        // Subscribe to the channel
        const channel = pusher.subscribe('live-teachers-channel');

        // Listen for 'teacher-location-update' event (make sure this matches your server event name)
        channel.bind('teacher-location-update', (data: TeacherLocation) => {
            setTeachersLocations((prev) => {
                // Update the previous location if it exists, else add new teacher
                const existingTeacherIndex = prev.findIndex(t => t.teacherId === data.teacherId);
                if (existingTeacherIndex >= 0) {
                    // Update existing teacher's location
                    const updatedLocations = [...prev];
                    updatedLocations[existingTeacherIndex] = data;
                    return updatedLocations;
                } else {
                    // Add new teacher
                    return [...prev, data];
                }
            });
        });

        return () => {
            pusher.unsubscribe('live-teachers-channel');
        };
    }, []);

    return (
        <div>
            <Map
                initialViewState={{
                    latitude: 0,  // Adjust initial center coordinates based on your region
                    longitude: 0,
                    zoom: 10,
                }}
                style={{ width: '100%', height: '700px' }}
                mapStyle="mapbox://styles/mapbox/streets-v11"
                ref={mapRef}
                mapboxAccessToken={mapboxgl.accessToken}
            >
                {/* Render markers for all teachers */}
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
                            longitude={teacher.longitude}  // Corrected longitude here
                            latitude={teacher.latitude}
                        >
                            <p className='capitalize text-gray-950'>

                                {teacher.teacherName}
                            </p>
                        </Popup>
                    </Marker>
                ))}
            </Map>
        </div>
    );
};
