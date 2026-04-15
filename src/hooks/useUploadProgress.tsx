'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface ActiveUpload {
    id: string;
    taskId?: string; // Optional taskId to filter progress by task
    name: string;
    type: string;
    size: number;
    progress: number;
    status: 'uploading' | 'processing' | 'done' | 'error';
}

interface UploadContextType {
    uploads: Record<string, ActiveUpload>;
    setUpload: (id: string, upload: Partial<ActiveUpload>) => void;
    removeUpload: (id: string) => void;
}

const UploadContext = createContext<UploadContextType>({ 
    uploads: {}, 
    setUpload: () => {}, 
    removeUpload: () => {} 
});

export function UploadProvider({ children }: { children: ReactNode }) {
    const [uploads, setUploads] = useState<Record<string, ActiveUpload>>({});

    const setUpload = (id: string, upload: Partial<ActiveUpload>) => {
        setUploads(prev => {
            const existing = prev[id] || { 
                id, name: '', type: '', size: 0, progress: 0, status: 'uploading' 
            };
            return {
                ...prev,
                [id]: { ...existing, ...upload } as ActiveUpload
            };
        });
    };

    const removeUpload = (id: string) => {
        setUploads(prev => {
            const { [id]: _, ...rest } = prev;
            return rest;
        });
    };

    return (
        <UploadContext.Provider value={{ uploads, setUpload, removeUpload }}>
            {children}
        </UploadContext.Provider>
    );
}

export const useUpload = () => useContext(UploadContext);
