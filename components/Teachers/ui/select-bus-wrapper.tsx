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
    data: any
    classname: string
};

type dataProps = {
    _id: string
    bus_product_name: string | null
    bus_number: string
    classname?: string
}

export const SelectBusWrapper = ({ placeholder, label, data, handleSelectChange, classname }: SelectProps) => {
    console.log("data is from bus model", data)
    return (
        <Select onValueChange={handleSelectChange}>
            <SelectTrigger className={`${classname && classname}w-3/6`}>
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
                <SelectGroup>
                    <SelectLabel>{label}</SelectLabel>
                    {
                        data.map((item: dataProps, index: number) => (
                            <SelectItem key={item._id} value={JSON.stringify({ id: item._id, bus_product_name: item.bus_product_name })}>
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

