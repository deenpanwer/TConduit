'use client';

import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

export function TrackerFAQ() {
  return (
    <section className="py-24 bg-background border-t-2 border-foreground">
      <div className="container mx-auto px-4 max-w-4xl">
        <h2 className="text-4xl font-black font-poppins uppercase leading-none mb-12 text-center">
            Questions? <span className="text-muted-foreground">Answered.</span>
        </h2>

        <Accordion type="single" collapsible className="w-full space-y-4">
          
          <AccordionItem value="item-1" className="border-2 border-foreground px-4 bg-muted/20 data-[state=open]:bg-background transition-colors">
            <AccordionTrigger className="font-bold text-lg font-poppins hover:no-underline">
                Does it work on Mac and Windows?
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground text-base">
                Yes. We support Windows, macOS, and Linux. Your team can download the silent tracker for any platform and it works identically.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-2" className="border-2 border-foreground px-4 bg-muted/20 data-[state=open]:bg-background transition-colors">
            <AccordionTrigger className="font-bold text-lg font-poppins hover:no-underline">
                Do employees know they are being tracked?
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground text-base">
                Yes. Transparency is key. Employees click "Start" to begin tracking and "Stop" to end it. They are fully aware when their time is being logged and when screenshots are taken.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-3" className="border-2 border-foreground px-4 bg-muted/20 data-[state=open]:bg-background transition-colors">
            <AccordionTrigger className="font-bold text-lg font-poppins hover:no-underline">
                How hard is the setup?
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground text-base">
                It takes about 1 hour to deploy to a team of 10. You sign up, invite them via email, and they install the app. Data starts flowing immediately.
            </AccordionContent>
          </AccordionItem>

           <AccordionItem value="item-4" className="border-2 border-foreground px-4 bg-muted/20 data-[state=open]:bg-background transition-colors">
            <AccordionTrigger className="font-bold text-lg font-poppins hover:no-underline">
                Can I see their screen in real-time?
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground text-base">
                Yes. The "Live Monitor" feature allows you to see active screens with a refresh rate of ~10 seconds, giving you a near real-time view of workforce activity.
            </AccordionContent>
          </AccordionItem>

        </Accordion>
      </div>
    </section>
  );
}
