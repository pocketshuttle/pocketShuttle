'use client';

import React, { useEffect, useRef, useState } from 'react';
import Map, { Marker } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import mapboxgl from 'mapbox-gl';
import { getCurrentLocation, sendLocationToServer } from '../lib/utils';
import Pusher from 'pusher-js';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX!;

export const DriversLocation = () => {
    const mapRef = useRef(null);
    const [busLocation, setBusLocation] = useState({ latitude: 0, longitude: 0 });

    useEffect(() => {
        const updateBusLocation = async () => {
            try {
                const [longitude, latitude] = await getCurrentLocation();
                await sendLocationToServer(latitude, longitude);
            } catch (error) {
                console.error("Error updating bus location:", error);
            }
        };

        // Update bus location every 10 seconds
        const intervalId = setInterval(() => {
            updateBusLocation();
        }, 10000);

        return () => clearInterval(intervalId);
    }, []);

    useEffect(() => {
        // Pusher setup to receive bus location updates
        const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
            cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
        });

        // Subscribe to the channel
        const channel = pusher.subscribe('live-bus-channel');

        // Listen for bus-location-update event
        channel.bind('bus-location-update', (data: { latitude: number, longitude: number }) => {
            setBusLocation({ latitude: data.latitude, longitude: data.longitude });
        });

        return () => {
            pusher.unsubscribe('live-bus-channel');
        };
    }, []);

    return (
        <div>
            {busLocation.latitude && busLocation.longitude ? (
                <Map
                    initialViewState={{
                        latitude: busLocation.latitude,
                        longitude: busLocation.longitude,
                        zoom: 14,
                    }}
                    style={{ width: '100%', height: '700px' }}
                    mapStyle="mapbox://styles/mapbox/streets-v11"
                    ref={mapRef}
                    mapboxAccessToken={mapboxgl.accessToken}
                >
                    {/* Add a marker for the bus location */}
                    <Marker latitude={busLocation.latitude} longitude={busLocation.longitude}>
                        <div style={{ backgroundColor: 'red', width: '10px', height: '10px', borderRadius: '50%' }} />
                    </Marker>
                </Map>
            ) : (
                <div>Loading map...</div>
            )}
        </div>
    );
};
