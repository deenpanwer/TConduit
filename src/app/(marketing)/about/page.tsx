import React from 'react';
import Link from 'next/link';
import { Target, Zap, Users, ShieldCheck, ChevronLeft } from 'lucide-react';

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-background text-foreground font-poppins">
      {/* Header */}
      <header className="relative py-24 bg-secondary/30 overflow-hidden border-b border-border/50">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 opacity-50">
          <div className="absolute -top-[20%] -left-[15%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[150px]" />
          <div className="absolute -bottom-[20%] -right-[15%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[150px]" />
        </div>
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center justify-center size-20 bg-primary/10 rounded-3xl mb-8 border border-primary/20 rotate-12 hover:rotate-0 transition-transform duration-500 shadow-xl shadow-primary/5">
            <Target className="text-primary" size={40} />
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase italic mb-4">
            About Us
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-medium">
            Building the first truly integrated business operating system.
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto space-y-20">
          
          <section className="text-center space-y-6">
            <h2 className="text-3xl font-black tracking-tighter uppercase italic">Our Mission</h2>
            <p className="text-xl text-muted-foreground leading-relaxed">
              At <strong>TRAC AI (PRIVATE) LIMITED</strong>, we believe that software should work for you, not against you. Our mission is to eliminate the fragmentation of business tools by providing a single, unified platform that handles everything from CRM and POS to Manufacturing and Accounting.
            </p>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-card border border-border/60 p-10 rounded-[2rem] space-y-4">
              <Zap className="text-primary" size={32} />
              <h3 className="text-xl font-black uppercase tracking-tighter italic">Innovation First</h3>
              <p className="text-muted-foreground">We leverage cutting-edge AI to automate repetitive tasks, giving you more time to focus on what matters: growing your business.</p>
            </div>
            <div className="bg-card border border-border/60 p-10 rounded-[2rem] space-y-4">
              <ShieldCheck className="text-primary" size={32} />
              <h3 className="text-xl font-black uppercase tracking-tighter italic">Security & Trust</h3>
              <p className="text-muted-foreground">Operating out of Karachi, Pakistan, we serve a global clientele with the highest standards of data security and privacy.</p>
            </div>
          </div>

          <section className="bg-secondary/30 border border-border/50 p-12 rounded-[2.5rem] text-center">
            <Users className="mx-auto text-primary mb-6" size={48} />
            <h2 className="text-3xl font-black tracking-tighter uppercase italic mb-6">The Team</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We are a team of passionate engineers, designers, and business strategists dedicated to redefining how businesses operate in the 21st century.
            </p>
          </section>

          <div className="pt-12 border-t border-border/50 text-center">
            <Link href="/" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">
              <ChevronLeft size={14} />
              Back to Home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AboutPage;
