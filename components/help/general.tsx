import React from 'react'
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
export const FAQ = () => {
    return (
        <section className='p-4'>
            <div className='flex items-center space-y-4 space-x-8'>
                <div className='w-3/6 space-y-3'>

                    <h1 className='text-2xl capitalize mb-2'>
                        general FAQs
                    </h1>
                    <p className='text-[0.7rem]'>
                        Everything you need to know about our products and how it works, cant find an answer, chat our team support@pocketshuttle.app
                    </p>
                </div>


                <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="item-1">
                        <AccordionTrigger>Is there a free trial available</AccordionTrigger>
                        <AccordionContent className="text-[0.7rem] text-gray-500">
                            Yes, we re currently on a free version right now till the end of the year, its an incredibly powerful application that allows you to keep track of all your students, teachers, buses all in one app
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-2">
                        <AccordionTrigger>What does the free version include</AccordionTrigger>
                        <AccordionContent className="text-[0.7rem] text-gray-500">
                            i. add, edit, delete, STUDENTS, TEACHERS, BUSES, DRIVERS, PARENTS
                        </AccordionContent>
                        <AccordionContent className="text-[0.7rem] text-gray-500">
                            ii.Track the location of all buses
                        </AccordionContent>

                        <AccordionContent className="text-[0.7rem] text-gray-500">
                            iii. Mark students present and absent,also send this notification to parents
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

            </div>
        </section>
    )
}

