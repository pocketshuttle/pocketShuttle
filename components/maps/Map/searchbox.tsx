"use client"
import { SearchBox } from "@mapbox/search-js-react";
import React, { useState } from "react";
type addressTypes = {
    handleAddressChange: (d: string) => void
    value: string
}
export const AddressComponent = ({ handleAddressChange, value }: addressTypes) => {

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
                onSuggest={handleAddressChange}
                value={value}
                onChange={handleAddressChange}
                accessToken={process.env.NEXT_PUBLIC_MAPBOX!}
            />
        </div>

    );

}