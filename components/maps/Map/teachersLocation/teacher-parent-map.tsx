import { APIProvider, Map, useMapsLibrary, useMap } from '@vis.gl/react-google-maps';
import { Directions } from './directions-to-parent';

export const TeacherLocationTracker = () => (
    <div style={{ width: '100%', height: '80vh' }}>
        <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
            <Map

                // defaultCenter={{ lat: 6.5244, lng: 3.3792 }}
                zoom={13}
                mapId={process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID!}
                fullscreenControl={false}
                scrollwheel={false}
            >
                <Directions />
            </Map>
        </APIProvider>
    </div>
);

