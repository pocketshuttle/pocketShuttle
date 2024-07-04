"use client"
import { signOut } from "next-auth/react"

const Home = async () => {

    return (
        <div className="text-red-600">



            <button onClick={() => signOut()}>signout</button>
        </div>
    )
}

export default Home