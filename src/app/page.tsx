"use client";

import { useState } from "react";

export default function Home() {
  const [inputValue, setInputValue] = useState("");

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
        body: JSON.stringify({
          data: [{ entry: inputValue }],
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
      alert("Success! Your data has been submitted.");
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "An unknown error occurred.");
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-4xl mb-4">
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
              className="border border-black p-1"
            />
          </div>
        </form>
      </div>
    </main>
  );
}
