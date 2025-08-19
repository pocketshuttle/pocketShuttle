import { useEffect, useMemo, useState } from 'react';
import { useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
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

const UPDATE_INTERVAL = 10000;

export function Directions({ parentAddress, teacherData }: AddressProps) {
    const map = useMap();
    const routesLibrary = useMapsLibrary('routes');

    const [directionsService, setDirectionsService] = useState<google.maps.DirectionsService>();
    const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer>();
    const [routes, setRoutes] = useState<google.maps.DirectionsRoute[]>([]);
    const [routesIndex, setRoutesIndex] = useState(0);

    const selected = routes[routesIndex];
    const leg = selected?.legs[0];

    const [coords1, setCoords1] = useState<google.maps.LatLngLiteral | null>(
        teacherData ? { lat: teacherData.latitude, lng: teacherData.longitude } : null
    );
    const [coords2, setCoords2] = useState<google.maps.LatLngLiteral | null>(null);

    // Icons
    const teacherIcon = useMemo(() => {
        if (!map || !teacherData) return;
        return {
            url: teacherData.teacherImage,
            scaledSize: new window.google.maps.Size(40, 40),
        };
    }, [map, teacherData]);

    const homeIcon = useMemo(() => {
        if (!map) return;
        return {
            url: '/images/home.png',
            scaledSize: new window.google.maps.Size(40, 40),
        };
    }, [map]);

    // Poll teacher coords
    useEffect(() => {
        if (!teacherData) return;
        const interval = setInterval(() => {
            setCoords1({ lat: teacherData.latitude, lng: teacherData.longitude });
        }, UPDATE_INTERVAL);
        return () => clearInterval(interval);
    }, [teacherData]);

    // Geocode parent address → coords2
    useEffect(() => {
        const fetchParentCoordinates = async () => {
            if (!parentAddress) return;
            try {
                const coordinates = await googleFetchCoordinates(parentAddress);
                if (coordinates) {
                    setCoords2({ lat: coordinates[0], lng: coordinates[1] });
                }
            } catch (err) {
                console.error('Geocoding error:', err);
            }
        };
        fetchParentCoordinates();
    }, [parentAddress]);

    // Init directions service/renderer
    useEffect(() => {
        if (!routesLibrary || !map) return;
        setDirectionsService(new routesLibrary.DirectionsService());
        setDirectionsRenderer(
            new routesLibrary.DirectionsRenderer({
                map,
                polylineOptions: {
                    strokeColor: '#3b82f6',
                    strokeWeight: 4,
                },
            })
        );
    }, [routesLibrary, map]);

    // Recalculate route whenever coords change
    useEffect(() => {
        if (!directionsService || !directionsRenderer || !coords1 || !coords2) return;
        directionsService
            .route({
                origin: coords1,
                destination: coords2,
                travelMode: google.maps.TravelMode.DRIVING,
            })
            .then((response) => {
                directionsRenderer.setDirections(response);
                setRoutes(response.routes);
            });
    }, [directionsService, directionsRenderer, coords1, coords2]);

    // Render teacher + home markers (update on coords change)
    useEffect(() => {
        if (!map || !coords1 || !coords2) return;

        let teacherMarker: google.maps.Marker | null = null;
        let homeMarker: google.maps.Marker | null = null;

        (async () => {
            const { Marker } = (await google.maps.importLibrary('marker')) as google.maps.MarkerLibrary;

            teacherMarker = new Marker({
                position: coords1,
                map,
                icon: teacherIcon,
                title: teacherData?.teacherName,
            });

            homeMarker = new Marker({
                position: coords2,
                map,
                icon: homeIcon,
                title: 'Home',
            });
        })();

        return () => {
            teacherMarker?.setMap(null);
            homeMarker?.setMap(null);
        };
    }, [map, coords1, coords2, teacherIcon, homeIcon, teacherData]);

    // Allow selecting other routes
    useEffect(() => {
        if (!directionsRenderer) return;
        directionsRenderer.setRouteIndex(routesIndex);
    }, [routesIndex, directionsRenderer]);

    if (!leg) return null;

    return (
        <div>
            <h2>{selected?.summary}</h2>
            <p>
                {leg?.start_address.split(',')[0]} → {leg?.end_address.split(',')[0]}
            </p>
            <p>Distance: {leg?.distance?.text}</p>
            <p>Duration: {leg?.duration?.text}</p>

            <h2>Other Routes</h2>
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
