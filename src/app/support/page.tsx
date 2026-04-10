import React from 'react';
import { ArrowLeft, Search, LifeBuoy, Users, CheckSquare, MessageSquare, Clock, ShoppingCart } from 'lucide-react';
import Link from 'next/link';

const SupportPage = () => {
  return (
    <div className="bg-background text-foreground min-h-screen">
      <header className="bg-background/80 backdrop-blur-sm sticky top-0 z-40 border-b border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/dashboard" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft size={16} />
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        {/* Hero Section */}
        <section className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Support Center</h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Welcome to the Traconomics Help Center. Find answers, guides, and troubleshooting tips.
          </p>
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
            <input
              type="search"
              placeholder="How can we help you today?"
              className="w-full pl-12 pr-4 py-3 rounded-full border border-border bg-background focus:ring-2 focus:ring-primary focus:outline-none transition-shadow"
            />
          </div>
        </section>

        {/* Quick Help Categories */}
        <section className="mt-20">
          <h2 className="text-2xl font-bold text-center mb-10">Quick Help Categories</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {[
              { title: "CRM", icon: <Users size={28} /> },
              { title: "Tasks", icon: <CheckSquare size={28} /> },
              { title: "Chat", icon: <MessageSquare size={28} /> },
              { title: "Timesheets", icon: <Clock size={28} /> },
              { title: "Point of Sale (POS)", icon: <ShoppingCart size={28} /> },
            ].map((item) => (
              <div key={item.title} className="bg-card p-6 rounded-lg border border-border shadow-sm hover:shadow-md hover:-translate-y-1 transition-all flex flex-col items-center text-center">
                <div className="bg-primary/10 text-primary p-4 rounded-full mb-4">
                  {item.icon}
                </div>
                <h3 className="font-bold text-lg mb-2 text-card-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground">Get help with our {item.title.toLowerCase()} module.</p>
              </div>
            ))}
          </div>
        </section>

        {/* Installation Guide */}
        <section className="mt-20 bg-card border border-border rounded-lg p-8 md:p-12">
          <div className="grid md:grid-cols-3 gap-8 items-center">
            <div className="md:col-span-1">
              <h2 className="text-2xl font-bold mb-2">Desktop App Installation</h2>
              <p className="text-muted-foreground">
                Get started with the "Trac-Dairy" desktop app for seamless integration.
              </p>
            </div>
            <div className="md:col-span-2">
              <ol className="space-y-6">
                <li className="flex items-start">
                  <div className="bg-primary text-primary-foreground rounded-full size-8 flex items-center justify-center font-bold text-sm mr-4 flex-shrink-0">1</div>
                  <div>
                    <h4 className="font-bold">Download the Installer</h4>
                    <p className="text-muted-foreground">Access your company portal and download the <code className="bg-muted px-1.5 py-0.5 rounded-md text-xs">Trac-Diary.exe</code> installer.</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="bg-primary text-primary-foreground rounded-full size-8 flex items-center justify-center font-bold text-sm mr-4 flex-shrink-0">2</div>
                  <div>
                    <h4 className="font-bold">Run the One-Click Setup</h4>
                    <p className="text-muted-foreground">Double-click the downloaded file. The installation is fully automated and requires no extra steps.</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="bg-primary text-primary-foreground rounded-full size-8 flex items-center justify-center font-bold text-sm mr-4 flex-shrink-0">3</div>
                  <div>
                    <h4 className="font-bold">Log In & Sync</h4>
                    <p className="text-muted-foreground">Once installed, open the app and log in using your standard Traconomics credentials. Your data will sync automatically.</p>
                  </div>
                </li>
              </ol>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="mt-20 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-10">Common Questions</h2>
          <div className="space-y-4">
            <details className="p-4 rounded-lg border border-border bg-card shadow-sm cursor-pointer">
              <summary className="font-semibold text-card-foreground">How do I uninstall the desktop app?</summary>
                <div className="text-muted-foreground mt-2 space-y-2">
                    <p>First, ensure the application is completely closed to prevent any issues. Look for the Trac-Dairy icon in your system tray (near the clock), right-click it, and select "Exit" or "Quit". If the app is on your taskbar, you can also right-click its icon and choose "Close window".</p><p>Once closed, you can easily uninstall the app through Windows Settings. Navigate to <code className="bg-muted px-1.5 py-0.5 rounded-md text-xs">Settings &gt; Apps &gt; Apps &amp; features</code>, find the application in the list, and click "Uninstall".</p>
                </div>
            </details>
            <details className="p-4 rounded-lg border border-border bg-card shadow-sm cursor-pointer">
              <summary className="font-semibold text-card-foreground">Where is my data stored?</summary>
              <p className="text-muted-foreground mt-2">
                Your security is our priority. All your data is encrypted both in transit and at rest, and stored securely in our cloud infrastructure. The desktop app only caches essential data locally for performance.
              </p>
            </details>
             <details className="p-4 rounded-lg border border-border bg-card shadow-sm cursor-pointer">
              <summary className="font-semibold text-card-foreground">Is my data backed up?</summary>
              <p className="text-muted-foreground mt-2">
                Yes, we perform regular, automated backups of all platform data to prevent data loss. You can work with confidence knowing your information is safe.
              </p>
            </details>
          </div>
        </section>

        {/* Contact Section */}
        <section className="mt-20">
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-8 text-center">
                <LifeBuoy className="mx-auto size-12 text-primary mb-4" />
                <h2 className="text-2xl font-bold mb-2">Still Need Help?</h2>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Our support team is ready to assist you. Get in touch for personalized help.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                     <a href="mailto:support@traconomics.com" className="px-6 py-3 bg-background border border-border font-semibold text-foreground rounded-md hover:bg-muted transition-colors">
                        Email: support@traconomics.com
                    </a>
                    <button className="px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-md hover:bg-primary/90 transition-colors">
                        Submit a Ticket
                    </button>
                </div>
            </div>
        </section>

      </main>
    </div>
  );
};

export default SupportPage;
