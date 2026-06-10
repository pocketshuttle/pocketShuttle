const DriverLayout = async ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen bg-gray-100 text-black">
      {children}
    </div>
  );
};

export default DriverLayout;
