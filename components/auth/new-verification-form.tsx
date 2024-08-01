"use client"
import React, { useCallback, useEffect } from 'react'
import { CardWrapper } from './card-wrapper'
import { BeatLoader } from "react-spinners"
import { useSearchParams } from 'next/navigation'
import { newVerification } from '@/actions/new-verification'
const NewVerificationForm = () => {
    const searchParams = useSearchParams()
    const token = searchParams.get("token")

    const onSubmit = useCallback(() => {
        console.log(token)
    }, [token])

    useEffect(() => {
        onSubmit()
    }, [token])
    return (
        <CardWrapper
            headLabel='Confirming Your account'
            backButtonHref="/login"
            backButtonLabel='Back to login'
        >
            <div className="flex items-center justify-center w-full">
                <BeatLoader />
            </div>
        </CardWrapper>

    )
}

export default NewVerificationForm