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
import { ChannelProvider, useChannel } from 'ably/react';

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

    const teachers = useSchoolTeacherLocations()

    console.log(teachers)
    console.log(mySchoolLocation)

    useEffect(() => {

        function getLocation() {
            if (navigator.geolocation) {
                const pos = navigator.geolocation.getCurrentPosition(pos => {
                    const { latitude, longitude } = pos.coords;
                    setschoolLocation({ latitude, longitude });
                    setSchoolLocation({ latitude, longitude });
                    // console.log("School location updated:", { latitude, longitude });
                });

                console.log("Geolocation watchPosition started:", pos);

            } else {
                console.log("Geolocation is not supported by this browser.");
            }
        }

        getLocation();
    }, []);

    return (
        <div className="w-full h-full">

            <GoogleMapView latitude={mySchoolLocation.latitude} longitude={mySchoolLocation.longitude} teachersLocation={teachers} />

            {!isMapLoaded && (
                <div className="flex items-center justify-center h-[700px]">
                    <p>Loading map...</p>
                </div>
            )}
        </div>
    );
};


export default function TeachersLocation() {
    return (
        <ChannelProvider channelName="live-school-channel">
            <DriversLocation />
        </ChannelProvider>
    );
}