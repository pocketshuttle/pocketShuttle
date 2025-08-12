"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
    GoogleMap,
    LoadScript,
    Marker,
    DirectionsRenderer,
    useLoadScript,
} from "@react-google-maps/api";
import { useRecoilState } from "recoil";
import { studentETA } from "@/atoms/eta";
import { getGoogleMapsRoute, googleFetchCoordinates } from "../lib/utils";
import type { Libraries } from '@react-google-maps/api';

type AddressProps = {
    parentAddress: string;
    teacherData: TeacherLocation | undefined;
};

type TeacherLocation = {
    teacherId: string;
    teacherName: string;
    teacherImage: string;
    latitude: number;
    longitude: number;
};

const containerStyle = {
    width: "100%",
    height: "400px",
};

const DEFAULT_ZOOM = 12;
const UPDATE_INTERVAL = 10000;
const DEBOUNCE_DELAY = 500;

const libraries: Libraries = ['places'];

const NewLocation = ({ parentAddress, teacherData }: AddressProps) => {
    const [coords1, setCoords1] = useState<google.maps.LatLngLiteral | null>(
        teacherData ? { lat: teacherData.latitude, lng: teacherData.longitude } : null
    );
    const [coords2, setCoords2] = useState<google.maps.LatLngLiteral | null>(null);
    const [eta, setEta] = useState<string | null>(null);
    const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
    const [openDirection, setOpenDirection] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [studentEta, setStudentEta] = useRecoilState<number | null>(studentETA);


    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
        libraries,
    });

    const fetchRoute = useCallback(async (origin: google.maps.LatLngLiteral, destination: google.maps.LatLngLiteral) => {
        if (!isLoaded) return;

        try {
            const route = await getGoogleMapsRoute(origin, destination);
            console.log("Fetched route:", route);

            if (route && route.routes && route.routes.length > 0) {
                setDirections(route);
                const duration = route.routes[0].legs[0].duration?.text || null;

                const durationValue = route.routes[0].legs[0].duration?.value || null;
                setEta(duration);
                if (durationValue) {
                    setStudentEta(Math.floor(durationValue / 60));
                }
            }
        } catch (err) {
            setError("Failed to fetch route directions");
            console.error("Route fetching error:", err);
        } finally {
            setLoading(false);
        }
    }, [isLoaded, setStudentEta]);

    useEffect(() => {
        const fetchParentCoordinates = async () => {
            try {
                setLoading(true);
                const coordinates = await googleFetchCoordinates(parentAddress);

                if (coordinates) {
                    setCoords2({ lat: coordinates[0], lng: coordinates[1] });
                }
            } catch (err) {
                setError("Could not geocode parent address");
                console.error("Geocoding error:", err);
            }
        };

        if (parentAddress) {
            fetchParentCoordinates();
        }
    }, [parentAddress]);

    console.log("coords:", directions);
    console.log("isLoaded:", isLoaded, "coords1:", coords1, "coords2:", coords2);


    useEffect(() => {
        if (!coords1 || !coords2 || !isLoaded) return;

        // Validate coordinates
        if (isNaN(coords1.lat) || isNaN(coords1.lng) || isNaN(coords2.lat) || isNaN(coords2.lng)) {
            console.warn("Invalid coordinates:", { coords1, coords2 });
            return;
        }

        const debounceTimer = setTimeout(() => {
            fetchRoute(coords1, coords2);
        }, DEBOUNCE_DELAY);

        return () => clearTimeout(debounceTimer);
    }, [coords1, coords2, fetchRoute, isLoaded]);

    useEffect(() => {
        if (!teacherData) return;
        const interval = setInterval(() => {
            setCoords1({ lat: teacherData.latitude, lng: teacherData.longitude });
        }, UPDATE_INTERVAL);

        return () => clearInterval(interval);
    }, [teacherData]);

    const teacherIcon = useMemo(() => {
        if (!isLoaded || !teacherData) return undefined;
        return {
            url: teacherData.teacherImage,
            style: { borderRadius: "50%" },
            scaledSize: new window.google.maps.Size(40, 40),
        };
    }, [isLoaded, teacherData]);

    const homeIcon = useMemo(() => {
        if (!isLoaded) return undefined;
        return {
            url: "/images/home.png",
            scaledSize: new window.google.maps.Size(40, 40),
        };
    }, [isLoaded]);

    if (error) {
        return (
            <div className="p-4 bg-red-100 text-red-700 rounded">
                Error: {error}. Please try again later.
            </div>
        );
    }

    if (loading || !coords1 || !coords2) {
        return (
            <div className="flex items-center justify-center h-96">
                <div>Loading map data...</div>
            </div>
        );
    }

    console.log("coords1:", coords1, "coords2:", coords2, "directions:", directions);

    if (!isLoaded) return <div>Loading Google Maps...</div>;
    if (loadError) return <div>Error loading maps</div>;


    // console.log("directions:", directions);
    return (
        <div className="space-y-4">
            <div className="flex items-center p-2 bg-gray-50 rounded">
                {eta && (
                    <div className="font-medium">
                        Estimated Time: <span className="text-blue-600">{eta}</span>
                    </div>
                )}
            </div>

            <GoogleMap
                mapContainerStyle={containerStyle}
                center={coords1}
                zoom={DEFAULT_ZOOM}
                options={{
                    streetViewControl: false,
                    mapTypeControl: false,
                    fullscreenControl: false,
                }}
            >
                <Marker position={coords1} icon={teacherIcon} />
                <Marker position={coords2} icon={homeIcon} />
                {directions && directions.routes && directions.routes.length > 0 && (
                    <DirectionsRenderer
                        directions={directions}
                        options={{
                            suppressMarkers: true,
                            polylineOptions: {
                                strokeColor: "#3b82f6",
                                strokeWeight: 5,
                            },
                        }}
                    />
                )}
            </GoogleMap>
        </div>
    );
};

export default NewLocation;
