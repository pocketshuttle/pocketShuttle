"use client"
import React, { useCallback, useEffect, useState } from 'react'
import { CardWrapper } from './card-wrapper'
import { useSearchParams } from 'next/navigation'


export const ConfirmPassword = () => {
    return (
        <CardWrapper
            headLabel='Confirm Your account'
            backButtonHref="/login"
            backButtonLabel='Back to Login?'
        >
            <div className="flex items-center justify-center w-full">
                <p className='text-sm'>We&apos;ve sent a verification link to your email. Please click the link to confirm your account.</p>
            </div>
        </CardWrapper>

    )
}
