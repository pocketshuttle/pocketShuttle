"use client"
import { ReactNode, } from "react";
import { RecoilRoot } from "recoil";

// Retrieve user session for the app's session context
const Provider = ({ children }: { children: ReactNode }) => {
    return (
        <RecoilRoot>
            {children}
        </RecoilRoot>
    );
};

export default Provider;
