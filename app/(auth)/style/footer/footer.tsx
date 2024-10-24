"use client";
import React from 'react';
import Image from 'next/image';
import { FooterService } from './footer-service';
import { Poppins } from 'next/font/google';

const poppins = Poppins({ weight: "300", subsets: ["latin"] });

export const AuthFooter = () => {
    return (
        <div className={`${poppins.className} flex flex-col items-center px-3 py-5 space-y-4`}>
            <div className="flex space-x-2 py-2 mt-3">
                <small className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center">
                    <Image src="/images/tiktok.svg" alt="Follow us on TikTok" width={30} height={30} className="rounded-full" />
                </small>
                <small className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center">
                    <Image src="/images/facebk.svg" alt="Connect with us on Facebook" width={30} height={30} className="rounded-full" />
                </small>
            </div>

            <div className={`border-t-[1px] border-t-gray-600 space-y-3 py-4 mt-6`}>
                <FooterService />
                <small className={` text-slate-500 py-4`}>Copyright @ 2024 PocketShuttle, all rights reserved</small>
            </div>
        </div>
    );
};
