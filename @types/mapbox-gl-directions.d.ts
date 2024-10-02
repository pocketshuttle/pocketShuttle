declare module '@mapbox/mapbox-gl-directions' {
    import { Control } from 'mapbox-gl';
    
    interface DirectionsOptions {
        accessToken: string;
        unit?: 'imperial' | 'metric';
        profile?: 'mapbox/driving' | 'mapbox/walking' | 'mapbox/cycling';
        alternatives?: boolean;
        congestion?: boolean;
    }

    class MapboxDirections extends Control {
        constructor(options?: DirectionsOptions);
        setOrigin(origin: [number, number] | string): void;
        setDestination(destination: [number, number] | string): void;
        on(event: string, callback: (event: any) => void): void;
    }

    export default MapboxDirections;
}
