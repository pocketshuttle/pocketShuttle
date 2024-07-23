import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"

export const AttendaceTab = () => {
    return (
        <Tabs defaultValue="account" className="w-[150px]">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="account" className="bg-[teal] text-gray-200">Present</TabsTrigger>
                <TabsTrigger value="password" className="bg-[crimson] text-gray-200" >Absent</TabsTrigger>
            </TabsList>
            <TabsContent value="account" >
            </TabsContent>
            <TabsContent value="password" >
            </TabsContent>
        </Tabs>
    )
}
