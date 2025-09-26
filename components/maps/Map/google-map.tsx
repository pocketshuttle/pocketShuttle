"use client";

import React, { useRef } from "react";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";

const containerStyle = {
    width: "100%",
    height: "700px",

};

interface Props {
    latitude: number;
    longitude: number;
    teachersLocation: any
}


const GoogleMapView = ({ latitude, longitude, teachersLocation }: Props) => {
    const mapRef = useRef<google.maps.Map | null>(null);
    const onLoad = (map: google.maps.Map) => {
        mapRef.current = map;
    };
    

    const handleMarkerClick = (lat: number, lng: number) => {
        if (mapRef.current) {
            mapRef.current.panTo({ lat, lng });
            mapRef.current.setZoom(18);
        } else {
            console.warn("Map not loaded yet.");
        }
    };

    const center = { lat: latitude, lng: longitude };
    return (
        // <LoadScript googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
        <GoogleMap
            mapContainerStyle={containerStyle}
            center={center}
            zoom={15}
            options={{
                fullscreenControl: false,
                zoomControl: false
            }}
            onLoad={onLoad}

        >
            <Marker position={center} />
            {teachersLocation.map((teacher: any) => (
                <Marker
                    key={teacher.teacherId}
                    position={{
                        lat: teacher.newLocation.lattitude,
                        lng: teacher.newLocation.longitude,
                    }}
                    title={teacher.teacherName}
                    icon={{
                        url: teacher.teacherImage,
                        scaledSize: new window.google.maps.Size(40, 40),
                    }}
                    onClick={() => handleMarkerClick(teacher.latitude, teacher.longitude)}
                />
            ))}
        </GoogleMap>
        // </LoadScript>
    )
}

export default GoogleMapView
