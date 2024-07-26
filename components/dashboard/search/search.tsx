"use client"
import { Input } from "@/components/ui/input"
import { usePathname, useSearchParams, useRouter } from "next/navigation"
import { ChangeEvent } from "react"

type SearchProps = {
    placeholder: string
    classname: string
}
export const Search = ({ placeholder, classname }: SearchProps) => {
    const searchParams = useSearchParams()
    const pathname = usePathname()
    const { replace } = useRouter()

    const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
        const params = new URLSearchParams(searchParams)
        if (e.target.value) {
            params.set("q", e.target.value)
        } else {
            params.delete("q")
        }

        replace(`${pathname}?${params}`)

    }
    return (
        <Input placeholder={placeholder} className={classname} onChange={handleSearch} />

    )
}