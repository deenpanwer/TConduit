import React from 'react';
import { Dialog, DialogContent, DialogOverlay } from "@/components/ui/dialog";
import { X, Download, Maximize2, ZoomIn, ZoomOut, RotateCcw, FileText, FileVideo, FileImage } from "lucide-react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  createdAt: any;
}

/**
 * Professional Image Previewer with Zoom, Pan, and Pinch support
 */
const ImagePreview = ({ url, name }: { url: string; name: string }) => {
  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-black/40">
      <TransformWrapper
        initialScale={1}
        minScale={0.5}
        maxScale={8}
        centerOnInit
        wheel={{ step: 0.1 }}
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-50 bg-background/20 backdrop-blur-xl border border-white/10 p-1.5 rounded-full shadow-2xl transition-all hover:bg-background/40">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-white" onClick={() => zoomIn()}><ZoomIn size={16} /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-white" onClick={() => zoomOut()}><ZoomOut size={16} /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-white" onClick={() => resetTransform()}><RotateCcw size={16} /></Button>
            </div>
            <TransformComponent wrapperClass="w-full h-full" contentClass="w-full h-full flex items-center justify-center">
              <motion.img 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                src={url} 
                alt={name} 
                className="max-w-[95%] max-h-[95%] object-contain select-none pointer-events-auto"
              />
            </TransformComponent>
          </>
        )}
      </TransformWrapper>
    </div>
  );
};

/**
 * Professional Video Player with styled container
 */
const VideoPreview = ({ url }: { url: string }) => {
  return (
    <div className="w-full h-full flex items-center justify-center bg-black">
      <video 
        src={url} 
        controls 
        autoPlay
        className="max-w-full max-h-full shadow-2xl"
      />
    </div>
  );
};

/**
 * PDF / Document Previewer
 */
const DocumentPreview = ({ url, type, name }: { url: string, type: string, name: string }) => {
  const isPdf = type === 'application/pdf';
  
  if (isPdf) {
    return (
      <iframe 
        src={`${url}#toolbar=0`} 
        className="w-full h-full border-none bg-white rounded-lg shadow-inner"
        title={name}
      />
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-6 text-white p-12 text-center bg-secondary/5 h-full w-full">
      <div className="w-24 h-24 rounded-3xl bg-primary/20 flex items-center justify-center mb-4">
        <FileText size={48} className="text-primary" />
      </div>
      <div className="space-y-2">
        <h3 className="text-xl font-bold">{name}</h3>
        <p className="text-sm text-white/40 uppercase tracking-widest">{type}</p>
      </div>
      <Button asChild className="mt-4 bg-primary hover:bg-primary/90 text-white font-bold uppercase tracking-widest rounded-xl px-8 py-6 h-auto shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]">
        <a href={url} download target="_blank">
          <Download className="mr-2" size={20} /> Download to View
        </a>
      </Button>
    </div>
  );
};

/**
 * Unified File Preview Modal
 */
export function FilePreviewModal({ 
    file, 
    isOpen, 
    onClose 
}: { 
    file: Attachment | null; 
    isOpen: boolean; 
    onClose: () => void; 
}) {
    if (!file) return null;

    const isImage = file.type?.startsWith('image/');
    const isVideo = file.type?.startsWith('video/') || file.name?.match(/\.(mp4|mov|avi|webm)$/i);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogOverlay className="bg-black/90 backdrop-blur-md fixed inset-0 z-[100]" />
            <DialogContent className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] max-w-[95vw] w-full h-[90vh] md:h-[85vh] p-0 overflow-hidden border border-white/10 bg-[#0a0a0a] shadow-3xl flex flex-col rounded-3xl outline-none">
                
                {/* Modal Header */}
                <div className="h-16 shrink-0 flex items-center justify-between px-6 bg-white/5 border-b border-white/5">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 rounded-lg bg-white/5 shrink-0">
                            {isImage ? <FileImage size={18} className="text-blue-400" /> : 
                             isVideo ? <FileVideo size={18} className="text-amber-400" /> : 
                             <FileText size={18} className="text-emerald-400" />}
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-sm font-bold text-white truncate max-w-[200px] md:max-w-md">{file.name}</span>
                            <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">
                                {(file.size / (1024 * 1024)).toFixed(2)} MB • {file.type.split('/')[1]}
                            </span>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full text-white/60 hover:text-white hover:bg-white/10" asChild>
                            <a href={file.url} download target="_blank"><Download size={20} /></a>
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-10 w-10 rounded-full text-white/60 hover:text-white hover:bg-white/10"
                            onClick={onClose}
                        >
                            <X size={20} />
                        </Button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 relative overflow-hidden">
                    <AnimatePresence mode="wait">
                        <motion.div 
                            key={file.id}
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.02 }}
                            className="w-full h-full"
                        >
                            {isImage ? (
                                <ImagePreview url={file.url} name={file.name} />
                            ) : isVideo ? (
                                <VideoPreview url={file.url} />
                            ) : (
                                <DocumentPreview url={file.url} type={file.type} name={file.name} />
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </DialogContent>
        </Dialog>
    );
}
