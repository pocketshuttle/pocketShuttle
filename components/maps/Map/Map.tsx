'use client';

import dynamic from 'next/dynamic';
import { Suspense, useEffect, useState } from 'react';
import { useMap } from 'react-leaflet';
import axios from 'axios';  // Import axios for API requests
import L from 'leaflet';
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import 'leaflet-routing-machine';

const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });

const RoutingControl = ({ address1, address2 }) => {
    const map = useMap();
    const [waypoints, setWaypoints] = useState([]);
    const [coords1, setCoords1] = useState(null);
    const [coords2, setCoords2] = useState(null);

    const greenIcon = new L.Icon({
        iconUrl: '/images/sbus.png',
        iconSize: [50, 50],
        iconAnchor: [25, 50],
        popupAnchor: [0, -50],
    });

    useEffect(() => {
        const fetchCoordinates = async (address) => {
            try {
                const response = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${address}`);
                if (response.data && response.data.length > 0) {
                    const { lat, lon } = response.data[0];
                    return [parseFloat(lat), parseFloat(lon)];
                }
                return null;
            } catch (error) {
                console.error('Geocoding error:', error);
                return null;
            }
        };

        const setupRouting = async () => {
            const coordinates1 = await fetchCoordinates(address1);
            const coordinates2 = await fetchCoordinates(address2);

            if (coordinates1 && coordinates2) {
                setCoords1(coordinates1);  // Store the first coordinates
                setCoords2(coordinates2);  // Store the second coordinates
                setWaypoints([L.latLng(coordinates1), L.latLng(coordinates2)]);

                // Initialize routing control with waypoints
                L.Routing.control({
                    waypoints: [
                        L.latLng(coordinates1),
                        L.latLng(coordinates2)
                    ],
                }).addTo(map);
            }
        };

        setupRouting();
    }, [map, address1, address2]);

    // Add markers for the two addresses
    useEffect(() => {
        if (coords1) {
            L.marker(coords1, { icon: greenIcon }).addTo(map)
                .bindPopup(`${address1}`);
        }
        if (coords2) {
            L.marker(coords2, { icon: greenIcon }).addTo(map)
                .bindPopup(`${address2}`);
        }
    }, [coords1, coords2, map, address1, address2, greenIcon]);

    return null;
};

const Location = () => {
    const DEFAULT_WIDTH = 600;
    const DEFAULT_HEIGHT = 400;

    const address1 = "Abuja, NG";    // First address
    const address2 = "Lagos, NG"; // Second address

    return (
        <div>
            <Suspense fallback={<div>Loading map...</div>}>
                <MapContainer center={[51.505, -0.09]} zoom={13} scrollWheelZoom={false} style={{ aspectRatio: DEFAULT_WIDTH / DEFAULT_HEIGHT }}>
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution="&copy; <a href='http://osm.org/copyright'>OpenStreetMap</a> contributors"
                    />
                    {/* Pass addresses to RoutingControl */}
                    <RoutingControl address1={address1} address2={address2} />
                </MapContainer>
            </Suspense>
        </div>
    );
};

export default Location;
