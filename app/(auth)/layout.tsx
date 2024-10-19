import { AuthFooter } from "./style/footer/footer"

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
    return (
        <div className="flex flex-col h-screen items-center justify-center ">
            {children}
            <div className="space-y-3 mt-8 w-full ">
                < AuthFooter />
            </div>
        </div>
    )
}

export default AuthLayout