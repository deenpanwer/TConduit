/**
 * generateTemporalCollage: Client-side "Context Clustering".
 * Combines up to 16 images into a single temporal map.
 */
export async function generateTemporalCollage(urls: string[]): Promise<string> {
    if (!urls || urls.length === 0) return "";
    
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const size = 1024; // Balanced resolution
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject("Canvas context error");
  
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, size, size);
  
      let loadedCount = 0;
      const images: HTMLImageElement[] = [];
      const limit = Math.min(urls.length, 16);
      
      // Grid Math: Determine rows/cols (e.g., 4x4 for 16, 3x3 for 9)
      const cols = Math.ceil(Math.sqrt(limit)) || 1;
      const rows = Math.ceil(limit / cols) || 1;
      const cellW = size / cols;
      const cellH = size / rows;
  
      urls.slice(0, limit).forEach((url, i) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          images[i] = img;
          loadedCount++;
          if (loadedCount === limit) draw();
        };
        img.onerror = () => {
          loadedCount++;
          if (loadedCount === limit) draw();
        };
        img.src = url;
      });
  
      function draw() {
        if (!ctx) return;
        for (let i = 0; i < limit; i++) {
          const img = images[i];
          if (!img) continue;
          const x = (i % cols) * cellW;
          const y = Math.floor(i / cols) * cellH;
          
          // Use Math.min (contain) instead of Math.max (cover) to prevent cropping
          const ratio = Math.min(cellW / img.width, cellH / img.height);
          const nw = img.width * ratio;
          const nh = img.height * ratio;
          const nx = x + (cellW - nw) / 2;
          const ny = y + (cellH - nh) / 2;
          ctx.drawImage(img, 0, 0, img.width, img.height, nx, ny, nw, nh);
        }
        const base64 = canvas.toDataURL("image/jpeg", 0.8);
        resolve(base64);
      }
    });
  }
