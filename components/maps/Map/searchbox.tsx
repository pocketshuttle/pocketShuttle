"use client";

import React, { useRef } from "react";
import { Autocomplete, LoadScript } from "@react-google-maps/api";

type AddressComponentProps = {
    handleAddressChange: (value: string) => void;
    handleSuggestionChange?: (suggestion: {
        address: string;
        lat: number;
        lng: number;
    }) => void;
    value: string;
};

export const AddressComponent = ({
    handleAddressChange,
    handleSuggestionChange,
    value,
}: AddressComponentProps) => {
    const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

    const onLoad = (autocomplete: google.maps.places.Autocomplete) => {
        autocompleteRef.current = autocomplete;
    };

    const onPlaceChanged = () => {
        if (autocompleteRef.current) {
            const place = autocompleteRef.current.getPlace();

            const address = place.formatted_address;
            const location = place.geometry?.location;

            if (address && location) {
                const lat = location.lat();
                const lng = location.lng();

                handleAddressChange(address);
                if (handleSuggestionChange) {
                    handleSuggestionChange({ address, lat, lng });
                }
            }
        }
    };



    return (

        <Autocomplete onLoad={onLoad} onPlaceChanged={onPlaceChanged}>
            <input
                type="text"
                className="py-3 px-3 border-none bg-transparent border-1 border-gray-500 shadow-md outline-none h-12 w-full"

                placeholder="Please add your address, be precise as much as possible or use a landmark"
                value={value}
                onChange={(e) => handleAddressChange(e.target.value)}
            />
        </Autocomplete>
    );
};
