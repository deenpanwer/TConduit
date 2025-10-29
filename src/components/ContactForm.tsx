
"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";

export function ContactForm() {
  const [contactInfo, setContactInfo] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactInfo.trim()) {
      toast({
        variant: "destructive",
        title: "Contact info is required.",
        description: "Please enter an email or phone number.",
      });
      return;
    }
    // For now, we'll just log it and show a success state.
    console.log("Contact Info Submitted:", contactInfo);
    setSubmitted(true);
    toast({
      title: "Information Received",
      description: "We will be in touch shortly.",
    });
  };

  if (submitted) {
    return (
      <div className="text-center">
        <p className="text-lg font-medium">Thank you!</p>
        <p className="text-sm text-muted-foreground">We've received your contact information.</p>
      </div>
    );
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid w-full items-center gap-1.5 text-left">
          <Label htmlFor="contact">Contact</Label>
          <Input
            type="text"
            id="contact"
            placeholder="Email or Phone Number"
            value={contactInfo}
            onChange={(e) => setContactInfo(e.target.value)}
            className="rounded-none"
          />
        </div>
        <Button type="submit" className="w-full rounded-none">
          Submit
        </Button>
      </form>
      <Toaster />
    </>
  );
}
