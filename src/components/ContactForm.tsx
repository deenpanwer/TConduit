
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
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactInfo.trim()) {
      toast({
        variant: "destructive",
        title: "Contact info is required.",
        description: "Please enter an email or phone number.",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("https://sheetdb.io/api/v1/q1xovvwyyhvv0", {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: [{ 
            contact_info: contactInfo,
            time: new Date().toISOString(),
          }],
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit contact information.");
      }

      setSubmitted(true);
      toast({
        title: "Information Received",
        description: "We will be in touch shortly.",
      });

    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : "An unknown error occurred.";
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: message,
      });
    } finally {
      setIsLoading(false);
    }
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
            disabled={isLoading}
          />
        </div>
        <Button type="submit" className="w-full rounded-none" disabled={isLoading}>
          {isLoading ? "Submitting..." : "Submit"}
        </Button>
      </form>
      <Toaster />
    </>
  );
}
