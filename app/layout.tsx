import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster"
import Provider from "@/components/Provider";
import QueryProvider from "@/components/webnotifications/query-provider";
import AblyProviderRoot from "@/ably/ably-provider";
import OneSignalClient from "@/onesignal/onesignal-client";
import Script from "next/script";
import GoogleMapsProvider from "@/components/maps/Map/google-map-provider";

const inter = Inter({ subsets: ["latin"] });

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
      <body className={inter.className}
        style={{
          fontFamily: "Arial, sans-serif "
        }}
      >
        <Provider>
          < AblyProviderRoot>
            <OneSignalClient>
              < GoogleMapsProvider>
                < QueryProvider>
                  <main>
                    {children}
                  </main>
                </QueryProvider>
                <Toaster />
              </GoogleMapsProvider>
            </OneSignalClient>
          </AblyProviderRoot>
        </Provider>
      </body>


    </html >
  );
}
