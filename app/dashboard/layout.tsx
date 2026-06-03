import Navbar from "@/components/dashboard/navbar/navbar";
import Sidebar from "@/components/dashboard/sidebar/sidebar";
import { getUserSession } from "@/lib/session";
import { Inter } from "next/font/google";
import { redirect } from "next/navigation";

const inter = Inter({
    subsets: ["latin"],
    weight: ["400", "500", "600", "700"],
});

const DashboardLayout = async ({ children }: { children: React.ReactNode }) => {
    // Fetch the user session
    const user = await getUserSession();

    // Handle case where no session is found (redirect to login)
    if (!user) {
        redirect("/login");
    }

    if (user?.role === "teacher") {
        redirect("/teacher");
    } else if (user?.role === "parent") {
        redirect("/parent");
    }

    return (
        <div className={`flex h-screen w-full flex-col bg-gray-100 text-black dark:bg-black dark:text-white ${inter.className} antialiased transition-colors duration-200`}>
            <Navbar data={user} />

            <div className="flex min-h-0 flex-1">
                <Sidebar data={user} />

                <main className="flex-1 overflow-y-auto bg-gray-100 p-4 text-black transition-colors dark:bg-black dark:text-white lg:p-5">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
