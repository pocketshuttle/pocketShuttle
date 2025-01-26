"use client";
import React from 'react';
import Image from 'next/image';
import { FooterService } from './footer-service';
import { Poppins } from 'next/font/google';

const poppins = Poppins({ weight: "300", subsets: ["latin"] });

export const AuthFooter = () => {
    return (
        <div className={`${poppins.className} flex flex-col items-center px-3 py-5 space-y-4`}>
            <div className={`border-t-[1px] border-t-gray-600 space-y-3 py-4 mt-6`}>
                <FooterService />
                <small className={` text-slate-500 py-4`}>Copyright @ 2024 PocketShuttle, all rights reserved</small>
            </div>
        </div>
    );
};
