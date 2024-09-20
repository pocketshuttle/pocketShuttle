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
                <AccordionContent className="text-[0.7rem] text-gray-500">
                    1. To add Teachers, kindly click on the teachers tab by the left
                </AccordionContent>
                <AccordionContent className="text-[0.7rem] text-gray-500">
                    2. Click on the add teachers to the top right, and fill in the form
                </AccordionContent>
                <AccordionContent className="text-[0.7rem] text-gray-500">
                    NB. The image <strong>MUST</strong> completely load before submitting
                </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
                <AccordionTrigger>Buses</AccordionTrigger>
                <AccordionContent className="text-[0.7rem] text-gray-500">
                    NB. Please <strong>ADD</strong> routes before adding Buses
                </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
                <AccordionTrigger>Adding Student</AccordionTrigger>
                <AccordionContent className="text-[0.7rem] text-gray-500">
                    i. click on the add student button.
                </AccordionContent>
                <AccordionContent className="text-[0.7rem] text-gray-500">
                    ii. fill in the form, student image must display on the picture card before submitting.
                </AccordionContent>

                <AccordionContent className="text-[0.7rem] text-gray-500">
                    iii. add student to bus, this will make the student visible to teachers assigned to that bus.
                </AccordionContent>

                <AccordionContent className="text-[0.7rem] text-gray-500">
                    iv. to add student to a parent, go to the parent dashboard, select student, from the drop down menu, select the child.
                </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4">
                <AccordionTrigger>How to locate Drivers</AccordionTrigger>
                <AccordionContent className="text-[0.7rem] text-gray-500">
                    i. To locate drivers, kindly click on the teachers tab
                </AccordionContent>
                <AccordionContent className="text-[0.7rem] text-gray-500">
                    ii. Click on the drivers tab
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    )
}

export default NewsCard