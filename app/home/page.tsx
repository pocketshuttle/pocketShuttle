"use client"
import { signOut, useSession, } from "next-auth/react"

const Home = () => {
    const { data: session } = useSession()
   
    return (
        <div className="text-red-600">
            <button onClick={() => signOut()}>signout</button>
        </div>
    )
}

export default Home