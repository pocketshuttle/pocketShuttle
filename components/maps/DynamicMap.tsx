"use client";
import dynamic from 'next/dynamic';
import { useEffect } from "react";
import Leaflet from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";

// Dynamic import to prevent SSR
const MapContainer = dynamic(() => import("react-leaflet").then(mod => mod.MapContainer), { ssr: false });

const Map = ({ children, className, width, height, ...rest }) => {
    useEffect(() => {
        if (typeof window !== 'undefined' && Leaflet) {
            // Set up Leaflet default icon paths
            Leaflet.Icon.Default.mergeOptions({
                iconRetinaUrl: '/images/girlchild.png', // Retina icon if needed
                iconUrl: '/images/girlchild.png',       // Default icon
                shadowUrl: '/images/marker-shadow.png', // Shadow icon
            });
        }
    }, []);

    return (
        <MapContainer 
            {...rest} 
            style={{ height: height || "450px", width: width || "100%" }} 
            zoom={15} 
            className={className}
        >
            {children}
        </MapContainer>
    );
};

export default Map;
