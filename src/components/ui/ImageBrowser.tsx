"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Search, Sparkles, Loader2, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Button } from "./button";

const UNSPLASH_ACCESS_KEY = "tClh7HvV07Or7Z4uv4_DFgcXNtOWwL87O8xxZlc4KUQ";

interface UnsplashImage {
  id: string;
  urls: {
    regular: string;
    small: string;
    thumb: string;
  };
  alt_description: string;
  user: {
    name: string;
  };
}

interface ImageBrowserProps {
  query: string;
  onSelect: (url: string) => void;
  selectedUrl?: string | null;
}

export function ImageBrowser({ query, onSelect, selectedUrl }: ImageBrowserProps) {
  const [images, setImages] = useState<UnsplashImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length > 2) {
        setDebouncedQuery(query);
        setPage(1); // Reset to page 1 on new query
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [query]);

  const fetchImages = useCallback(async (searchQuery: string, pageNum: number) => {
    if (!searchQuery) return;
    setLoading(true);
    try {
      const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchQuery)}&per_page=8&page=${pageNum}&client_id=${UNSPLASH_ACCESS_KEY}`
      );
      const data = await response.json();
      setImages(data.results || []);
    } catch (error) {
      console.error("Unsplash error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debouncedQuery) {
      fetchImages(debouncedQuery, page);
    }
  }, [debouncedQuery, page, fetchImages]);

  if (!debouncedQuery && images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-border rounded-2xl bg-secondary/10">
        <Sparkles className="h-8 w-8 text-muted-foreground/40 mb-2" />
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Type a product name to see suggestions</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3 w-3 text-primary animate-pulse" />
          <span className="text-[9px] font-black uppercase tracking-widest">Magic Suggestions (Page {page})</span>
        </div>
        <div className="flex items-center gap-1">
          <Button 
            type="button" 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6" 
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
          >
            <ChevronLeft size={14} />
          </Button>
          <Button 
            type="button" 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6" 
            onClick={() => setPage(p => p + 1)}
            disabled={images.length < 8 || loading}
          >
            <ChevronRight size={14} />
          </Button>
          {loading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground ml-1" />}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {images.map((img) => {
          const isSelected = selectedUrl === img.urls.regular;
          return (
            <button
              key={img.id}
              type="button"
              onClick={() => onSelect(img.urls.regular)}
              className={cn(
                "group relative aspect-square rounded-xl overflow-hidden transition-all duration-500 transform active:scale-95",
                isSelected 
                  ? "ring-2 ring-primary ring-offset-2 ring-offset-background grayscale-0 scale-100 opacity-100" 
                  : "grayscale opacity-40 hover:grayscale-0 hover:opacity-100 hover:scale-[1.02] border border-transparent hover:border-primary/30"
              )}
            >
              <img
                src={img.urls.small}
                alt={img.alt_description}
                className="w-full h-full object-cover"
              />
              <div className={cn(
                "absolute inset-0 bg-primary/10 transition-opacity",
                isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-20"
              )} />
              {isSelected && (
                <div className="absolute inset-0 flex items-center justify-center bg-primary/20 backdrop-blur-[2px]">
                  <Check className="h-6 w-6 text-white drop-shadow-md" />
                </div>
              )}
            </button>
          );
        })}
      </div>
      <p className="text-[8px] text-muted-foreground font-bold uppercase tracking-tighter">
        Photos via Unsplash • Premium Catalog Quality
      </p>
    </div>
  );
}
