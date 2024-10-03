"use client"
import { Session } from "next-auth";


import { SessionProvider as NextSessionProvider, getSession } from "next-auth/react";
import { ReactNode, useEffect, useState } from "react";

// Retrieve user session for the app's session context
const Provider = ({ children }: { children: ReactNode }) => {
    const [session, setSession] = useState<Session | null>(null);

    useEffect(() => {
        const fetchSession = async () => {
            const sessionData = await getSession();
            setSession(sessionData);
        };

        fetchSession();
    }, []);

    return (
        <NextSessionProvider session={session}>
            {children}
        </NextSessionProvider>
    );
};

export default Provider;
