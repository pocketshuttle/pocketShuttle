"use client"
import { SearchBox } from "@mapbox/search-js-react";
import React, { useState } from "react";
export function Component() {
    const [value, setValue] = useState('');
    const handleChange = (d: string) => {
        setValue(d);
    };
    return (
        <div>
            <SearchBox
                options={{
                    // proximity: {
                    //     lng: -122.431297,
                    //     lat: 37.773972,
                    // },
                    country: 'NG',
                    language: "en"
                }}
                value={value}
                onChange={handleChange}
                accessToken={process.env.NEXT_PUBLIC_MAPBOX!}
            />
        </div>

    );
}