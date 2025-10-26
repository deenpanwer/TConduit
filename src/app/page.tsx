"use client";

import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const [inputValue, setInputValue] = useState("");
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!inputValue.trim()) {
      return;
    }

    try {
      const response = await fetch("https://sheetdb.io/api/v1/q1xovvwyyhvv0", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ entry: inputValue }),
      });

      if (!response.ok) {
        let errorMessage = "Failed to submit data. Please try again.";
        try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
        } catch (jsonError) {
            errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }
      
      setInputValue("");
      toast({
        title: "Success!",
        description: "Your data has been submitted.",
      });
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : "An unknown error occurred.";
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: message,
      });
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-white">
      <div className="text-center">
        <h1 className="text-4xl mb-4 text-black font-serif">
          Kaayf
        </h1>
        <form onSubmit={handleSubmit}>
          <div>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="type here"
              aria-label="Data input"
              className="border border-black p-1 bg-white text-black"
            />
          </div>
        </form>
      </div>
      <Toaster />
    </main>
  );
}
