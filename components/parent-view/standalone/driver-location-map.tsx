"use client";

import { APIProvider, AdvancedMarker, Map, Marker, Pin } from "@vis.gl/react-google-maps";

import type { AssignmentWithDriver } from "./types";
import { formatDate } from "./utils";

export function DriverLocationMap({ assignment }: { assignment: AssignmentWithDriver }) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const location = assignment.driver.liveAddress;

  if (!location) {
    return (
      <div className="grid h-72 place-items-center rounded-lg bg-slate-100 px-4 text-center text-sm text-slate-500">
        Driver has not shared a live location yet.
      </div>
    );
  }

  if (!apiKey) {
    return (
      <div className="grid h-72 place-items-center rounded-lg bg-slate-100 px-4 text-center text-sm text-slate-500">
        Google Maps is unavailable because the API key is missing.
      </div>
    );
  }

  const center = { lat: location.latitude, lng: location.longitude };
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID?.trim();

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200">
      <div className="h-72">
        <APIProvider apiKey={apiKey}>
          <Map
            defaultCenter={center}
            defaultZoom={14}
            {...(mapId ? { mapId } : {})}
            fullscreenControl={false}
            streetViewControl={false}
            mapTypeControl={false}
          >
            {mapId ? (
              <AdvancedMarker position={center} title={assignment.driver.full_name}>
                <Pin background="#111827" borderColor="#ffffff" glyphColor="#ffffff" />
              </AdvancedMarker>
            ) : (
              <Marker position={center} title={assignment.driver.full_name} />
            )}
          </Map>
        </APIProvider>
      </div>
      <div className="border-t border-slate-200 bg-white p-3 text-sm text-slate-600">
        {assignment.driver.full_name} for {assignment.child.fullName}
        {assignment.lastStatusAt ? ` · last child update ${formatDate(assignment.lastStatusAt)}` : ""}
      </div>
    </div>
  );
}
