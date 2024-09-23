import { FAQ } from '@/components/help/faq'
import { HeroSection } from '@/components/help/hero'
import React from 'react'
import { GeneralFAQ } from '@/components/help/general'

const page = () => {
    return (
        <div >
            <HeroSection />
            <FAQ />
            <GeneralFAQ />
        </div>
    )
}

export default page