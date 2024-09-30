'use client';

import dynamic from 'next/dynamic';
import { Suspense, useRef } from 'react';
import L from 'leaflet';
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
// import { MapContainer, TileLayer } from 'react-leaflet'
import { useMap } from 'react-leaflet/hooks'

const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Map = dynamic(() => import('../Mapping').then(mod => mod.default), { ssr: false });
const MapContainer = dynamic(() => import("react-leaflet").then(mod => mod.MapContainer), { ssr: false });

const Location = () => {
    const mapRef = useRef(null);

    // Initialize Leaflet icon for the marker
    const greenIcon = new L.Icon({
        iconUrl: '/images/girlchild.png',
        iconSize: [30, 30],
        iconAnchor: [22, 94],
        popupAnchor: [-3, -76],
    });
    const DEFAULT_WIDTH = 600;
    const DEFAULT_HEIGHT = 400;

    return (
        <div>
            {/* Add a Suspense boundary around Map */}
            <MapContainer center={[51.505, -0.09]} zoom={13} scrollWheelZoom={false} style={{ aspectRatio: DEFAULT_WIDTH / DEFAULT_HEIGHT }}>
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution="&copy; <a href='http://osm.org/copyright'>OpenStreetMap</a> contributors"
                />
                <Marker position={[51.505, -0.09]} icon={greenIcon}>
                    <Popup>
                        A pretty CSS3 popup. <br /> Easily customizable.
                    </Popup>
                </Marker>
            </MapContainer>
        </div>
    );
};

export default Location;
