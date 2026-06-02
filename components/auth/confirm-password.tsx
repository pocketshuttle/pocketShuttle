"use client"
import React, { useCallback, useEffect, useState } from 'react'
import { CardWrapper } from './card-wrapper'
import { useSearchParams } from 'next/navigation'


export const ConfirmPassword = () => {
    return (
        <CardWrapper
            headLabel='Confirm Your account'
            subLabel="Check your inbox to verify your email address and complete account setup."
            backButtonHref="/login"
            backButtonLabel='Back to Login?'
        >
            <div className="rounded-2xl bg-slate-50 px-6 py-8 text-center">
                <p className='text-sm leading-6 text-slate-600'>We&apos;ve sent a verification link to your email. Open it to activate your account and continue.</p>
            </div>
        </CardWrapper>

    )
}
