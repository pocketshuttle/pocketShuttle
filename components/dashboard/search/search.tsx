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
        params.set("q", e.target.value)

        replace(`${pathname}?${params}`)

    }
    return (
        <Input placeholder={placeholder} className={classname} onChange={handleSearch} />

    )
}