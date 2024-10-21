"use client"
import { SearchBox } from "@mapbox/search-js-react";
import { GeocoderAutocomplete } from '@geoapify/geocoder-autocomplete';
import React, { useEffect, useRef, useState } from "react";

type AddressComponentProps = {
    handleAddressChange: (value: string) => void;
    handleSuggestionChange: (suggestion: any) => void;
    value: string;
};

export const AddressComponent = ({ handleAddressChange, handleSuggestionChange, value }: AddressComponentProps) => {
    return (
        <div>
            {/* @ts-ignore */}
            <SearchBox
                options={{
                    // proximity: {
                    //     lng: -122.431297,
                    //     lat: 37.773972,
                    // },
                    country: 'NG',
                    language: "en"
                }}
                onRetrieve={handleSuggestionChange}
                placeholder="Please add your address, be precise as much as possible or use a landmark"
                value={value}
                onChange={handleAddressChange}
                accessToken={process.env.NEXT_PUBLIC_MAPBOX!}

            />
        </div>

    );

}