// import Location from "@/components/maps/Map/Map"
import LoginButton from '@/components/auth/login-button'
import TeachersLocation, { DriversLocation } from '@/components/maps/Map/drivers-map'
import { Button } from '@/components/ui/button'


const page = async () => {
    return (
        <div>
            < TeachersLocation />
        </div>
    )
}

export default page