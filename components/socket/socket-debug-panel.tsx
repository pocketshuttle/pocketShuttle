// components/SocketDebugPanel.tsx
"use client";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";

export const SocketDebugPanel = () => {
    const [logs, setLogs] = useState<string[]>([]);
    const [connectionStatus, setConnectionStatus] = useState("disconnected");

    useEffect(() => {
        const socket = io({ path: "/api/socket/io" });

        const addLog = (msg: string) => {
            setLogs(prev => [...prev.slice(-50), msg]);
        };

        socket.on("connect", () => {
            setConnectionStatus("connected");
            addLog("Connected to server");
        });

        socket.on("disconnect", () => {
            setConnectionStatus("disconnected");
            addLog("Disconnected from server");
        });

        socket.onAny((event, ...args) => {
            addLog(`Received event '${event}': ${JSON.stringify(args)}`);
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    return (
        <div className="fixed bottom-0 right-0 bg-gray-900 text-white p-4 max-w-xs max-h-60 overflow-auto">
            <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold">Socket.IO Debug</h3>
                <span className={`px-2 py-1 text-xs rounded ${connectionStatus === "connected" ? "bg-green-500" : "bg-red-500"
                    }`}>
                    {connectionStatus}
                </span>
            </div>
            <div className="text-xs font-mono space-y-1">
                {logs.map((log, i) => (
                    <div key={i}>{log}</div>
                ))}
            </div>
        </div>
    );
};