import { Poppins } from "next/font/google";

const poppins = Poppins({ weight: "500", subsets: ["latin"] });

const DriverLayout = async ({ children }: { children: React.ReactNode }) => {
  return (
    <div className={`min-h-screen bg-gray-100 text-black ${poppins.className}`}>
      {children}
    </div>
  );
};

export default DriverLayout;
