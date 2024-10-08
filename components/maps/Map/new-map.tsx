'use client';

import React, { useEffect, useRef, useState } from 'react';
import Map, { Marker, Popup } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import mapboxgl from 'mapbox-gl';
import { fetchCoordinates, getCurrentLocation, getRoute } from '../lib/utils';
import { useRecoilState } from 'recoil';
import { studentETA } from '@/atoms/eta';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX!;

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

const Location = ({ parentAddress, teacherData }: AddressProps) => {
    const mapRef = useRef(null);
    const [coords1, setCoords1] = useState<[number, number] | null>(teacherData ? [teacherData.longitude, teacherData.latitude] : null);
    const [coords2, setCoords2] = useState<[number, number] | null>(null);
    const [eta, setEta] = useState<string | null>(null);
    const [directions, setDirections] = useState<string[] | null>(null);
    const [openDirection, setOpenDirection] = useState<boolean>(false);
    const [studentEta, setStudentEta] = useRecoilState<number | null>(studentETA)


    useEffect(() => {
        if (teacherData) {
            console.log('Teacher Data:', teacherData);
            setCoords1([teacherData?.longitude, teacherData?.latitude]); // Set longitude first, then latitude
        }
    }, [teacherData]);

    useEffect(() => {
        // Fetch the parent's address coordinates
        const fetchParentCoordinates = async () => {
            const coordinates2 = await fetchCoordinates(parentAddress);
            setCoords2(coordinates2);
        };
        fetchParentCoordinates();
    }, [parentAddress]);


    // Fetch the route whenever teacher's location (coords1) or parent's location (coords2) changes
    useEffect(() => {
        const fetchRoute = async () => {
            if (coords1 && coords2) {
                try {
                    const route = await getRoute(coords1, coords2);
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
                        setStudentEta(timeInMinutes)



                        // Fit map to bounds of both locations
                        if (map) {
                            const bounds = new mapboxgl.LngLatBounds();
                            bounds.extend([coords1[0], coords1[1]]);
                            bounds.extend([coords2[0], coords2[1]]);
                            map.fitBounds(bounds, { padding: 50 });
                        }

                        // Set the directions instructions
                        if (route.legs && route.legs.length > 0) {
                            const steps = route.legs[0].steps;
                            const directionsList = steps.map((step: any) => step.maneuver.instruction);
                            setDirections(directionsList);
                        }
                    }
                } catch (error) {
                    console.error('Error in fetching route or coordinates:', error);
                }
            }
        };

        fetchRoute();

        const debounceFetchRoute = setTimeout(() => {
            fetchRoute();
        }, 500);

        return () => clearTimeout(debounceFetchRoute);
    }, [coords1, coords2, teacherData]);

    useEffect(() => {
        const fetchLatestData = async () => {
            // Fetch latest teacher and parent data here
            if (teacherData) {
                setCoords1([teacherData?.longitude, teacherData?.latitude]); // Update teacher's location
            }
        };

        // Polling every 10 seconds to get the latest location updates
        const interval = setInterval(fetchLatestData, 10000);

        return () => clearInterval(interval); // Cleanup the interval on component unmount
    }, [teacherData]);

    const handleMapLoad = () => {
        if (mapRef.current) {
            //@ts-ignore
            const mapInstance = mapRef.current.getMap();
            console.log('Map loaded:', mapInstance);
        }
    };

    if (!coords1 || !coords2) {
        return <div>Loading map...</div>;
    }

    return (
        <div>
            {
                teacherData &&
                <>
                    <div className='flex items-center justify-between p-2'>
                        {eta && <p>ETA: {eta}</p>}

                        <button className='p-2' onClick={() => setOpenDirection(!openDirection)}>
                            Show Directions
                        </button>
                    </div>

                    <Map
                        initialViewState={{
                            latitude: coords1[1], // Latitude second
                            longitude: coords1[0], // Longitude first
                            zoom: 8,
                        }}
                        onLoad={handleMapLoad}
                        style={{ width: '100%', height: '400px' }}
                        mapStyle='mapbox://styles/mapbox/streets-v11'
                        ref={mapRef}
                        mapboxAccessToken={mapboxgl.accessToken}
                    >
                        <Marker longitude={coords1[0]} latitude={coords1[1]} color='blue'>
                            <img
                                src={teacherData?.teacherImage}
                                alt='Current Location'
                                style={{ width: '30px', height: '30px', borderRadius: "50%" }}
                            />
                        </Marker>
                        {coords2 && (
                            <Marker longitude={coords2[0]} latitude={coords2[1]} color='red'>
                                <img
                                    src='/images/home.png'
                                    alt='Destination'
                                    style={{ width: '30px', height: '30px' }}
                                />
                                <Popup closeButton={true} closeOnClick={false} longitude={coords2[0]} latitude={coords2[1]}>
                                    {parentAddress}
                                </Popup>
                            </Marker>
                        )}
                    </Map>

                    {/* Conditionally display direction instructions */}
                    {openDirection && directions && directions.length > 0 && (
                        <div>
                            <h3>Directions:</h3>
                            <ol>
                                {directions.map((instruction, index) => (
                                    <li key={index}>{instruction}</li>
                                ))}
                            </ol>
                        </div>
                    )}
                </>
            }
        </div>
    );
};

export default Location;
