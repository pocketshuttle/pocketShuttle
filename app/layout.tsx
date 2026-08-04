import type { Metadata } from "next";
// @ts-ignore
import "./globals.css";
import { Toaster } from "@/components/ui/toaster"
import Provider from "@/components/Provider";
import QueryProvider from "@/components/webnotifications/query-provider";
import OneSignalClient from "@/onesignal/onesignal-client";
import Script from "next/script";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.pocketshuttle.com"),

  title: {
    template: "track live location for kids",
    default: "School bus",
  },
  authors: {
    name: "meshboc,abusomwansantos",

  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/logo.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/logo.png",
    apple: [{ url: "/logo.png", sizes: "192x192", type: "image/png" }],
  },

  description: "location bus service for school and parent",
  openGraph: {
    title: "pocketshuttle",
    description: "location bus service for school and parent",
    url: "https://www.pocketshuttle.com",
    siteName: "PocketShuttle",
    images: "/logo.png",
    type: "website",
  },
  keywords: ["school delivery", "school", "bus service for kids", "meshboc",],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;

}>) {

  return (
    <html lang="en">
      <head>
        <Script
          src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"
          defer
        />
      </head>
      <body>
        <Provider>
          <OneSignalClient>
            < QueryProvider>
              <main>
                {children}
              </main>
            </QueryProvider>
            <Toaster />
          </OneSignalClient>
        </Provider>
      </body>


    </html >
  );
}
