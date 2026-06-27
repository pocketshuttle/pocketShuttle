'use client';

import dynamic from 'next/dynamic';
import { Dispatch, SetStateAction, Suspense, useEffect, useState } from 'react';
import { useMap } from 'react-leaflet';
import axios from 'axios';  // For API requests to OpenStreetMap's Nominatim API
import L from 'leaflet';
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import 'leaflet-routing-machine';
import { getCurrentLocation } from '../lib/utils';

// Dynamically importing leaflet components to ensure they work with SSR in Next.js
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });

type RoutingControlProps = {
    address2: string;
    eta: string | null
    setEta: Dispatch<SetStateAction<string | null>>
};

const RoutingControl = ({ address2, eta, setEta }: RoutingControlProps) => {
    const map = useMap();
    const [coords1, setCoords1] = useState<[number, number] | null>(null); // User's current location
    const [coords2, setCoords2] = useState<[number, number] | null>(null); // Destination coordinates

    // Custom icon for markers
    const greenIcon = new L.Icon({
        iconUrl: '/images/sbus.png', // Replace with your custom bus image
        iconSize: [50, 50],
        iconAnchor: [25, 50],
        popupAnchor: [0, -50],
    });



    // Function to fetch coordinates of a given address
    const fetchCoordinates = async (address: string) => {
        try {
            const response = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${address}`);
            if (response.data && response.data.length > 0) {
                const { lat, lon } = response.data[0];
                return [parseFloat(lat), parseFloat(lon)];  // Returns [latitude, longitude]
            }
            return null;
        } catch (error) {
            console.error('Geocoding error:', error);
            return null;
        }
    };

    useEffect(() => {
        const setupRouting = async () => {
            const coordinates1 = await getCurrentLocation();  // User's current coordinates
            const coordinates2 = await fetchCoordinates(address2);  // Destination coordinates

            if (coordinates1 && coordinates2) {
                setCoords1(coordinates1);  // Set current location
                //@ts-ignore
                setCoords2(coordinates2);  // @ts

                // Initialize the routing control with waypoints
                L.Routing.control({
                    waypoints: [
                        L.latLng(coordinates1),  // Starting point
                        //@ts-ignore
                        L.latLng(coordinates2),  // Destination
                    ],
                }).on("routesfound", (e) => {
                    const routes = e.routes[0];
                    const totalTimeInSeconds = routes.summary.totalTime;  // Get total time in seconds
                    const timeInMinutes = Math.floor(totalTimeInSeconds / 60);  // Convert to minutes
                    const timeInSeconds = Math.floor(totalTimeInSeconds % 60);  // Remaining seconds

                    setEta(`${timeInMinutes} minutes and ${timeInSeconds} seconds`);  // Save ETA for display
                }).addTo(map);
            }
        };

        setupRouting();
    }, [map, address2]);

    // Add markers for the two locations
    useEffect(() => {
        if (coords1) {
            L.marker(coords1, { icon: greenIcon }).addTo(map)
                .bindPopup('Current location');
        }
        if (coords2) {
            L.marker(coords2, { icon: greenIcon }).addTo(map)
                .bindPopup(`Destination: ${address2}`);
        }
    }, [coords1, coords2, map, address2, greenIcon]);

    return (
        <div>
            {eta && <p>Estimated Time of Arrival: {eta}</p>}
        </div>
    );
};

//@ts-ignore
const Location = ({ address }) => {
    const DEFAULT_WIDTH = 600;
    const DEFAULT_HEIGHT = 600;
    const [eta, setEta] = useState<string | null>(null);


    return (
        <div>
            <Suspense fallback={<div>Loading map...</div>}>
                <MapContainer center={[51.505, -0.09]} zoom={13} scrollWheelZoom={false} style={{ aspectRatio: DEFAULT_WIDTH / DEFAULT_HEIGHT }}>
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution="&copy; <a href='http://osm.org/copyright'>OpenStreetMap</a> contributors"
                    />
                    <RoutingControl address2={address} eta={eta} setEta={setEta} />
                </MapContainer>
            </Suspense>
        </div>
    );
};

export default Location;
