import { useEffect, useMemo, useRef, useState } from "react";
import { useMap, useMapsLibrary } from "@vis.gl/react-google-maps";
import { useSetRecoilState } from "recoil";
import { studentETA } from "@/atoms/eta";
type TeacherLocation = {
    teacherId: string;
    teacherName: string;
    teacherImage: string;
    latitude: number;
    longitude: number;
};

type AddressProps = {
    parentAddressCoords: { latitude: number; longitude: number };
    teacherData: TeacherLocation | undefined;
    userId: string
};

const MIN_MOVE_DISTANCE = 200; // meters

export function Directions({ parentAddressCoords, teacherData, userId }: AddressProps) {
    const map = useMap();
    const routesLibrary = useMapsLibrary("routes");
    const [directionsService, setDirectionsService] =
        useState<google.maps.DirectionsService>();
    const [directionsRenderer, setDirectionsRenderer] =
        useState<google.maps.DirectionsRenderer>();
    const teacherMarkerRef = useRef<google.maps.Marker | null>(null);
    const homeMarkerRef = useRef<google.maps.Marker | null>(null);
    const lastCoordsRef = useRef<google.maps.LatLngLiteral | null>(null);
    const hasFitBoundsRef = useRef(false);
    const setStudentETA = useSetRecoilState(studentETA);




    const coords2 = useMemo<google.maps.LatLngLiteral | null>(
        () =>
            parentAddressCoords
                ? {
                    lat: parentAddressCoords.latitude,
                    lng: parentAddressCoords.longitude,
                }
                : null,
        [parentAddressCoords]
    );

    // teacher icon with circular image
    const teacherIcon = useMemo(() => {
        if (!teacherData || typeof google === "undefined") return;
        const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40">
        <defs>
          <clipPath id="circleView">
            <circle cx="20" cy="20" r="20" />
          </clipPath>
        </defs>
        <image href="${teacherData.teacherImage}" width="40" height="40" clip-path="url(#circleView)" />
      </svg>`;
        return {
            url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg),
            scaledSize: new google.maps.Size(40, 40),
        };
    }, [teacherData]);

    const homeIcon = useMemo(() => {
        if (typeof google === "undefined") return;
        return {
            url: "/images/home.png",
            scaledSize: new google.maps.Size(40, 40),
        };
    }, []);

    // init directions service + renderer
    useEffect(() => {
        if (!routesLibrary || !map) return;

        const service = new routesLibrary.DirectionsService();
        const renderer = new routesLibrary.DirectionsRenderer({
            map,
            suppressMarkers: true,
            polylineOptions: {
                strokeColor: "#3b82f6",
                strokeWeight: 4,
            },
        });

        setDirectionsService(service);
        setDirectionsRenderer(renderer);

        return () => {
            renderer.setMap(null);
        };
    }, [routesLibrary, map]);

    // place home marker once
    useEffect(() => {
        if (!map || !coords2 || !homeIcon) return;

        (async () => {
            const { Marker } = (await google.maps.importLibrary(
                "marker"
            )) as google.maps.MarkerLibrary;

            if (homeMarkerRef.current) homeMarkerRef.current.setMap(null);

            homeMarkerRef.current = new Marker({
                position: coords2,
                map,
                icon: homeIcon,
                title: "Home",
            });
        })();

        return () => {
            homeMarkerRef.current?.setMap(null);
        };
    }, [map, coords2, homeIcon]);

    // Update markers/routes only when a fresh teacher location arrives.
    useEffect(() => {
        if (!map || !teacherData) return;

        const updateMarker = async () => {
            const coords1 = { lat: teacherData.latitude, lng: teacherData.longitude };

            // Always update teacher marker
            if (!teacherMarkerRef.current) {
                const { Marker } = (await google.maps.importLibrary(
                    "marker"
                )) as google.maps.MarkerLibrary;

                teacherMarkerRef.current = new Marker({
                    position: coords1,
                    map,
                    icon: teacherIcon,
                    title: teacherData.teacherName,
                });
            } else {
                teacherMarkerRef.current.setPosition(coords1);
            }

            // Only recalc route if teacher moved significantly
            const hasMovedEnough =
                !lastCoordsRef.current ||
                google.maps.geometry.spherical.computeDistanceBetween(
                    new google.maps.LatLng(lastCoordsRef.current.lat, lastCoordsRef.current.lng),
                    new google.maps.LatLng(coords1.lat, coords1.lng)
                ) > MIN_MOVE_DISTANCE;

            if (
                directionsService &&
                directionsRenderer &&
                coords2 &&
                hasMovedEnough
            ) {
                lastCoordsRef.current = coords1;

                directionsService
                    .route({
                        origin: coords1,
                        destination: coords2,
                        travelMode: google.maps.TravelMode.DRIVING,
                        provideRouteAlternatives: false,
                    })
                    .then((response) => {
                        directionsRenderer.setDirections(response);

                        const duration = response.routes[0]?.legs[0]?.duration?.value;
                        const minutes = duration ? Math.round(duration / 60) : null;

                        if (minutes !== null) {
                            // setEta(`${minutes} mins`);
                            setStudentETA((prev) => ({
                                ...prev,
                                [userId]: {
                                    value: minutes,
                                    status: "success"
                                },
                            }));
                        } else {
                            // Keep the previous value if the new one is null
                            setStudentETA((prev) => ({
                                ...prev,
                                [userId]: {
                                    value: prev[userId]?.value ?? null,
                                    status: prev[userId]?.value !== null ? "success" : "error"
                                },
                            }));
                        }

                        if (!hasFitBoundsRef.current) {
                            const bounds = new google.maps.LatLngBounds();
                            response.routes[0].overview_path.forEach((pt) => bounds.extend(pt));
                            directionsRenderer.getMap()?.fitBounds(bounds);
                            hasFitBoundsRef.current = true;
                        }
                    })
                    .catch(() => {
                        // gracefully handle Directions API errors
                        setStudentETA((prev) => ({
                            ...prev,
                            [userId]: { value: prev[userId]?.value ?? null, status: "error" },
                        }));
                    });
            }
        };


        updateMarker();
    }, [map, teacherData, coords2, directionsService, directionsRenderer, teacherIcon, setStudentETA]);

    return null;
}
