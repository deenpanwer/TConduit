"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { Button } from "@/components/ui/button-v2"
import { Download } from "lucide-react"

gsap.registerPlugin(ScrollTrigger)

const dashboardTabs = [
  {
    id: 1,
    title: "Activity Logging",
    src: "/dairy/demo1.png",
    alt: "Smart Activity Logging",
  },
  {
    id: 2,
    title: "Performance Metrics",
    src: "/dairy/demo2.png",
    alt: "Performance Metrics Overview",
  },
  {
    id: 3,
    title: "Trend Analysis",
    src: "/dairy/demo3.png",
    alt: "Activity Trend Analysis",
  },
  {
    id: 4,
    title: "Verifiable Profile",
    src: "/dairy/demo4.png",
    alt: "Verifiable Work Profile",
  }
]

export default function FeaturesDetail() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const headingRef = useRef<HTMLHeadingElement>(null)
  const textRef = useRef<HTMLParagraphElement>(null)
  const ctaRef = useRef<HTMLDivElement>(null)
  const sliderRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Hero animation
    const tl = gsap.timeline()

    tl.fromTo(
      headingRef.current,
      { y: 50, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" }
    )
      .fromTo(
        textRef.current,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" },
        "-=0.4"
      )
      .fromTo(
        ctaRef.current,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" },
        "-=0.4"
      )
      .fromTo(
        sliderRef.current,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" },
        "-=0.2"
      )
      .fromTo(
        ".hero-blur",
        { opacity: 0, scale: 0.8 },
        { opacity: 1, scale: 1, duration: 1.2, ease: "power2.out" },
        "-=1"
      )

    // Parallax effect on scroll
    gsap.to(".hero-blur", {
      yPercent: 20,
      ease: "none",
      scrollTrigger: {
        trigger: sectionRef.current,
        start: "top top",
        end: "bottom top",
        scrub: true
      }
    })

    // Auto-slide interval
    const slideInterval = setInterval(() => {
      nextSlide()
    }, 5000)

    return () => {
      tl.kill()
      clearInterval(slideInterval)
    }
  }, []);

  // Function to go to next slide
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev === dashboardTabs.length - 1 ? 0 : prev + 1))
  }

  // Function to go to a specific slide
  const goToSlide = (index: number) => {
    setCurrentSlide(index)
  }

  return (
    <div ref={sectionRef} className="py-8 md:py-16">
      <div className="mx-auto">
        <div className="container mx-auto px-4 mb-12 text-center md:text-left">
            <h1 ref={headingRef} className="text-4xl font-poppins font-bold tracking-tight text-foreground sm:text-5xl">
              Experience Trac Dairy
            </h1>
            <p ref={textRef} className="mt-4 text-lg text-muted-foreground max-w-2xl font-poppins">
              See how our intelligent logging and analytics empower your productivity with verifiable proof of work.
            </p>
            <div ref={ctaRef} className="mt-8">
                <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg rounded-full px-8 font-poppins">
                    <Download className="mr-2 h-5 w-5" />
                    Download Now
                </Button>
            </div>
        </div>
        
        <div>
          <div
            ref={sliderRef}
            className="relative h-[80vh] overflow-hidden"
          >
            <div className="absolute inset-0 flex items-center justify-center">
              {dashboardTabs.map((tab, index) => {
                const position = index - currentSlide;
                const isActive = position === 0;
                const scale = isActive ? 1 : 1 - 0.1;

                const translateX = position * 100;

                return (
                  <div
                    key={tab.id}
                    className={`absolute transition-all duration-700 ease-in-out rounded-2xl ${isActive ? 'shadow-[0_20px_50px_rgba(0,0,0,0.15)] z-30' : 'shadow-md opacity-40 z-20'}`}
                    style={{
                      transform: `translateX(${translateX}%) scale(${scale})`,
                    }}
                  >
                    <div className="relative aspect-[16/10] w-[85vw] md:w-[70vw] max-w-6xl rounded-2xl overflow-hidden border border-border bg-card">
                      <Image
                        src={tab.src}
                        alt={tab.alt}
                        fill
                        className="object-cover"
                        priority={tab.id === 1}
                      />
                      {isActive && (
                        <div className="absolute inset-0 ring-1 ring-inset ring-foreground/5 rounded-2xl pointer-events-none"></div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-center flex-wrap gap-4 md:gap-8 mt-8 px-4">
            {dashboardTabs.map((tab, index) => (
              <button
                key={tab.id}
                onClick={() => goToSlide(index)}
                className={`p-2 text-sm font-medium transition-all font-poppins ${currentSlide === index
                  ? "text-foreground font-bold border-b-2 border-emerald-500"
                  : "text-muted-foreground hover:text-foreground"}`}
              >
                {tab.title}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}