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
import { useSchoolTeachersLocations } from '@/hooks/useTeachersSocketLocation';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX!;

type TeacherLocation = {
    teacherId: string;
    teacherName: string;
    teacherImage: string;
    latitude: number;
    longitude: number;
};

export const DriversLocation = ({ userId }) => {
    const [teachersLocations, setTeachersLocations] = useState<TeacherLocation[]>([]);
    const [mySchoolLocation, setSchoolLocation] = useState({ latitude: 0, longitude: 0 });
    const [schoolLocation, setschoolLocation] = useState({ latitude: 0, longitude: 0 });
    const [isMapLoaded, setIsMapLoaded] = useState(false);

    // const teachers = useSchoolTeacherLocations()
    const teachersLocation = useSchoolTeachersLocations(userId)

    useEffect(() => {
        console.log("Updated teachers:", teachersLocation);
    }, [teachersLocation]);

    useEffect(() => {

        function getLocation() {
            if (navigator.geolocation) {
                const pos = navigator.geolocation.getCurrentPosition(pos => {
                    const { latitude, longitude } = pos.coords;
                    // Also set mySchoolLocation
                    setSchoolLocation({ latitude, longitude }); 
                });

            } else {
                console.log("Geolocation is not supported by this browser.");
            }
        }

        getLocation();
    }, []);

    return (
        <div className="w-full h-full">
            <GoogleMapView latitude={mySchoolLocation.latitude} longitude={mySchoolLocation.longitude} teachersLocation={teachersLocation} />
        </div>
    );
};


export default function TeachersLocation({ userId }) {
    return (
        <ChannelProvider channelName="live-school-channel">
            <DriversLocation userId={userId} />
        </ChannelProvider>
    );
}