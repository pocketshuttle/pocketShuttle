import { Button } from "@/components/ui/button"
import { PlayIcon } from "@radix-ui/react-icons"

const NewsCard = () => {
    return (
        <div className="space-y-2 p-2 bg-[#182237] rounded-md shadow-md">
            <header className="text-sm">
                🔥 Available now
            </header>
            <section>
                <div>
                    <h1 className="text-sm font-semibold">How to use the new version of the admin dashboard</h1>
                    <span className="text-[0.6rem] text-gray-600">Takes 3min to learn</span>
                </div>
                <main className="text-[0.63rem]  text-gray-400 ">
                    Lorem ipsum, dolor sit amet consectetur adipisicing elit. Alias debitis vel cum numquam reiciendis fuga exercitationem maiores. Optio, natus dolorem ipsa mollitia pariatur iusto cum doloribus autem veritatis voluptates cupiditate quisquam
                </main>
                <footer className="mt-2">
                    <Button size={"lg"} className="gap-2"> <PlayIcon /> Watch now</Button>
                </footer>
            </section>
        </div>
    )
}

export default NewsCard