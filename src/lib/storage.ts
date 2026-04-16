
"use client";

type StorageEventCallback = (data: any) => void;

class StorageService {
  private listeners: Map<string, Set<StorageEventCallback>> = new Map();

  constructor() {
    if (typeof window !== "undefined") {
      window.addEventListener("storage", (event) => {
        if (event.key && event.key.startsWith("tconduit:")) {
          const collection = event.key.replace("tconduit:", "");
          this.notify(collection, this.getCollection(collection));
        }
      });
    }
  }

  private getFullKey(collection: string): string {
    return `tconduit:${collection}`;
  }

  getCollection<T>(collection: string): T[] {
    if (typeof window === "undefined") return [];
    const data = localStorage.getItem(this.getFullKey(collection));
    return data ? JSON.parse(data) : [];
  }

  saveCollection<T>(collection: string, data: T[]): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(this.getFullKey(collection), JSON.stringify(data));
    this.notify(collection, data);
  }

  getItem<T>(collection: string, id: string): T | undefined {
    const items = this.getCollection<any>(collection);
    return items.find((item) => item.id === id);
  }

  saveItem<T extends { id: string }>(collection: string, item: T): void {
    const items = this.getCollection<T>(collection);
    const index = items.findIndex((i) => i.id === item.id);
    if (index !== -1) {
      items[index] = item;
    } else {
      items.push(item);
    }
    this.saveCollection(collection, items);
  }

  deleteItem(collection: string, id: string): void {
    const items = this.getCollection<any>(collection);
    const filtered = items.filter((item) => item.id !== id);
    this.saveCollection(collection, filtered);
  }

  onSnapshot<T>(collection: string, callback: (data: T[]) => void): () => void {
    if (!this.listeners.has(collection)) {
      this.listeners.set(collection, new Set());
    }
    this.listeners.get(collection)!.add(callback);
    
    // Initial call
    callback(this.getCollection<T>(collection));

    return () => {
      this.listeners.get(collection)?.delete(callback);
    };
  }

  private notify(collection: string, data: any): void {
    this.listeners.get(collection)?.forEach((callback) => callback(data));
  }

  clearAll(): void {
    if (typeof window === "undefined") return;
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("tconduit:")) {
        localStorage.removeItem(key);
      }
    });
    this.listeners.forEach((_, collection) => this.notify(collection, []));
  }
}

export const storage = new StorageService();
