"use client";
import React from 'react';
import Image from 'next/image';
import { FooterService } from './footer-service';
import { Poppins } from 'next/font/google';

const poppins = Poppins({ weight: "300", subsets: ["latin"] });

export const AuthFooter = () => {
    return (
        <div className={`${poppins.className} flex flex-col items-center px-3 md:py-5 `}>
            <div className={`border-t-[1px] border-t-gray-600 gap-2 md:mt-6 flex flex-col items-center`}>
                <FooterService />
                <small className={` text-slate-500 py-2 text-center`}>Copyright @ 2024 PocketShuttle, all rights reserved</small>
            </div>
        </div>
    );
};
