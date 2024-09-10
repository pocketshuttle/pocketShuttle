import { LoginForm } from '@/components/auth/login-form'
import React, { Suspense } from 'react'
const LoginPage = () => {

    return (
        <div className='flex items-center justify-center h-screen' >
            <Suspense>
                < LoginForm />
            </Suspense>
        </div>
    )
}

export default LoginPage