import { LoginForm } from '@/components/auth/login-form'
import React, { Suspense } from 'react'
const LoginPage = () => {

    return (
        <div className=' items-center justify-center  w-full' >

            {/* <div>
                <video
                    width={700}
                    height={200}
                    muted
                    loop
                    style={{ display: 'block' }}
                >
                    <source src="/images/heroo.mp4" type="video/mp4" />
                    Your browser does not support the video tag.

                </video>
            </div> */}

            <div className='flex items-center justify-center   w-full'>
                <Suspense>
                    < LoginForm />
                </Suspense>
            </div>


        </div>
    )
}

export default LoginPage