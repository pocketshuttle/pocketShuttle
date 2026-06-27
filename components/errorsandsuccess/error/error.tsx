"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { RotateCw } from "lucide-react";
import React from "react";

export const NetworkError = ({ error }: { error: string }) => {
  const router = useRouter();

  const handleRefresh = () => {
    // Force a hard reload to ensure network reconnects
    if (typeof window !== "undefined") {
      window.location.reload();
    } else {
      router.refresh();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-6 space-y-6 animate-fadeIn">
      {/* Error Heading */}
      <div className="space-y-2">
        <p className="text-4xl font-semibold text-red-500">
          {error} Error
        </p>
        {/* <p className="text-gray-600">
          Looks like we took a wrong turn. Let’s get you back on track!
        </p> */}
      </div>

      {/* Error Illustration */}
      <div className="relative w-48 h-48">
        <Image
          src="/images/error.png"
          fill
          alt="Network error"
          className="object-contain drop-shadow-md"
          priority
        />
      </div>

      {/* Message */}
      <p className="text-red-500 font-medium text-lg max-w-md">
        The connection seems lost. Please check your network and try refreshing the page.
      </p>

      {/* Refresh Button */}
      <Button
        onClick={handleRefresh}
        size="lg"
        className="gap-2 px-6 py-2 bg-primary hover:bg-primary/90 rounded-full transition-all"
      >
        <RotateCw className="w-4 h-4" />
        Refresh
      </Button>
    </div>
  );
};
