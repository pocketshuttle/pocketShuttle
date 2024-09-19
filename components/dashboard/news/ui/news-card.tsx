import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"


const NewsCard = () => {
    return (
        <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
                <AccordionTrigger>How to add Teachers</AccordionTrigger>
                <AccordionContent>
                    1. To add Teachers, kindly click on the teachers tab by the left
                </AccordionContent>
                <AccordionContent>
                    2. Click on the add teachers to the top right, and fill in the form
                </AccordionContent>
                <AccordionContent>
                    NB. The image <strong>MUST</strong> completely load before submitting
                </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
                <AccordionTrigger>Buses</AccordionTrigger>
                <AccordionContent>
                    NB. Please <strong>ADD</strong> routes before adding Buses
                </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
                <AccordionTrigger>Is it animated?</AccordionTrigger>
                <AccordionContent>
                    Yes. It&apos;s animated by default, but you can disable it if you
                    prefer.
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    )
}

export default NewsCard