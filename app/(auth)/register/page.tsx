import RegisterForm from '@/components/auth/register-form'
import React from 'react'

const Register = async ({
    searchParams,
}: {
    searchParams?: Promise<{ role?: string; invite?: string }>
}) => {
    const params = await searchParams
    const role = params?.role === "driver" || params?.role === "parent" || params?.role === "school"
        ? params.role
        : undefined

    return (
        <div className='flex items-center justify-center' >
            <RegisterForm initialRole={role} inviteToken={params?.invite} />
        </div>
    )
}

export default Register
