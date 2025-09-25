"use client";

import { ReactNode } from "react";
import { LoadScript } from "@react-google-maps/api";

interface GoogleMapsProviderProps {
    children: ReactNode;
}

const GoogleMapsProvider = ({ children }: GoogleMapsProviderProps) => {
    return (
        <LoadScript
            googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}
            libraries={["places"]}
        >
            {children}
        </LoadScript>
    );
};

export default GoogleMapsProvider