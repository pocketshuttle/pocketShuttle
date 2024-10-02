
// import Location from '@/components/maps/Map/new-map'
import React from 'react'
// import Location from "@/components/maps/Map/Map"
import { Component } from '@/components/maps/Map/searchbox'
import Location from '@/components/maps/Map/new-map'
// import MapWithGeocoder from '@/components/maps/Map/searchbox'
const page = () => {
    return (
        <div>
            <div>
                {/* <MapWithGeocoder /> */}
                <Component />

            </div>
            <Location />

        </div>
    )
}

export default page