"use client"
import React, { useCallback, useEffect, useState } from 'react'
import { CardWrapper } from './card-wrapper'
import { BeatLoader } from "react-spinners"
import { useSearchParams } from 'next/navigation'
import { newVerification } from '@/actions/new-verification'
import { FormError } from '../errorsandsuccess/form-error'
import { FormSuccess } from '../errorsandsuccess/form-success'

const NewVerificationForm = () => {
    const searchParams = useSearchParams()
    const token = searchParams.get("token")
    const [error, setError] = useState<string | undefined>("")
    const [success, setSuccess] = useState<string | undefined>("")

    const onSubmit = useCallback(() => {
        if (success || error) return
        if (!token) {
            setError("Missing token")
            return
        }
        newVerification(token)
            .then((data) => {
                setSuccess(data.success)
                setError(data.error)
            }).catch((error) => (
                setError(error)
            ))
    }, [token, success, error])

    useEffect(() => {
        onSubmit()
    }, [token])

    return (
        <CardWrapper
            headLabel='Confirming Your account'
            subLabel="We’re verifying your email so you can finish setting up access."
            backButtonHref="/login"
            backButtonLabel='Back to login'
        >
            <div className="flex min-h-[120px] w-full flex-col items-center justify-center gap-4 rounded-2xl bg-slate-50 px-6 py-8 text-center">
                {!success && !error && (
                    <BeatLoader />
                )}
                <FormSuccess message={success} />
                {!success && (
                    <FormError message={error} />
                )}
            </div>
        </CardWrapper>

    )
}

export default NewVerificationForm
