'use client';

import React, { useEffect, useRef, useState } from 'react';
import Map, { Marker, Popup } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import mapboxgl from 'mapbox-gl';
import { fetchCoordinates, getCurrentLocation, getRoute } from '../lib/utils';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX!;

type AddressProps = {
    address: string | null | undefined;
}

const Location = ({ address }: AddressProps) => {

    const mapRef = useRef(null);
    const [coords1, setCoords1] = useState<[number, number] | null>(null);
    const [coords2, setCoords2] = useState<[number, number] | null>(null);
    const [eta, setEta] = useState<string | null>(null);
    const [directions, setDirections] = useState<string[] | null>(null);
    const [openDirection, setOpenDirection] = useState<boolean>(false)

    useEffect(() => {
        const fetchRoute = async () => {
            try {
                // Get the current coordinates
                const coordinates1 = await getCurrentLocation();
                setCoords1(coordinates1);

                // Fetch the coordinates of the second address
                const coordinates2 = await fetchCoordinates(address);
                setCoords2(coordinates2);

                if (coordinates1 && coordinates2) {
                    const route = await getRoute(coordinates1, coordinates2);
                    console.log(route)

                    if (route) {
                        const coordinates = route.geometry.coordinates;

                        const routeLayer = {
                            id: 'route',
                            type: 'line',
                            source: {
                                type: 'geojson',
                                data: {
                                    type: 'Feature',
                                    properties: {},
                                    geometry: {
                                        type: 'LineString',
                                        coordinates: coordinates,
                                    },
                                },
                            },
                            layout: {
                                'line-join': 'round',
                                'line-cap': 'round',
                            },
                            paint: {
                                'line-color': '#3887be',
                                'line-width': 5,
                            },
                        };

                        // Add the route layer to the map
                        //@ts-ignore
                        const map = mapRef.current?.getMap();
                        if (map && !map.getLayer('route')) {
                            map.addLayer(routeLayer);
                        }

                        // Calculate and set ETA
                        const durationInSeconds = route.duration;
                        const timeInMinutes = Math.floor(durationInSeconds / 60);
                        const timeInSeconds = Math.floor(durationInSeconds % 60);
                        setEta(`${timeInMinutes} min ${timeInSeconds} sec`);

                        // Fit map to bounds of both locations
                        if (map) {
                            const bounds = new mapboxgl.LngLatBounds();
                            bounds.extend([coordinates1[0], coordinates1[1]]);
                            bounds.extend([coordinates2[0], coordinates2[1]]);
                            map.fitBounds(bounds, { padding: 50 });
                        }
                        // Set the directions instructions
                        if (route.legs && route.legs.length > 0) {
                            const steps = route.legs[0].steps;
                            const directionsList = steps.map((step: any, index: number) => step.maneuver.instruction);
                            setDirections(directionsList);
                        }
                    }
                }
            } catch (error) {
                console.error("Error in fetching route or coordinates:", error);
            }
        };

        fetchRoute();
    }, [address]);

    const handleMapLoad = () => {
        if (mapRef.current) {
            //@ts-ignore
            const mapInstance = mapRef.current.getMap();
            console.log("Map loaded:", mapInstance);
        }
    };

    if (!coords1 || !coords2) {
        return <div>Loading map...</div>;
    }
    return (
        <div>
            <div className='flex items-center justify-between p-2'>
                {eta && <p>ETA: {eta}</p>}

                <button className='p-2 ' onClick={() => setOpenDirection(!openDirection)}>
                    Show Directions
                </button>
            </div>
            {coords1 && coords2 ? (
                <Map
                    initialViewState={{
                        latitude: coords1[1],
                        longitude: coords1[0],
                        zoom: 8,
                    }}
                    onLoad={handleMapLoad}
                    style={{ width: '100%', height: '400px' }}
                    mapStyle="mapbox://styles/mapbox/streets-v11"
                    ref={mapRef}
                    mapboxAccessToken={mapboxgl.accessToken}
                >
                    {coords1 && (
                        <Marker longitude={coords1[0]} latitude={coords1[1]} color="blue">
                            <img
                                src="/images/sbus.png"
                                alt="Current Location"
                                style={{ width: '30px', height: '30px' }}
                            />
                        </Marker>
                    )}
                    {coords2 && (
                        <Marker longitude={coords2[0]} latitude={coords2[1]} color="red">
                            <img
                                src="/images/home.png"
                                alt="Destination"
                                style={{ width: '30px', height: '30px' }}
                            />
                            <Popup
                                closeButton={true}
                                closeOnClick={false}
                                longitude={coords2[0]}
                                latitude={coords2[1]}
                            >
                                {address}
                            </Popup>
                        </Marker>
                    )}
                </Map>

            ) : (
                <div>Loading map...</div>
            )}

            {/* Conditionally display direction instructions */}
            {
                openDirection &&
                directions && directions.length > 0 && (
                    <div>
                        <h3>Directions:</h3>
                        <ol>
                            {directions.map((instruction, index) => (
                                <li key={index}>{instruction}</li>
                            ))}
                        </ol>
                    </div>
                )}
        </div>
    );
};

export default Location;
