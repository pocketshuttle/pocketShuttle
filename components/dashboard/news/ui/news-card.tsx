import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"


const NewsCard = () => {
    return (
        <div className="rounded-md border border-[var(--text)] bg-[var(--bgSoft)] text-[var(--text)]">
            <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1" className="space-y-2 py-5  px-3 border-b-0 ">
                    <AccordionTrigger className="rounded-tl-md rounded-tr-md bg-[var(--hoverBg)] px-2"> How to add Teachers</AccordionTrigger>
                    <AccordionContent className="text-[0.7rem] text-[var(--text)]">
                        1. To add Teachers, kindly click on the teachers tab by the left
                    </AccordionContent>
                    <AccordionContent className="text-[0.7rem] text-[var(--text)]">
                        2. Click on the add teachers to the top right, and fill in the form
                    </AccordionContent>
                    <AccordionContent className="text-[0.7rem] text-[var(--text)]">
                        NB. The image <strong>MUST</strong> completely load before submitting
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2" className="space-y-2 py-2  px-3 border-b-0 ">
                    <AccordionTrigger className="rounded-tl-md rounded-tr-md bg-[var(--hoverBg)] px-2">Buses</AccordionTrigger>
                    <AccordionContent className="text-[0.7rem] text-[var(--text)]">
                        NB. Please <strong>ADD</strong> routes before adding Buses
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3" className="space-y-2 py-2  px-3 border-b-0 ">
                    <AccordionTrigger className="rounded-tl-md rounded-tr-md bg-[var(--hoverBg)] px-2">Adding Student</AccordionTrigger>
                    <AccordionContent className="text-[0.7rem] text-[var(--text)]">
                        i. click on the add student button.
                    </AccordionContent>
                    <AccordionContent className="text-[0.7rem] text-[var(--text)]">
                        ii. fill in the form, student image must display on the picture card before submitting.
                    </AccordionContent>

                    <AccordionContent className="text-[0.7rem] text-[var(--text)]">
                        iii. add student to bus, this will make the student visible to teachers assigned to that bus.
                    </AccordionContent>

                    <AccordionContent className="text-[0.7rem] text-[var(--text)]">
                        iv. to add student to a parent, go to the parent dashboard, select student, from the drop down menu, select the child.
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-4" className="space-y-2 py-2  px-3 border-b-0 ">
                    <AccordionTrigger className="rounded-tl-md rounded-tr-md bg-[var(--hoverBg)] px-2">How to locate Drivers</AccordionTrigger>
                    <AccordionContent className="text-[0.7rem] text-[var(--text)]">
                        i. To locate drivers, kindly click on the teachers tab
                    </AccordionContent>
                    <AccordionContent className="text-[0.7rem] text-[var(--text)]">
                        ii. Click on the drivers tab
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>

    )
}

export default NewsCard
