"use client";
import React, { ReactNode } from 'react';
import { AblyProvider } from 'ably/react';
import * as Ably from 'ably';

interface AblyProviderRootProps {
    children: ReactNode;
}

const AblyProviderRoot: React.FC<AblyProviderRootProps> = ({ children }) => {
    const client = new Ably.Realtime({ key: process.env.NEXT_PUBLIC_ABLY_KEY! });

    return <AblyProvider client={client}>{children}</AblyProvider>;
};

export default AblyProviderRoot;
