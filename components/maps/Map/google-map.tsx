"use client";

import React, { useEffect, useRef } from "react";
import { GoogleMap, Marker } from "@react-google-maps/api";

const containerStyle = {
  width: "100%",
  height: "700px",
};

interface Props {
  latitude: number;
  longitude: number;
  teachersLocation: any[];
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
    }
  };

  // Auto-fit to all markers
  useEffect(() => {
    if (!mapRef.current || teachersLocation.length === 0) return;

    const bounds = new window.google.maps.LatLngBounds();

    teachersLocation.forEach((teacher) => {
      if (teacher.latitude && teacher.longitude) {
        bounds.extend({ lat: teacher.latitude, lng: teacher.longitude });
      }
    });

    // Also include the "school center" coords you passed
    bounds.extend({ lat: latitude, lng: longitude });

    mapRef.current.fitBounds(bounds);
  }, [teachersLocation, latitude, longitude]);

  const center = { lat: latitude, lng: longitude };

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={15}
      options={{
        fullscreenControl: false,
        zoomControl: true,
      }}
      onLoad={onLoad}
    >
      {/* School marker (center) */}
      <Marker position={center} />

      {/* Teachers markers */}
      {teachersLocation.map((teacher: any) => (
        <Marker
          key={teacher.teacherId}
          position={{
            lat: teacher.latitude,
            lng: teacher.longitude,
          }}
          title={teacher.teacherName}
          icon={{
            url: teacher.teacherImage,
            scaledSize: new window.google.maps.Size(40, 40),
          }}
          onClick={() =>
            handleMarkerClick(teacher.latitude, teacher.longitude)
          }
        />
      ))}
    </GoogleMap>
  );
};

export default GoogleMapView;
