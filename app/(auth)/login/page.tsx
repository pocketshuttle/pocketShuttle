import { LoginForm } from '@/components/auth/login-form'
import React, { Suspense } from 'react'
const LoginPage = () => {

    return (
        <div className=' items-center justify-center  w-full' >

            <div className='flex items-center justify-center   w-full'>
                <Suspense>
                    < LoginForm />
                </Suspense>
            </div>


        </div>
    )
}

export default LoginPage