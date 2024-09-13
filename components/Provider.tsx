"use client"
// import { SessionProvider } from "next-auth/react"
// import { ReactNode } from "react"

// type ProviderProps = {
//     children: ReactNode;
//     session?: any

// }

// const Provider = ({ children, session }: ProviderProps) => {
//     return (
//         <SessionProvider session={session}>
//             {children}
//         </SessionProvider>
//     )
// }

// export default Provider

import { Session } from "next-auth";
import {
    SessionProvider as NextSessionProvider,
    getSession
} from "next-auth/react";
import { usePathname } from "next/navigation";
import { ReactNode, useCallback, useEffect, useState } from "react";

// Retrieve user session for the app's session context
const Provider = ({ children }: { children: ReactNode }) => {
    const [session, setSession] = useState<Session | null>(null);

    const fetchSession = useCallback(async () => {
        if (typeof window !== "undefined") {
            try {
                const sessionData = await getSession();
                setSession(sessionData);
            } catch (error) {
                setSession(null);
                if (process.env.NODE_ENV === "development") {
                    console.error("Error fetching session:", error);
                }
            }
        }
    }, []);

    // Only fetch session when the component mounts
    useEffect(() => {
        fetchSession();
    }, [fetchSession]);

    return (
        <NextSessionProvider session={session}>
            {children}
        </NextSessionProvider>
    );
}

export default Provider;
