"use client";
import dynamic from 'next/dynamic';
import { Suspense, useEffect } from "react";
import Leaflet from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";

// Dynamic import to prevent SSR
const MapContainer = dynamic(() => import("react-leaflet").then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then(mod => mod.Marker), { ssr: false });

const Map = ({ children, className, width, height, ...rest }) => {

    return (
        <Suspense>
            <MapContainer {...rest} style={{ height: "450px", width: "100%" }} zoom={15}>
                {children}
            </MapContainer>
        </Suspense>
    );
};

export default Map;