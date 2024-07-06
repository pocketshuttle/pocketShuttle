import { Input } from "@/components/ui/input"

type SearchProps = {
    placeholder: string
    classname: string
}
export const Search = ({ placeholder, classname }: SearchProps) => {
    return (
        <Input placeholder={placeholder} className={classname} />

    )
}