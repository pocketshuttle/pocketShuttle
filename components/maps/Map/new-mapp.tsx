"use client";

import React, { useEffect, useState, useCallback } from "react";
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
const UPDATE_INTERVAL = 10000; // 10 seconds
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
        libraries
    });

    // Memoized fetch function
    const fetchRoute = useCallback(async (origin: google.maps.LatLngLiteral, destination: google.maps.LatLngLiteral) => {

        console.log("Fetching route from:", origin, "to:", destination);
        try {
            const route = await getGoogleMapsRoute(origin, destination);

            console.log("Route data:", route);
            if (route) {
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
    }, [setStudentEta]);

    // Fetch parent coordinates
    useEffect(() => {
        const fetchParentCoordinates = async () => {
            try {
                setLoading(true);
                const coordinates = await googleFetchCoordinates(parentAddress);
                if (coordinates) {
                    setCoords2(coordinates);
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

    // Update route when coordinates change
    useEffect(() => {
        if (!coords1 || !coords2) return;

        const debounceTimer = setTimeout(() => {
            fetchRoute(coords1, coords2);
        }, DEBOUNCE_DELAY);

        return () => clearTimeout(debounceTimer);
    }, [coords1, coords2, fetchRoute]);

    // Update teacher location periodically
    useEffect(() => {
        if (!teacherData) return;

        const interval = setInterval(() => {
            setCoords1({ lat: teacherData.latitude, lng: teacherData.longitude });
        }, UPDATE_INTERVAL);

        return () => clearInterval(interval);
    }, [teacherData]);

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

    if (!isLoaded) return <div>Loading Google Maps...</div>;
    if (loadError) return <div>Error loading maps</div>;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                {eta && (
                    <div className="font-medium">
                        Estimated Time: <span className="text-blue-600">{eta}</span>
                    </div>
                )}
                <button
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                    onClick={() => setOpenDirection(!openDirection)}
                >
                    {openDirection ? "Hide Directions" : "Show Directions"}
                </button>
            </div>

            <LoadScript
                googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}
                loadingElement={<div className="h-96 bg-gray-100 rounded" />}
            >
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
                    <Marker
                        position={coords1}
                        icon={{
                            url: teacherData?.teacherImage,
                            scaledSize: new google.maps.Size(40, 40),
                        }}
                    />
                    <Marker
                        position={coords2}
                        icon={{
                            url: "/images/home.png",
                            scaledSize: new google.maps.Size(40, 40),
                        }}
                    />
                    {directions && (
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
            </LoadScript>

            {openDirection && directions && (
                <div className="p-4 bg-gray-50 rounded">
                    <h3 className="font-bold mb-2">Step-by-Step Directions:</h3>
                    <ol className="space-y-2 list-decimal list-inside">
                        {directions.routes[0].legs[0].steps.map((step, index) => (
                            <li
                                key={index}
                                className="text-sm"
                                dangerouslySetInnerHTML={{ __html: step.instructions }}
                            />
                        ))}
                    </ol>
                </div>
            )}
        </div>
    );
};

export default NewLocation;