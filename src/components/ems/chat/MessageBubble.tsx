"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { cn, getUserAvatar } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { WaveformPlayer } from "./WaveformPlayer";
import { FileText, Download, X, Eye } from "lucide-react";

export interface ChatMessage {
  id?: string;
  senderId: string;
  senderName?: string;
  text: string;
  timestamp: any; // Firebase Timestamp
  type?: "text" | "image" | "video" | "audio" | "file";
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
}

interface MessageBubbleProps {
  message: ChatMessage;
  isCurrentUserSender: boolean;
  senderAvatarUrl: string;
  senderName: string;
}

export function MessageBubble({ message, isCurrentUserSender, senderAvatarUrl, senderName }: MessageBubbleProps) {
  const [showLightbox, setShowLightbox] = useState(false);
  const [previewText, setPreviewText] = useState<string | null>(null);
  const [loadingText, setLoadingText] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const time = message.timestamp?.toDate ? format(message.timestamp.toDate(), "p") : "";
  const msgType = message.type || "text";

  useEffect(() => {
    if (showLightbox && msgType === "file" && message.fileUrl) {
      const fileName = message.fileName || "";
      const ext = fileName.split(".").pop()?.toLowerCase() || "";
      const isTextFile = ["csv", "txt", "log", "json", "md", "xml", "js", "ts", "html"].includes(ext);
      
      if (isTextFile) {
        setLoadingText(true);
        setPreviewText(null);
        fetch(message.fileUrl)
          .then((res) => {
            if (!res.ok) throw new Error("Failed to fetch file content");
            return res.text();
          })
          .then((text) => {
            if (text.length > 50000) {
              setPreviewText(text.substring(0, 50000) + "\n\n... [Truncated for preview size] ...");
            } else {
              setPreviewText(text);
            }
          })
          .catch((err) => {
            console.error(err);
            setPreviewText("Error loading preview content. You can download the file to open it on your machine.");
          })
          .finally(() => {
            setLoadingText(false);
          });
      }
    }
  }, [showLightbox, msgType, message.fileUrl, message.fileName]);

  // Helper to format file sizes nicely
  const formatBytes = (bytes?: number, decimals = 1) => {
    if (!bytes) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  const isSystemMsg = message.senderId === "system";

  if (isSystemMsg) {
    return (
      <div className="flex justify-center my-4 animate-in fade-in duration-300">
        <span className="px-3.5 py-1.5 rounded-full bg-secondary/40 text-[10px] font-bold text-muted-foreground/80 border border-border/10 uppercase tracking-widest text-center shadow-inner">
          {message.text}
        </span>
      </div>
    );
  }

  return (
    <>
      <div
        className={cn(
          "flex gap-3 mb-1.5 animate-in fade-in slide-in-from-bottom-2 duration-300",
          isCurrentUserSender ? "flex-row-reverse" : "flex-row"
        )}
      >
        {/* User profile avatar bubble */}
        <div className="flex-shrink-0 self-end mb-1">
          <Avatar className="h-8 w-8 border border-border/50 shadow-sm transition-all hover:scale-105">
            <AvatarImage src={senderAvatarUrl} alt={senderName} />
            <AvatarFallback className="text-[10px] font-bold">{senderName?.charAt(0) || "?"}</AvatarFallback>
          </Avatar>
        </div>

        {/* Core message bubble block */}
        <div
          className={cn(
            "max-w-[75%] flex flex-col group",
            isCurrentUserSender ? "items-end" : "items-start"
          )}
        >
          {/* Display sender's name for group chats if not current user */}
          {!isCurrentUserSender && message.senderName && (
            <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-1 ml-1.5">
              {message.senderName}
            </span>
          )}

          {/* DYNAMIC CONTENT RENDERING BY MESSAGE TYPE */}
          <div
            className={cn(
              "shadow-sm transition-all duration-200 overflow-hidden relative",
              // Style variables depending on type and sender
              msgType === "text"
                ? "px-4 pt-2.5 pb-5 pr-14 rounded-2xl"
                : msgType === "file"
                  ? "px-4 py-2.5 rounded-2xl"
                  : "rounded-2xl",
              
              isCurrentUserSender
                ? msgType === "text" || msgType === "file"
                  ? "bg-[#e2f7db] dark:bg-[#0b5446] text-slate-850 dark:text-emerald-50 rounded-2xl rounded-tr-none border border-emerald-100/30 dark:border-emerald-900/20"
                  : "rounded-tr-none"
                : msgType === "text" || msgType === "file"
                  ? "bg-white dark:bg-slate-800 text-slate-850 dark:text-slate-105 rounded-2xl rounded-tl-none border border-slate-200/60 dark:border-slate-700/40"
                  : "rounded-tl-none"
            )}
          >
            {/* 1. TEXT MESSAGE TYPE */}
            {msgType === "text" && (
              <>
                <p className="text-sm leading-relaxed font-medium whitespace-pre-wrap pr-1">{message.text}</p>
                <div className="absolute bottom-1.5 right-2.5 flex items-center gap-1 text-[9px] text-muted-foreground/65 dark:text-emerald-300/60 select-none">
                  <span>{time}</span>
                  {isCurrentUserSender && (
                    <svg className="h-3.5 w-3.5 text-sky-500 fill-current" viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                  )}
                </div>
              </>
            )}

            {/* 2. IMAGE MESSAGE TYPE */}
            {msgType === "image" && message.fileUrl && (
              <div className="relative group/img cursor-pointer overflow-hidden rounded-2xl border border-border/10 aspect-video max-w-[280px] bg-secondary/15 flex items-center justify-center">
                <img
                  src={message.fileUrl}
                  alt={message.fileName || "Shared image"}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover/img:scale-105"
                  onClick={() => setShowLightbox(true)}
                  loading="lazy"
                />
                <div 
                  onClick={() => setShowLightbox(true)}
                  className="absolute inset-0 bg-black/45 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity"
                >
                  <Eye className="h-5 w-5 text-white stroke-[2.5]" />
                </div>
              </div>
            )}

            {/* 3. VIDEO MESSAGE TYPE */}
            {msgType === "video" && message.fileUrl && (
              <div className="max-w-[280px] rounded-2xl overflow-hidden border border-border/10 bg-black/5 shadow-inner">
                <video
                  src={message.fileUrl}
                  controls
                  preload="metadata"
                  className="w-full object-contain max-h-[220px]"
                />
              </div>
            )}

            {/* 4. AUDIO / VOICE NOTE TYPE */}
            {msgType === "audio" && message.fileUrl && (
              <WaveformPlayer
                src={message.fileUrl}
                isCurrentUserSender={isCurrentUserSender}
              />
            )}

            {/* 5. GENERIC FILE ATTACHMENT TYPE */}
            {msgType === "file" && message.fileUrl && (
              <div 
                onClick={() => setShowLightbox(true)}
                className="flex items-center gap-3 w-[260px] p-1 cursor-pointer select-none group/file"
              >
                <div className={`p-2.5 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover/file:scale-105 ${
                  isCurrentUserSender ? "bg-primary-foreground/15 text-primary-foreground" : "bg-primary/10 text-primary"
                }`}>
                  <FileText className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-xs font-bold truncate leading-snug group-hover/file:underline">{message.fileName || "document"}</p>
                  <p className={`text-[9px] font-bold mt-0.5 tracking-tight uppercase opacity-75`}>
                    {formatBytes(message.fileSize)}
                  </p>
                </div>
                <a
                  href={message.fileUrl}
                  download={message.fileName || "download"}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className={`p-2 rounded-xl transition-all duration-200 active:scale-90 shrink-0 ${
                    isCurrentUserSender
                      ? "hover:bg-primary-foreground/15 text-primary-foreground"
                      : "hover:bg-secondary border border-border/20 text-foreground"
                  }`}
                >
                  <Download className="h-4 w-4" />
                </a>
              </div>
            )}
          </div>
          
          {/* Timestamp for non-text messages */}
          {msgType !== "text" && (
            <span className={cn(
              "text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50 mt-1 px-1 transition-opacity",
              isCurrentUserSender ? "text-right" : "text-left"
            )}>
              {time}
            </span>
          )}
        </div>
      </div>

      {/* FULL SCREEN MULTI-FORMAT FILE PREVIEW MODAL */}
      {mounted && showLightbox && message.fileUrl && createPortal(
        (() => {
          const ext = message.fileName?.split(".").pop()?.toLowerCase() || "";
          const isTextFile = ["csv", "txt", "log", "json", "md", "xml", "js", "ts", "html"].includes(ext);

          return (
            <div className="fixed inset-0 z-55 flex flex-col items-center justify-center bg-black/95 backdrop-blur-md animate-in fade-in duration-300">
              {/* Modal Controls Header */}
              <div className="absolute top-4 right-4 flex items-center gap-2 z-50">
                <a
                  href={message.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white active:scale-95 transition-all shadow-md flex items-center gap-1.5 text-xs font-bold"
                  title="Open in Another Tab"
                >
                  <Eye className="h-4 w-4" /> <span className="hidden sm:inline">Open in Tab</span>
                </a>
                <a
                  href={message.fileUrl}
                  download={message.fileName || "download"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white active:scale-95 transition-all shadow-md flex items-center gap-1.5 text-xs font-bold"
                  title="Download File"
                >
                  <Download className="h-4 w-4" /> <span className="hidden sm:inline">Download</span>
                </a>
                <button
                  onClick={() => setShowLightbox(false)}
                  className="p-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white active:scale-95 transition-all shadow-md"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Dynamic Viewer Body */}
              <div className="max-w-[95%] max-h-[85%] overflow-hidden rounded-2xl shadow-2xl border border-white/10 flex items-center justify-center">
                {msgType === "image" && (
                  <img
                    src={message.fileUrl}
                    alt={message.fileName || "Lightbox image"}
                    className="max-w-full max-h-[75vh] object-contain animate-in zoom-in-95 duration-300"
                  />
                )}

                {msgType === "video" && (
                  <video
                    src={message.fileUrl}
                    controls
                    autoPlay
                    className="max-w-full max-h-[75vh] object-contain rounded-xl shadow-2xl"
                  />
                )}

                {msgType === "audio" && (
                  <div className="bg-slate-900/80 p-8 rounded-3xl flex flex-col items-center justify-center gap-4 w-[360px] border border-white/10 shadow-2xl">
                    <div className="p-3 bg-red-500/10 rounded-2xl text-red-500 animate-pulse">
                      <FileText className="h-10 w-10" />
                    </div>
                    <p className="text-xs font-bold text-white">Voice Note Player</p>
                    <audio src={message.fileUrl} controls autoPlay className="w-full mt-2" />
                  </div>
                )}

                {msgType === "file" && (() => {
                  if (ext === "pdf") {
                    return (
                      <iframe
                        src={message.fileUrl}
                        className="w-[85vw] max-w-[1000px] h-[70vh] rounded-2xl border border-white/10 shadow-2xl bg-white"
                      />
                    );
                  }

                  if (isTextFile) {
                    return (
                      <div className="w-[85vw] max-w-[800px] h-[65vh] rounded-2xl bg-slate-950 text-slate-100 p-6 font-mono text-xs overflow-auto text-left border border-white/10 shadow-2xl scrollbar-thin">
                        {loadingText ? (
                          <div className="flex h-full flex-col items-center justify-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-primary animate-ping" />
                            <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] mt-2">Loading preview content...</span>
                          </div>
                        ) : (
                          <pre className="whitespace-pre-wrap leading-relaxed select-text">{previewText || "No content available in document."}</pre>
                        )}
                      </div>
                    );
                  }

                  if (["docx", "doc", "xlsx", "xls", "pptx", "ppt"].includes(ext)) {
                    return (
                      <iframe
                        src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(message.fileUrl || "")}`}
                        className="w-[85vw] max-w-[1100px] h-[75vh] rounded-2xl border border-white/10 shadow-2xl bg-white"
                        frameBorder="0"
                      />
                    );
                  }

                  // Default Fallback file card
                  return (
                    <div className="bg-slate-900/80 p-8 rounded-3xl flex flex-col items-center justify-center gap-4 w-[380px] border border-white/10 shadow-2xl">
                      <div className="p-4 bg-primary/10 rounded-2xl text-primary animate-bounce">
                        <FileText className="h-10 w-10" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold text-white max-w-[280px] truncate leading-normal">{message.fileName || "Document"}</p>
                        <p className="text-xs text-white/50 font-bold uppercase tracking-wider mt-1">{formatBytes(message.fileSize)}</p>
                      </div>
                      <div className="flex flex-col gap-2.5 w-full mt-4">
                        <a
                          href={message.fileUrl}
                          download={message.fileName || "download"}
                          className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs text-center hover:bg-primary/95 active:scale-98 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                        >
                          <Download className="h-4 w-4" /> Download File
                        </a>
                        <a
                          href={message.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-2.5 rounded-xl bg-white/10 text-white font-bold text-xs text-center hover:bg-white/15 active:scale-98 transition-all flex items-center justify-center gap-2"
                        >
                          Open in Browser Tab
                        </a>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {message.fileName && (
                <p className="text-white/60 font-bold uppercase tracking-widest text-[10px] mt-4 max-w-[80%] truncate">
                  {message.fileName}
                </p>
              )}
            </div>
          );
        })(),
        document.body
      )}
    </>
  );
}
