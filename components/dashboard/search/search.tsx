"use client"
import { Input } from "@/components/ui/input"
import { usePathname, useSearchParams, useRouter } from "next/navigation"
import { ChangeEvent } from "react"
import { useDebouncedCallback } from "use-debounce"

type SearchProps = {
    placeholder: string
    classname: string
}
export const Search = ({ placeholder, classname }: SearchProps) => {
    const searchParams = useSearchParams()
    const pathname = usePathname()
    const { replace } = useRouter()

    const handleSearch = useDebouncedCallback((e: ChangeEvent<HTMLInputElement>) => {
        const params = new URLSearchParams(searchParams)
        //@ts-ignore
        params.set("page", 1)

        if (e.target.value) {
            e.target.value.length > 2 &&
                params.set("q", e.target.value)
        } else {
            params.delete("q")
        }

        replace(`${pathname}?${params}`)

    }, 300)
    return (
        <Input placeholder={placeholder} className={classname} onChange={handleSearch} />

    )
}