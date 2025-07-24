import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

type SelectProps = {
    placeholder: string;
    label?: string;
    handleSelectChange: (value: string) => void;
    data: dataProps[]
    classname: string
    edit?: EditProps
};

type dataProps = {
    id: string
    bus_product_name: string | null
    bus_number: string
    classname?: string
}
type EditProps = {
    bus_product_name: string
    bus_number: string
}

export const SelectBusWrapper = ({ placeholder, label, data, handleSelectChange, classname, edit }: SelectProps) => {
    return (
        <Select onValueChange={handleSelectChange}>
            <SelectTrigger className={`${classname && classname} w-full text-gray-100`}>
                <SelectValue placeholder={placeholder}
                />
            </SelectTrigger>
            <SelectContent>
                <SelectGroup>
                    <SelectLabel>{label}</SelectLabel>
                    {
                        data && data?.map((item: dataProps, index: number) => (
                            <SelectItem key={item.id} value={JSON.stringify({ id: item.id, bus_product_name: item.bus_product_name })}>
                                <div className="space-x-1">
                                    <span>
                                        {item.bus_product_name}
                                    </span>
                                    <span>
                                        ({item.bus_number})
                                    </span>
                                </div>
                            </SelectItem>
                        ))
                    }
                </SelectGroup>
            </SelectContent>
        </Select>
    );
};

