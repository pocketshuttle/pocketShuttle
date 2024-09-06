import NewVerificationForm from '@/components/auth/new-verification-form'

import { Suspense } from 'react'

const NewVerification = () => {
    return (
        <div className='flex items-center justify-center h-screen'>
            <Suspense>
                < NewVerificationForm />
            </Suspense>
        </div>
    )
}

export default NewVerification