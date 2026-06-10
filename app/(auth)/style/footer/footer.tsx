"use client";
import { FooterService } from './footer-service';

export const AuthFooter = () => {
    const year = new Date().getFullYear();

    return (
        <div className="flex flex-col items-center px-3 md:py-5">
            <div className={`border-t-[1px] border-t-gray-600 gap-2 md:mt-6 flex flex-col items-center`}>
                <FooterService />
                <small className={` text-slate-200 py-2 text-center`}>Copyright @ {year} PocketShuttle, all rights reserved</small>
            </div>
        </div>
    );
};
