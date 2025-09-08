"use client"
import LoginButton from "@/components/auth/login-button";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useEffect } from "react";
import OneSignal from 'react-onesignal';

export default function Home() {
  const testNotification = async () => {
    try {
      await OneSignal.Notifications.requestPermission();
      console.log('Notification permission requested');
    } catch (error) {
      console.error('Error requesting notification:', error);
    }
  };
  useEffect(() => {
    testNotification();
  }, []);
  return (
    <main className=" min-h-screen bg-white space-y-6">
      <div className="bg-[#1d146d] h-[65vh] flex items-center justify-center m-auto rounded-bl-3xl rounded-br-3xl">
        <Image
          src="/images/buus.png"
          width={350}
          height={200}
          alt="pocketshuttle logo"

        />
      </div>
      <div className=" flex flex-col items-center justify-center space-y-3 h-3/6 text-blue-950">
        <h1 className="text-3xl px-4 py-3 font-semibold ">Be in the journey. anytime, anywhere </h1>
        <div className="px-3 space-y-6">
          <p className=" mb-3"> Monitor your kids picked up and dropped off anywhere</p>

          <LoginButton>
            <Button size={"lg"} className=" w-full mt-2 bg-[#1d146d]" >Walk In</Button>
          </LoginButton>

        </div>
      </div>
    </main>
  );
}
