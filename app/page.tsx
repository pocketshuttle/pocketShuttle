import LoginButton from "@/components/auth/login-button";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

export default function Home() {

  return (
    <main className="flex min-h-screen h-full flex-col items-center justify-center text-gray-100 ">
      <div className="space-y-6 flex flex-col items-center justify-center">
        <h1 className="text-5xl font-semibold drop-shadow-md text-center "> DropOff 📍 </h1>
        <p className="text-lg "> checkin and checkout, a simple service</p>

        <LoginButton>
          <Button size={"lg"} >Login</Button>
        </LoginButton>
      </div>
    </main>
  );
}
