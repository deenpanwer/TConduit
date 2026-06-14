"use client";

import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import { LegalSidebar } from "@/components/legal-sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Navbar } from "@/components/home/Navbar";
import { Footer } from "@/components/home/Footer";

export default function LegalDocPage() {
  const params = useParams();
  const slug = params.slug as string;
  
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      if (!slug) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/legal?doc=${slug}`);
        if (res.ok) {
            const text = await res.text();
            setContent(text);
        } else {
            setContent("# 404 Not Found\n\nThe requested legal document could not be found.");
        }
      } catch (e) {
        setContent("# Error\n\nFailed to load document.");
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [slug]);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex-1 flex flex-col lg:flex-row bg-background font-poppins">
        <LegalSidebar />

        <main className="flex-1 w-full max-w-5xl mx-auto p-6 lg:p-12 lg:px-20">
          {/* Mobile Back Link */}
          <div className="lg:hidden mb-10">
              <Link href="/legal" className="text-sm font-bold text-primary flex items-center gap-1 hover:underline">
                  <ChevronLeft className="w-4 h-4" /> Back to Legal Center
              </Link>
          </div>

          {loading ? (
              <div className="space-y-8 max-w-3xl">
                  <Skeleton className="h-12 w-3/4" />
                  <div className="space-y-4">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-5/6" />
                  </div>
              </div>
          ) : (
              <article className="prose prose-lg dark:prose-invert max-w-none 
                  prose-headings:font-poppins prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-foreground
                  prose-h1:text-4xl prose-h1:mb-10 prose-h1:lg:text-5xl
                  prose-h2:text-2xl prose-h2:mt-16 prose-h2:mb-6 prose-h2:border-b prose-h2:pb-4 prose-h2:text-primary
                  prose-h3:text-xl prose-h3:mt-10 prose-h3:mb-4
                  prose-p:text-muted-foreground dark:prose-p:text-slate-400 prose-p:leading-8 prose-p:mb-6
                  prose-a:text-primary prose-a:font-semibold prose-a:no-underline hover:prose-a:underline
                  prose-strong:text-foreground prose-strong:font-bold
                  prose-ul:list-disc prose-ul:pl-6 prose-ul:mb-6
                  prose-li:text-muted-foreground dark:prose-li:text-slate-400 prose-li:mb-2
                  prose-table:border-collapse prose-table:w-full prose-table:my-10 prose-table:text-sm
                  prose-th:bg-muted/50 prose-th:p-4 prose-th:text-foreground prose-th:font-bold prose-th:border prose-th:border-border
                  prose-td:p-4 prose-td:border prose-td:border-border prose-td:text-muted-foreground
              ">
                  <ReactMarkdown 
                      rehypePlugins={[rehypeRaw]} 
                      remarkPlugins={[remarkGfm]}
                  >
                      {content}
                  </ReactMarkdown>
              </article>
          )}
        </main>
      </div>
      <Footer />
    </div>
  );
}
