import { APIProvider, Map, useMapsLibrary, useMap } from '@vis.gl/react-google-maps';
import { useEffect, useMemo, useState } from 'react';
import { googleFetchCoordinates } from '../../lib/utils';
type TeacherLocation = {
    teacherId: string;
    teacherName: string;
    teacherImage: string;
    latitude: number;
    longitude: number;
};

type AddressProps = {
    parentAddress: string;
    teacherData: TeacherLocation | undefined;
};

export function Directions({ parentAddress, teacherData }: AddressProps) {
    const map = useMap()
    const routesLibrary = useMapsLibrary("routes")
    const [directionsService, setDirectionsService] = useState<google.maps.DirectionsService>();
    const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer>();
    const [routes, setRoutes] = useState<google.maps.DirectionsRoute[]>([]);
    const [routesIndex, setRoutesIndex] = useState(0);
    const selected = routes[routesIndex];
    const leg = selected?.legs[0]
    const [loading, setLoading] = useState(true);
    const [coords2, setCoords2] = useState<google.maps.LatLngLiteral | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [teacherLocation, setTeacherLocation] = useState<TeacherLocation | null>(null);

    const [coords1, setCoords1] = useState<google.maps.LatLngLiteral | null>(
        teacherData ? { lat: teacherData.latitude, lng: teacherData.longitude } : null
    );

    const teacherIcon = useMemo(() => {
        if (!routesLibrary || !map) return;
        return {
            url: teacherData?.teacherImage,
            style: { borderRadius: "50%" },
            scaledSize: new window.google.maps.Size(40, 40),
        };
    }, [map, teacherData]);

    const homeIcon = useMemo(() => {
        if (!routesLibrary || !map) return;
        return {
            url: "/images/home.png",
            scaledSize: new window.google.maps.Size(40, 40),
        };
    }, [map]);

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


    useEffect(() => {
        if (!routesLibrary || !map) return;
        setDirectionsService(new routesLibrary.DirectionsService());
        setDirectionsRenderer(new routesLibrary.DirectionsRenderer({
            map: map,
            // suppressMarkers: true,
            polylineOptions: {
                strokeColor: '#3b82f6',
                strokeWeight: 4,
            },
        }));

    }, [routesLibrary, map])

    useEffect(() => {
        if (!directionsService || !directionsRenderer) return;

        const origin = new google.maps.LatLng(6.5244, 3.3792);
        const destination = new google.maps.LatLng(6.5244, 3.3792);


        directionsService.route({
            origin: "military pension board, fo1 kubwa",
            destination: "NAF Base, Abuja",
            travelMode: google.maps.TravelMode.DRIVING,

        }).then((response) => {
            directionsRenderer.setDirections(response);
            setRoutes(response.routes);

        });
    }, [directionsService, directionsRenderer]);

    useEffect(() => {
        if (!map || !teacherData) return;

        let teacherMarker: google.maps.Marker | null = null;
        let homeMarker: google.maps.Marker | null = null;

        (async () => {
            const { Marker } = (await google.maps.importLibrary("marker")) as google.maps.MarkerLibrary;

            teacherMarker = new Marker({
                position: { lat: teacherData.latitude, lng: teacherData.longitude },
                map,
                icon: teacherIcon,
                title: teacherData.teacherName,
            });

            homeMarker = new Marker({
                position: { lat: 6.5244, lng: 3.3792 }, 
                map,
                icon: homeIcon,
                title: "Home",
            });
        })();

        return () => {
            teacherMarker?.setMap(null);
            homeMarker?.setMap(null);
        };
    }, [map, teacherData, teacherIcon, homeIcon]);


    useEffect(() => {
        if (!directionsRenderer) return
        directionsRenderer.setRouteIndex(routesIndex)

    }, [routes, directionsRenderer])


    if (!leg) return null

    return <div>
        <h2>{selected?.summary}</h2>
        <p>{leg?.start_address.split("")[0]} to {leg?.end_address.split(",")[0]}</p>

        <p>Distance: {leg?.distance?.text}</p>
        <p>Duration: {leg?.duration?.text}</p>



        <h2>Other Routes</h2>
        <ul>
            {
                routes.map((route, index) => <li key={route.summary}>
                    <button onClick={() => setRoutesIndex(index)}>
                        {
                            route.summary
                        }
                    </button>
                </li>)
            }
        </ul>
    </div>

}
