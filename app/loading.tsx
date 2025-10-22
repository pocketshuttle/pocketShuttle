"use client"
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import React from "react";
// import Spinner from "@/components/ui/spinner";

export default function Loading() {
    return (
        <div className="w-full h-screen flex items-center justify-center bg-background">
            <div className="flex items-center gap-2 m-auto">
                <DotLottieReact
                    src="/images/mapcity.json"
                    loop
                    autoplay
                    style={{ width: 400, height: 400 }}
                />
            </div>
        </div>
    );
}