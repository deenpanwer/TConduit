'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Check, MessageSquare, ListTodo, Timer, Eye, Calculator, Landmark, Users, Search, BookUser, CalendarClock, Receipt, Package, Trophy, BrainCircuit, Briefcase, ArrowRight, Sparkles, ArrowDown } from 'lucide-react';
import Link from 'next/link';

// ... (verticalsData and other components remain the same)
const verticalsData = [
    { name: 'Team Chat', icon: MessageSquare, save: 4350, description: 'like Slack ($4,350/yr)' },
    { name: 'Tasks & Project Management', icon: ListTodo, save: 6594, description: 'like Asana or Trello ($6,594/yr)' },
    { name: 'Time Tracking', icon: Timer, save: 6000, description: 'like Hubstaff or Time Doctor ($6,000/yr)' },
    { name: 'Employee Monitoring', icon: Eye, save: 5400, description: 'like Teramind ($5,400/yr)' },
    { name: 'Accounting & Invoicing', icon: Calculator, save: 2400, description: 'like Quickbooks ($2,400/yr)' },
    { name: 'Payroll', icon: Landmark, save: 3600, description: 'like Gusto ($3,600/yr)' },
    { name: 'CRM & Sales Pipeline', icon: Users, save: 9000, description: 'like Hubspot ($9,000/yr)' },
    { name: 'Leads Finder', icon: Search, save: 4800, description: 'like Apollo.io ($4,800/yr)' },
    { name: 'HR & Employee Records', icon: BookUser, save: 4800, description: 'like BambooHR ($4,800/yr)' },
    { name: 'Shifts & Attendance', icon: CalendarClock, save: 3600, description: 'like Deputy ($3,600/yr)' },
    { name: 'Expense Tracking', icon: Receipt, save: 1800, description: 'like Expensify ($1,800/yr)' },
    { name: 'Inventory Management', icon: Package, save: 3600, description: 'like Cin7 ($3,600/yr)' },
    { name: 'Leaderboards & Performance', icon: Trophy, save: 0, description: 'No good alternative exists' },
    { name: 'AI Manager', icon: BrainCircuit, save: 0, description: 'Literally nothing exists for this' },
    { name: 'Pre-hire Work Trials', icon: Briefcase, save: 0, description: 'See real work before you hire' },
];

const CalendlyEmbed = ({ url }: { url: string }) => {
    useEffect(() => {
      const head = document.querySelector('head');
      const script = document.createElement('script');
      script.setAttribute('src', 'https://assets.calendly.com/assets/external/widget.js');
      script.async = true;
      head?.appendChild(script);
  
      return () => {
        if (head?.contains(script)) {
            head?.removeChild(script);
        }
      };
    }, [url]);
  
    return (
      <div 
        className="calendly-inline-widget w-full"
        data-url={url} 
        style={{ minWidth: '320px', height: '700px' }}
      ></div>
    );
};

const Confetti = () => {
    const confettiPieces = useMemo(() => {
      return Array.from({ length: 150 }).map((_, i) => ({
        id: i,
        style: {
          left: `${Math.random() * 100}%`,
          backgroundColor: `hsl(${Math.random() * 360}, 70%, 60%)`,
          animation: `fall ${2 + Math.random() * 3}s ${Math.random() * 4}s linear infinite`,
          transform: `rotate(${Math.random() * 360}deg)`,
        }
      }));
    }, []);
  
    return (
      <>
        <style>
          {`
            @keyframes fall {
              0% { transform: translateY(-20vh) rotate(0deg); }
              100% { transform: translateY(120vh) rotate(720deg); }
            }
            .confetti-piece {
                position: absolute;
                width: 8px;
                height: 16px;
                opacity: 0.8;
            }
          `}
        </style>
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-50">
          {confettiPieces.map(p => <div key={p.id} className="confetti-piece" style={p.style} />)}
        </div>
      </>
    );
  };


export default function YCPage() {
  const [step, setStep] = useState(1);
  const [selectedVerticals, setSelectedVerticals] = useState<string[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [clientMetadata, setClientMetadata] = useState({});

  useEffect(() => {
    // Capture UTM parameters and other client-side data
    const urlParams = new URLSearchParams(window.location.search);
    const utm_source = urlParams.get('utm_source');
    const utm_medium = urlParams.get('utm_medium');
    const utm_campaign = urlParams.get('utm_campaign');
    const utm_term = urlParams.get('utm_term');
    const utm_content = urlParams.get('utm_content');

    setClientMetadata({
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      browserLanguage: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      utm: {
        source: utm_source,
        medium: utm_medium,
        campaign: utm_campaign,
        term: utm_term,
        content: utm_content,
      },
    });
  }, []);

  const toggleVertical = (vertical: string) => {
    setSelectedVerticals((prev) =>
      prev.includes(vertical)
        ? prev.filter((v) => v !== vertical)
        : [...prev, vertical]
    );
  };

  const totalSavings = useMemo(() => {
    return selectedVerticals.reduce((total, currentVertical) => {
        const verticalData = verticalsData.find(v => v.name === currentVertical);
        return total + (verticalData?.save || 0);
    }, 0);
  }, [selectedVerticals]);

  const handleNext = async () => {
    try {
      await fetch('/api/yc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
            selectedVerticals, 
            metadata: clientMetadata
        }),
      });
    } catch (error) {
      console.error('Error saving data:', error);
    }

    setShowConfetti(true);
    setTimeout(() => setStep(2), 500);
  };

  const savingsRef = useRef<HTMLDivElement>(null);

  const scrollToSavings = () => {
      savingsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center p-4 relative overflow-hidden">
      {showConfetti && <Confetti />}
       <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 opacity-30">
            <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
            <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
        </div>
      <div className="absolute top-8 left-8 transform -rotate-12">
        <img 
          src="https://bookface-static.ycombinator.com/assets/ycombinator-logo-37cf030fbc255fc71d19aa21bd5b32076aa206e8fbd0121c9247db2adcbd7851.png" 
          alt="Y Combinator Logo" 
          className="w-24 h-auto"
        />
      </div>
      <div className="absolute top-8 right-8 transform rotate-12">
        <img src="/logo.svg" alt="Our Logo" className="w-24 h-24 dark:invert" />
      </div>

      <div className="w-full max-w-7xl mt-32 px-4">
        {step === 1 && (
          <>
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tighter">What can we replace for you?</h1>
              <p className="text-muted-foreground max-w-3xl mx-auto text-lg">Select the tools you're currently paying for to see your annual savings.</p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8 items-start">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:col-span-2 gap-4">
                    {verticalsData.map((vertical) => {
                        const Icon = vertical.icon;
                        const isSelected = selectedVerticals.includes(vertical.name);
                        return (
                            <button
                            key={vertical.name}
                            onClick={() => toggleVertical(vertical.name)}
                            className={`h-28 text-left p-4 rounded-xl border-2 transition-all flex flex-col justify-between relative group ${
                                isSelected
                                ? 'border-primary bg-primary/10'
                                : 'border-border bg-card/50 hover:bg-card/90 hover:border-primary/50'
                            }`}>
                                <div className="flex items-start justify-between">
                                    <div className='flex items-center'>
                                        <Icon className="w-6 h-6 mr-3 text-primary" />
                                        <h3 className="font-semibold text-base">{vertical.name}</h3>
                                    </div>
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'border-primary bg-primary' : 'border-muted-foreground/50 group-hover:border-primary'}`}>
                                        {isSelected && <Check size={12} className="text-primary-foreground" />}
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground font-mono">{vertical.description}</p>
                            </button>
                        )
                    })}
                </div>

                <div className="lg:col-span-1 lg:sticky top-24" ref={savingsRef}>
                    <div className="bg-card/60 border rounded-xl p-6 shadow-sm">
                        <h3 className="font-bold text-lg mb-1">Your Annual Savings</h3>
                        <p className='text-5xl font-bold tracking-tighter text-primary'>
                            ${totalSavings.toLocaleString()}
                        </p>
                        <p className='text-muted-foreground text-sm mt-1 mb-4'>...plus unquantifiable gains from our unique tools.</p>
                        
                        <div className="space-y-1 my-4 h-32 overflow-y-auto pr-2">
                            {selectedVerticals.map(v => {
                                const vertData = verticalsData.find(vd => vd.name === v);
                                return (
                                    <div key={v} className="text-xs flex justify-between items-center bg-background/50 p-2 rounded-md font-mono">
                                        <span>{v}</span>
                                        <span className="font-bold text-primary">${vertData?.save.toLocaleString()}</span>
                                    </div>
                                )
                            })}
                        </div>
                        
                        <Button size="lg" disabled={selectedVerticals.length === 0} onClick={handleNext} className="w-full py-7 text-lg font-bold group">
                           Next <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform"/>
                        </Button>
                    </div>
                </div>
            </div>

            <button 
                onClick={scrollToSavings} 
                className="lg:hidden fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center animate-bounce"
            >
                <ArrowDown className="w-7 h-7" />
            </button>
          </>
        )}

        {step === 2 && (
          <div className="w-full">
             <div className="text-center mb-4">
                <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-primary transition-colors">Skip demo & go to dashboard</Link>
                <h1 className="text-4xl md:text-5xl font-bold mt-2 mb-2 tracking-tighter">Book Your Discovery Call</h1>
                <p className="text-muted-foreground text-lg">You're one call away from saving ${totalSavings.toLocaleString()} a year. Let's do this.</p>
             </div>
            <CalendlyEmbed url="https://calendly.com/kaayfkhan/discovery-call" />
            <div className="text-center mt-8 flex flex-col items-center gap-4">
                <Button variant="link" onClick={() => { setStep(1); setShowConfetti(false); }}>
                    Back to calculation
                </Button>
                <Link href="/dashboard">
                    <Button>Go to Dashboard</Button>
                </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
