import Navbar from "@/components/dashboard/navbar/navbar";
import Sidebar from "@/components/dashboard/sidebar/sidebar";
import { getUserSession } from "@/lib/session";
import { Poppins } from "next/font/google";
import { redirect } from "next/navigation";
const poppins = Poppins({ weight: "500", subsets: ["latin"] });

const DashboardLayout = async ({ children }: { children: React.ReactNode }) => {
    const user = await getUserSession();
    if (user?.role === "teacher") {
        redirect("/teacher");
    } else if (user?.role === "parent") {
        redirect("/parent");
    }

    return (
        <div className={`flex h-screen ${poppins.className}`}>
            <div className="w-1/5 max-h-screen">
                <Sidebar data={user} />
            </div>

            <div className="flex-1 p-3 ml-1/5">
                <Navbar />
                {children}
            </div>
        </div>
    );
};

export default DashboardLayout;
