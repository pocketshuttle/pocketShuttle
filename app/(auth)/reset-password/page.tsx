import { NewPasswordForm } from '@/components/auth/new-password'
import { Suspense } from 'react'
const ResetPassword = () => {
    return (
        <Suspense>
            <div className='flex items-center justify-center h-screen'>
                <NewPasswordForm />
            </div>
        </Suspense>
    )
}

export default ResetPassword