"use client";

import React, { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";

interface Dot {
  baseX: number;
  baseY: number;
  x: number;
  y: number;
  alpha: number;
  size: number;
  brightness: number;
}

interface Shockwave {
  x: number;
  y: number;
  start: number;
}

export const TracCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();
  const dots = useRef<Dot[]>([]);
  const mouse = useRef({ x: -1000, y: -1000, active: false });
  const shockwaves = useRef<Shockwave[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const CONFIG = {
      gridSize: 205,
      dotSpacing: 1.05,
      mouseRadius: 95,
      mouseStrength: 40,
      snapBackSpeed: 0.12,
      shockwaveSpeed: 0.007,
      shockwaveWidth: 40,
      colors: {
        dotBase: { r: 0, g: 0, b: 0 },
        dotDeep: { r: 0, g: 0, b: 0 },
        hoverGlow: { r: 80, g: 120, b: 255 }
      }
    };

    let width = 450;
    let height = 450;

    const isInsideLogo = (x: number, y: number) => {
      const cx = 102.5, cy = 102.5;
      const relX = x - cx;
      const relY = y - cy;
      
      // The Squircle shape (r=88)
      const dist = Math.pow(Math.abs(relX), 4) + Math.pow(Math.abs(relY), 4);
      const inSquircle = dist < Math.pow(88, 4);
      
      // The "T" cutout
      const isTBar = (relX > -45 && relX < 45 && relY > -50 && relY < -25);
      const isTStem = (relX > -12 && relX < 12 && relY > -25 && relY < 50);
      const inT = isTBar || isTStem;

      return inSquircle && !inT;
    };

    const init = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);

      dots.current = [];
      const scale = width / CONFIG.gridSize;

      for (let i = 0; i < CONFIG.gridSize; i += CONFIG.dotSpacing) {
        for (let j = 0; j < CONFIG.gridSize; j += CONFIG.dotSpacing) {
          if (isInsideLogo(i, j)) {
            const lightDist = Math.hypot(i - 40, j - 40);
            const brightness = Math.max(0, 1 - lightDist / 220);

            dots.current.push({
              baseX: i * scale,
              baseY: j * scale,
              x: i * scale,
              y: j * scale,
              size: 2.15,
              brightness: brightness,
              alpha: 0.15 + (brightness * 0.75) + (Math.random() * 0.1)
            });
          }
        }
      }
    };

    init();

    let animationFrameId: number;

    const loop = () => {
      const now = performance.now();
      ctx.clearRect(0, 0, width, height);
      const offset = 0.25;

      shockwaves.current = shockwaves.current.filter(s => now - s.start < 900);

      dots.current.forEach((dot) => {
        let dx = mouse.current.x - dot.x;
        let dy = mouse.current.y - dot.y;
        let dist = Math.sqrt(dx * dx + dy * dy);

        let targetX = dot.baseX;
        let targetY = dot.baseY;

        // Interaction Displacement
        if (dist < CONFIG.mouseRadius && mouse.current.active) {
          let power = Math.pow(1 - dist / CONFIG.mouseRadius, 2.5);
          targetX -= (dx / dist) * power * CONFIG.mouseStrength;
          targetY -= (dy / dist) * power * CONFIG.mouseStrength;
        }

        // Shockwaves
        shockwaves.current.forEach((s) => {
          let sdx = dot.x - s.x;
          let sdy = dot.y - s.y;
          let sdist = Math.sqrt(sdx * sdx + sdy * sdy);
          let elapsed = now - s.start;
          let waveRadius = elapsed * CONFIG.shockwaveSpeed * width;
          
          let diff = Math.abs(sdist - waveRadius);
          if (diff < CONFIG.shockwaveWidth) {
            let wavePower = (1 - diff / CONFIG.shockwaveWidth) * (1 - elapsed / 900) * 40;
            targetX += (sdx / sdist) * wavePower;
            targetY += (sdy / sdist) * wavePower;
          }
        });

        dot.x += (targetX - dot.x) * CONFIG.snapBackSpeed;
        dot.y += (targetY - dot.y) * CONFIG.snapBackSpeed;

        // Colors
        let r = Math.floor(CONFIG.colors.dotBase.r - (CONFIG.colors.dotBase.r - CONFIG.colors.dotDeep.r) * dot.brightness);
        let g = Math.floor(CONFIG.colors.dotBase.g - (CONFIG.colors.dotBase.g - CONFIG.colors.dotDeep.g) * dot.brightness);
        let b = Math.floor(CONFIG.colors.dotBase.b - (CONFIG.colors.dotBase.b - CONFIG.colors.dotDeep.b) * dot.brightness);
        
        if (mouse.current.active) {
          let hdx = mouse.current.x - dot.x;
          let hdy = mouse.current.y - dot.y;
          let hdist = Math.sqrt(hdx * hdx + hdy * hdy);
          let hoverEffect = Math.max(0, 1 - hdist / 50);
          
          if (hoverEffect > 0) {
            r = Math.max(0, r - hoverEffect * 50);
            g = Math.max(0, g - hoverEffect * 20);
            b = Math.min(255, b + hoverEffect * 100);
          }
        }

        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${dot.alpha})`;
        ctx.fillRect(dot.x - offset, dot.y - offset, dot.size + 0.5, dot.size + 0.5);
      });

      animationFrameId = requestAnimationFrame(loop);
    };

    loop();

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        active: true
      };
    };

    const handleMouseDown = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      shockwaves.current.push({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        start: performance.now()
      });
    };

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mouseleave", () => { mouse.current.active = false; });
    window.addEventListener("resize", init);

    return () => {
      cancelAnimationFrame(animationFrameId);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("resize", init);
    };
  }, [mounted]);

  if (!mounted) return <div className="w-[450px] h-[450px]" />;

  return (
    <div className="relative group flex items-center justify-center">
      <canvas 
        ref={canvasRef} 
        className="w-[450px] h-[450px] cursor-crosshair"
      />
      <div className="absolute bottom-4 text-[10px] font-black uppercase tracking-[0.2em] opacity-0 group-hover:opacity-30 transition-opacity pointer-events-none">
        Displace • Pulse • Click
      </div>
    </div>
  );
};
