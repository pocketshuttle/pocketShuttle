// Confirm your email address to continue
import { ConfirmPassword } from '@/components/auth/confirm-password'

import { Suspense } from 'react'

const ConfirmEmail = () => {
    return (
        <div className='flex items-center justify-center h-screen'>
            <Suspense>
                < ConfirmPassword />
            </Suspense>
        </div>
    )
}

export default ConfirmEmail