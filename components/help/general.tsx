import React from 'react'
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"

export const GeneralFAQ: React.FC = () => {
    return (
        <section className='bg-gray-50 text-gray-700 h-96'>
            <div className='flex items-center space-y-4 space-x-8'>
                <div className='w-3/6 space-y-3'>
                    <h1 className='text-2xl capitalize mb-2'>
                        General FAQs
                    </h1>
                    <p className='text-[0.7rem]'>
                        Everything you need to know about our products and how it works, can't find an answer, chat with our team at support@pocketshuttle.app
                    </p>
                </div>

                <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="item-1">
                        <AccordionTrigger>Is there a free trial available?</AccordionTrigger>
                        <AccordionContent className="text-[0.7rem] text-gray-500">
                            Yes, we are currently offering a free version until the end of the year. It's an incredibly powerful application that allows you to keep track of all your students, teachers, and buses, all in one app.
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-2">
                        <AccordionTrigger>What does the free version include?</AccordionTrigger>
                        <AccordionContent className="text-[0.7rem] text-gray-500">
                            i. Add, edit, delete: STUDENTS, TEACHERS, BUSES, DRIVERS, PARENTS
                        </AccordionContent>
                        <AccordionContent className="text-[0.7rem] text-gray-500">
                            ii. Track the location of all buses
                        </AccordionContent>
                        <AccordionContent className="text-[0.7rem] text-gray-500">
                            iii. Mark students present or absent, and also send this notification to parents
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </div>
        </section>
    )
}
