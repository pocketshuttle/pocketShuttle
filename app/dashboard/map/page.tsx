// import Location from "@/components/maps/Map/Map"
import LoginButton from '@/components/auth/login-button'
import { DriversLocation } from '@/components/maps/Map/drivers-map'
import { Button } from '@/components/ui/button'
import { db } from '@/lib/db'
import { getUserSession } from '@/lib/session'

const page = async () => {
    return (
        <div>
            < DriversLocation />
        </div>
    )
}

export default page