"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Search } from "lucide-react";

export default function Home() {
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("https://sheetdb.io/api/v1/q1xovvwyyhvv0", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: { entry: inputValue },
        }),
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
    } catch (error) {
      console.error(error);
      toast({
        title: "Submission Error",
        description:
          error instanceof Error
            ? error.message
            : "An unknown error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-lg text-center">
        <h1 className="text-5xl md:text-6xl font-headline font-bold mb-8">
          <span style={{ color: '#4285F4' }}>R</span>
          <span style={{ color: '#DB4437' }}>e</span>
          <span style={{ color: '#F4B400' }}>t</span>
          <span style={{ color: '#4285F4' }}>r</span>
          <span style={{ color: '#0F9D58' }}>o</span>
          <span style={{ color: '#DB4437' }}>S</span>
          <span className="text-foreground">heet</span>
        </h1>
        <form onSubmit={handleSubmit}>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Enter data and press Enter..."
              className="w-full text-base md:text-lg py-6 pl-12 pr-12 rounded-full shadow-md hover:shadow-lg focus:shadow-lg focus-visible:ring-primary/50 focus-visible:ring-2 transition-shadow duration-300 ease-in-out"
              disabled={isLoading}
              aria-label="Data input"
            />
            {isLoading && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2" aria-label="Loading">
                <svg className="animate-spin h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            )}
          </div>
        </form>
      </div>
    </main>
  );
}
