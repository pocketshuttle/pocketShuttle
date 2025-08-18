import { APIProvider, Map, useMapsLibrary, useMap } from '@vis.gl/react-google-maps';
import { useEffect, useState } from 'react';

export function Directions() {
    const map = useMap()
    const routesLibrary = useMapsLibrary("routes")
    const [directionsService, setDirectionsService] = useState<google.maps.DirectionsService>();
    const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer>();
    const [routes, setRoutes] = useState<google.maps.DirectionsRoute[]>([]);
    const [routesIndex, setRoutesIndex] = useState(0);
    const selected = routes[routesIndex];
    const leg = selected?.legs[0]



    useEffect(() => {
        if (!routesLibrary || !map) return;
        setDirectionsService(new routesLibrary.DirectionsService());
        setDirectionsRenderer(new routesLibrary.DirectionsRenderer({
            map: map,
            // suppressMarkers: true,
            polylineOptions: {
                strokeColor: '#FF0000',
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
