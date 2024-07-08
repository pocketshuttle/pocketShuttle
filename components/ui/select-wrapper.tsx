import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

type SelectProps = {
    item?: string | undefined
    placeholder: string
    label?: string

}

export const SelectProperty = ({ item, placeholder, label }: SelectProps) => {
    return (
        <Select>
            <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
                <SelectGroup>
                    <SelectLabel>{label}</SelectLabel>
                    <SelectItem value={item}>{item}</SelectItem>
                    <SelectItem value={item}>{item}</SelectItem>
                </SelectGroup>
            </SelectContent>
        </Select>
    )
}
