"use client"
import { Button } from "@/components/ui/button";
import Image from "next/image";
import React from "react";
import { useRouter } from "next/navigation";

export const NetworkError = ({ error }: { error: string }) => {
  const router = useRouter()
  return <div className="flex flex-col items-center justify-center">
    <p className="text-center text-xl capitalize">{error} Error</p>
    <Image src="/images/error.png" width={150} height={150} alt="wrong-way" />
    <p className="text-red-500 text-xl">
      The link seems to have taken a detour! Please hit 'Refresh' to get back on track
    </p>
    <Button onClick={() => router.refresh} className="px-6  " variant="default">
      refesh
    </Button>
  </div>;
};
