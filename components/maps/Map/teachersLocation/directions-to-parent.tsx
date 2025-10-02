import { useEffect, useMemo, useRef, useState } from "react";
import { useMap, useMapsLibrary } from "@vis.gl/react-google-maps";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { studentETA, studentETASelector } from "@/atoms/eta";
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

const UPDATE_INTERVAL = 10000;
const MIN_MOVE_DISTANCE = 200; // meters

export function Directions({ parentAddressCoords, teacherData, userId }: AddressProps) {
    const map = useMap();
    const routesLibrary = useMapsLibrary("routes");
    const [directionsService, setDirectionsService] =
        useState<google.maps.DirectionsService>();
    const [directionsRenderer, setDirectionsRenderer] =
        useState<google.maps.DirectionsRenderer>();
    const [routes, setRoutes] = useState<google.maps.DirectionsRoute[]>([]);
    const [routesIndex, setRoutesIndex] = useState(0);

    const teacherMarkerRef = useRef<google.maps.Marker | null>(null);
    const homeMarkerRef = useRef<google.maps.Marker | null>(null);
    const lastCoordsRef = useRef<google.maps.LatLngLiteral | null>(null);
    const [eta, setEta] = useState<string | null>(null);
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
        if (!teacherData) return;
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
        return {
            url: "/images/home.png",
            scaledSize: new google.maps.Size(40, 40),
        };
    }, []);

    // init directions service + renderer
    useEffect(() => {
        if (!routesLibrary || !map) return;

        setDirectionsService(new routesLibrary.DirectionsService());
        setDirectionsRenderer(
            new routesLibrary.DirectionsRenderer({
                map,
                polylineOptions: {
                    strokeColor: "#3b82f6",
                    strokeWeight: 4,
                },
            })
        );
    }, [routesLibrary, map]);

    // place home marker once
    useEffect(() => {
        if (!map || !coords2) return;


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

    // poll teacher position and  update marker
    useEffect(() => {
        if (!map || !teacherData) return;

        // mark ETA as loading initially
        // setStudentETA((prev) => ({
        //     ...prev,
        //     [userId]: { value: null, status: "loading" },
        // }));

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
                        provideRouteAlternatives: true,
                    })
                    .then((response) => {
                        directionsRenderer.setDirections(response);
                        setRoutes(response.routes);

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

                        // fit map to bounds
                        const bounds = new google.maps.LatLngBounds();
                        response.routes[0].overview_path.forEach((pt) => bounds.extend(pt));
                        directionsRenderer.getMap()?.fitBounds(bounds);
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
        const interval = setInterval(updateMarker, UPDATE_INTERVAL);
        return () => clearInterval(interval);
    }, [map, teacherData, coords2, directionsService, directionsRenderer, teacherIcon, setStudentETA]);


    // handle switching between route options
    useEffect(() => {
        if (!directionsRenderer) return;
        directionsRenderer.setRouteIndex(routesIndex);
    }, [routesIndex, directionsRenderer]);

    if (!routes.length) return null;


    console.log(eta, "eta value")

    return (
        <div>
            <ul>
                {routes.map((route, index) => (
                    <li key={route.summary}>
                        <button onClick={() => setRoutesIndex(index)}>{route.summary}</button>
                    </li>
                ))}
            </ul>
        </div>
    );
}
