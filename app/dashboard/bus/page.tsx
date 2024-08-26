import Buses from '@/components/buses/buses'
import { Spinner } from '@/components/ui/spinner'
import { Suspense } from 'react'

const Bus = () => {
    return (
        <div>
            <Suspense fallback={<Spinner />}>
                <Buses />
            </Suspense>
        </div>
    )
}

export default Bus