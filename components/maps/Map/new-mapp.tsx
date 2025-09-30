"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
    GoogleMap,
    Marker,
    DirectionsRenderer,
    useLoadScript,
    OverlayView,
} from "@react-google-maps/api";
import { getGoogleMapsRoute, googleFetchCoordinates } from "../lib/utils";
import type { Libraries } from "@react-google-maps/api";

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
    height: "90vh",
};

const DEFAULT_ZOOM = 12;
const UPDATE_INTERVAL = 10000;
const DEBOUNCE_DELAY = 500;

const libraries: Libraries = ["places"];

//coords
//COORDINATE_1 is TEACHER coordinate
//COORDINATE_2 is PARENT coordinate

//we need to figure out how to changr the teacher's route incase a diiferent teachsr is coming to pick up a different child
//so we need to consider a case where two different kids has different teahcers coming for pick up

const NewLocation = ({ parentAddress, teacherData }: AddressProps) => {
    const [coords1, setCoords1] = useState<google.maps.LatLngLiteral | null>(
        teacherData ? { lat: teacherData.latitude, lng: teacherData.longitude } : null
    );
    const [coords2, setCoords2] = useState<google.maps.LatLngLiteral | null>(null);
    const [eta, setEta] = useState<string | null>(null);
    const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
    const [teacherMarker, setTeacherMarker] = useState<google.maps.Marker | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [heading, setHeading] = useState<number>(0);

    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
        libraries,
    });

    //fetch the route from teachers location to parents
    const fetchRoute = useCallback(
        async (origin: google.maps.LatLngLiteral, destination: google.maps.LatLngLiteral) => {
            if (!isLoaded) return;

            try {
                const route = await getGoogleMapsRoute(origin, destination);

                if (route && route.routes && route.routes.length > 0) {
                    setDirections(route);
                    const duration = route.routes[0].legs[0].duration?.text || null;
                    setEta(duration);
                }
            } catch (err) {
                setError("Failed to fetch route directions");
                // console.error("Route fetching error:", err);
            } finally {
                setLoading(false);
            }
        },
        [isLoaded]
    );

    useEffect(() => {
        const fetchParentCoordinates = async () => {
            try {
                setLoading(true);
                //getting the parent coordainate 
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

    //we only fetch a new route when the parent address changes
    useEffect(() => {
        if (!coords1 || !coords2 || !isLoaded) return;

        if (isNaN(coords1.lat) || isNaN(coords1.lng) || isNaN(coords2.lat) || isNaN(coords2.lng)) {
            console.warn("Invalid c oordinates:", { coords1, coords2 });
            return;
        }

        fetchRoute(coords1, coords2);
    }, [coords2, isLoaded]);

    //we check the route every 5min, if teacher is on right route and if not we recalc
    useEffect(() => {
        if (!coords1 || !coords2) return

        const interval = setInterval(() => {
            fetchRoute(coords1, coords2)
        }, 5 * 60 * 1000)

        return () => clearInterval(interval)
    }, [coords1, coords2])


    function computeHeading(from: google.maps.LatLngLiteral, to: google.maps.LatLngLiteral): number {
        const lat1 = (from.lat * Math.PI) / 180;
        const lat2 = (to.lat * Math.PI) / 180;
        const dLng = ((to.lng - from.lng) * Math.PI) / 180;

        const y = Math.sin(dLng) * Math.cos(lat2);
        const x =
            Math.cos(lat1) * Math.sin(lat2) -
            Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

        return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
    }

    const animateMarker = (
        marker: google.maps.Marker,
        toPosition: google.maps.LatLngLiteral,
        duration = 1000
    ) => {
        if (!marker) return;
        const fromPosition = marker.getPosition();
        if (!fromPosition) return;

        const startLat = fromPosition.lat();
        const startLng = fromPosition.lng();
        const deltaLat = toPosition.lat - startLat;
        const deltaLng = toPosition.lng - startLng;

        const startTime = performance.now();
        const newHeading = computeHeading({ lat: startLat, lng: startLng }, toPosition);
        setHeading(newHeading);

        const easeInOutQuad = (t: number) =>
            t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

        const move = (time: number) => {
            const elapsed = time - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easedProgress = easeInOutQuad(progress);

            const lat = startLat + deltaLat * easedProgress;
            const lng = startLng + deltaLng * easedProgress;

            marker.setPosition(new google.maps.LatLng(lat, lng));

            if (progress < 1) {
                requestAnimationFrame(move);
            }
        };

        requestAnimationFrame(move);
    };

    const openInGoogleMaps = () => {
        if (!coords1 || !coords2) return;
        const url = `https://www.google.com/maps/dir/?api=1&origin=${coords1.lat},${coords1.lng}&destination=${coords2.lat},${coords2.lng}&travelmode=driving`;

        window.open(url, "_blank");
    }

    //we animate the teacher marker
    useEffect(() => {
        if (!teacherData) return;

        const interval = setInterval(() => {
            const newPosition = { lat: teacherData.latitude, lng: teacherData.longitude };

            if (teacherMarker) {
                animateMarker(teacherMarker, newPosition);
            } else {
                setCoords1(newPosition);
            }
        }, UPDATE_INTERVAL);

        return () => clearInterval(interval);
    }, [teacherData, teacherMarker]);

    // Icons
    const homeIcon = useMemo(() => {
        if (!isLoaded) return undefined;
        return {
            url: "/images/home.png",
            scaledSize: new window.google.maps.Size(30, 30),
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

    if (!isLoaded) return <div>Loading Google Maps...</div>;
    if (loadError) return <div>Error loading maps</div>;

    return (
        <div className="">
            <div className="flex justify-between items-center p-2 bg-gray-50 rounded-t-xl">
                {eta && (
                    <p className="font-medium text-blue-600">
                        ETA <span className="text-blue-600">{eta}</span>
                    </p>
                )}
                <button
                    onClick={openInGoogleMaps}
                    className="px-4 py-2 text-sm md:text-lg bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                    View in Google Maps
                </button>
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
                {/* Teacher marker (animated) */}
                {/* <Marker
                    position={coords1}
                    onLoad={(marker) => setTeacherMarker(marker)}
                    icon={busIcon}
                /> */}
                {coords1 && (
                    <OverlayView
                        position={coords1}
                        mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                    >
                        <div
                            style={{
                                transform: `rotate(${heading}deg)`,
                                transformOrigin: "center",
                                width: "30px",
                                height: "30px",
                            }}
                        >
                            <img src="/images/bus.svg" width={40} height={40} alt="bus" />
                        </div>
                    </OverlayView>
                )}
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
