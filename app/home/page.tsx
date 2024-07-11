import { auth, signOut } from "@/auth"

const Home = async () => {
    const session = await auth()
    console.log(session)
    return (
        <div className="text-red-600">
            <button onClick={signOut()}>signout</button>
        </div>
    )
}

export default Home