'use client';

import React, { useState } from 'react';
import Script from 'next/script';
import { TrackerHeader } from '@/components/time-tracker/TrackerHeader';
import { TrackerHero } from '@/components/time-tracker/TrackerHero';
import { TrackerFeatures } from '@/components/time-tracker/TrackerFeatures';
import { TrackerDashboardPreview } from '@/components/time-tracker/TrackerDashboardPreview';
import { TrackerComparison } from '@/components/time-tracker/TrackerComparison';
import { TrackerHowItWorks } from '@/components/time-tracker/TrackerHowItWorks';
import { TrackerFAQ } from '@/components/time-tracker/TrackerFAQ';
import { TrackerCTA } from '@/components/time-tracker/TrackerCTA';
import CalendlyModal from '@/components/CalendlyModal';
import { motion } from 'framer-motion';

export default function TimeTrackingPage() {
  const [isCalendlyOpen, setIsCalendlyOpen] = useState(false);

  const handleBookDemo = () => {
    setIsCalendlyOpen(true);
  };

  const handleStartTrial = () => {
    const trialUrl = '/trac-diary';
    if (typeof window !== 'undefined' && (window as any).gtag_report_conversion) {
      (window as any).gtag_report_conversion(trialUrl);
    } else {
      window.location.href = trialUrl;
    }
  };

  const whatsappNumber = "923178005465"; 
  const whatsappUrl = `https://wa.me/${whatsappNumber}`;

  const timeTrackingSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "TRAC AI Time Tracking",
    "operatingSystem": "Windows, macOS, Linux, Web",
    "applicationCategory": "BusinessApplication",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "publisher": {
      "@type": "Organization",
      "name": "TRAC AI LLC",
      "logo": "https://www.heytracai.com/trac-ai-logo.png"
    },
    "description": "High-performance time tracker and productivity manager, automatically logging activity timelines and syncing with task boards for seamless remote and onsite payroll management.",
    "sameAs": [
      "https://www.heytracai.com/time-tracking"
    ]
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary selection:text-white overflow-x-hidden">
      {/* Inject Structured Time Tracking Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(timeTrackingSchema) }}
      />
      {/* Google Tag (gtag.js) */}
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=AW-17668221650"
        strategy="afterInteractive"
      />
      <Script id="google-tag-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          window.gtag = function(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'AW-17668221650');

          window.gtag_report_conversion = function(url) {
            var callback = function () {
              if (typeof(url) != 'undefined' && url) {
                window.location = url;
              }
            };
            gtag('event', 'conversion', {
                'send_to': 'AW-17668221650/fFhWCPny2LAbENLV7uhB',
                'value': 1.0,
                'currency': 'PKR',
                'event_callback': callback
            });
            return false;
          }
        `}
      </Script>
      
      <TrackerHeader onBookDemo={handleBookDemo} />

      <main>
        {/* Pass whatsappNumber to TrackerHero */}
        <TrackerHero 
          onBookDemo={handleBookDemo} 
          whatsappNumber={whatsappNumber}
        />
        
        <TrackerFeatures />
        
        <TrackerDashboardPreview />
        <TrackerComparison />
        
        <TrackerHowItWorks />
        
        <TrackerFAQ />

        <TrackerCTA 
            onBookDemo={handleBookDemo} 
            onStartTrial={handleStartTrial} 
            whatsappNumber={whatsappNumber}
        />
      </main>

      {/* Floating WhatsApp Button - Brutalist Update */}
      <motion.a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => {
          if (typeof window !== 'undefined' && (window as any).gtag_report_conversion) {
            (window as any).gtag_report_conversion();
          }
        }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1 }}
        className="fixed bottom-6 right-6 z-40 bg-[#25D366] text-white p-3 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all duration-200 flex items-center justify-center rounded-none"
        aria-label="Chat on WhatsApp"
      >
        <img src="/whatsapp-real.svg" alt="WhatsApp" width={40} height={40} className="w-10 h-10" />
      </motion.a>

      <CalendlyModal 
        isOpen={isCalendlyOpen} 
        onClose={() => setIsCalendlyOpen(false)} 
        calendlyUrl="https://calendly.com/kaayfkhan/discovery-call"
      />

    </div>
  );
}