import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster"
import Provider from "@/components/Provider";
import QueryProvider from "@/components/webnotifications/query-provider";
import Head from "next/head";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://pocketshuttle.netlify.app"),

  title: {
    template: "track live location for kids",
    default: "School bus",
  },
  authors: {
    name: "meshboc",
  },
  manifest: "/manifest.webmanifest",

  description: "location bus service for school and parent",
  openGraph: {
    title: "pocketshuttle",
    description: "location bus service for school and parent",
    url: "https://pocketshuttle.netlify.app",
    siteName: "PocketShuttle",
    images: "/logo.png",
    type: "website",
  },
  keywords: ["school delivery", "school", "bus service for kids", "meshboc"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="en">
      <Head>
        <link rel="manifest" href="https://progressier.app/lbUiVhJ6SXptddBZ8IYj/progressier.json" />
        <script defer src="https://progressier.app/lbUiVhJ6SXptddBZ8IYj/script.js"></script>
      </Head>
      <body className={inter.className}>
        {/* <Provider> */}
        < QueryProvider>
          <main>
            {children}
          </main>
        </QueryProvider>
        {/* </Provider> */}

        <Toaster />
      </body>
    </html >
  );
}
