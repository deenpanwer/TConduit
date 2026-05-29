import React from 'react';
import Link from 'next/link';
import { RefreshCcw, XCircle, CreditCard, Mail, Phone, ChevronLeft } from 'lucide-react';

const CancellationRefundPolicyPage = () => {
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
            <RefreshCcw className="text-primary" size={40} />
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase italic mb-4">
            Refund & Cancellation
          </h1>
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-[0.2em]">Effective Date: May 5, 2026</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          {/* Policy Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
            <div className="bg-card border border-border/60 p-8 rounded-2xl group hover:border-primary/50 transition-colors">
              <div className="size-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <XCircle className="text-primary" size={24} />
              </div>
              <h3 className="text-lg font-black uppercase tracking-tighter italic mb-3">Cancellation</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">Cancel your subscription at any time. Your access continues until the end of the billing period.</p>
            </div>
            <div className="bg-card border border-border/60 p-8 rounded-2xl group hover:border-primary/50 transition-colors">
              <div className="size-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <CreditCard className="text-primary" size={24} />
              </div>
              <h3 className="text-lg font-black uppercase tracking-tighter italic mb-3">30-Day Guarantee</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">Not satisfied? Request a full refund within 30 days of your initial purchase.</p>
            </div>
          </div>

          <div className="prose dark:prose-invert prose-lg max-w-none 
            prose-headings:font-black prose-headings:tracking-tighter prose-headings:uppercase prose-headings:italic
            prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-6 prose-h2:text-primary
            prose-p:text-muted-foreground prose-p:leading-relaxed
            prose-li:text-muted-foreground
            prose-strong:text-foreground">
            
            <h2>1. Subscription Cancellation</h2>
            <p>
              You may cancel your subscription at any time. To cancel your subscription, please contact us at <strong>info@heytracai.com</strong> or through your account dashboard.
            </p>
            <p>
              Upon cancellation, your subscription will remain active until the end of the current billing cycle. You will not be charged for the subsequent billing period. No partial refunds are provided for the remaining days of a billing cycle.
            </p>

            <h2>2. Refund Policy</h2>
            <p>
              We offer a <strong>30-day money-back guarantee</strong> for all of our digital products and subscriptions. If you are not satisfied with your purchase for any reason, you may request a full refund within 30 days of the original purchase date.
            </p>
            <p>
              To request a refund, please contact our support team at <strong>info@heytracai.com</strong> with your order details.
            </p>
            <p>
              <strong>Exclusions:</strong> We do not offer refunds for any requests made after the 30-day guarantee period has expired.
            </p>

            <h2>3. Returns</h2>
            <p>
              As we primarily provide digital software and services, we do not offer returns for any of our products once they have been accessed or downloaded, subject to the 30-day refund guarantee mentioned above.
            </p>

            <h2>4. Processing Refunds</h2>
            <p>
              Once your refund request is received and approved, we will process the refund to your original method of payment. Please note that it may take 5-10 business days for the credit to appear on your statement, depending on your financial institution.
            </p>

            <h2>5. Contact Us</h2>
            <p>
              If you have any questions about our Cancellation, Return, and Refund Policy, please reach out to us:
            </p>
            <ul>
              <li><strong>Email:</strong> info@heytracai.com</li>
              <li><strong>Phone:</strong> +923178005465</li>
              <li><strong>Address:</strong> A-1877, Phase 2, Gulshan-e-Hadeed, Karachi, Sindh, Pakistan</li>
            </ul>
          </div>
          
          <div className="mt-20 pt-12 border-t border-border/50 flex flex-col md:flex-row items-center justify-between gap-6">
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

export default CancellationRefundPolicyPage;
