"use client";

import React from "react";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";

const containerStyle = {
    width: "100%",
    height: "500px",
};

interface Props {
    latitude: number;
    longitude: number;
}


const GoogleMapView = ({ latitude, longitude }: Props) => {
    const center = { lat: latitude, lng: longitude };
    return (
        <LoadScript googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
            <GoogleMap
                mapContainerStyle={containerStyle}
                center={center}
                zoom={15}
            >
                <Marker position={center} />
            </GoogleMap>
        </LoadScript>
    )
}

export default GoogleMapView
