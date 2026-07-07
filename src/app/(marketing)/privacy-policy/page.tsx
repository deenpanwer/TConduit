import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { Shield, Lock, Eye, Server, UserCheck, ChevronLeft } from 'lucide-react';
import { Navbar } from '@/components/home/Navbar';
import { Footer } from '@/components/home/Footer';

export const metadata: Metadata = {
  title: 'Privacy Policy | TRAC AI Data Security & Protection',
  description: 'Read the Trac AI Privacy Policy to understand how we collect, use, store, and protect your personal data and business information in our operating system.',
};

const PrivacyPolicyPage = () => {
  return (
    <div className="min-h-screen bg-background text-foreground font-poppins">
      <Navbar />
      {/* Header */}
      <header className="relative py-24 bg-secondary/30 overflow-hidden border-b border-border/50">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 opacity-50">
          <div className="absolute -top-[20%] -left-[15%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[150px]" />
          <div className="absolute -bottom-[20%] -right-[15%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[150px]" />
        </div>
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center justify-center size-20 bg-primary/10 rounded-3xl mb-8 border border-primary/20 -rotate-3 hover:rotate-0 transition-transform duration-500 shadow-xl shadow-primary/5">
            <Shield className="text-primary" size={40} />
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase italic mb-4">
            Privacy Policy
          </h1>
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-[0.2em]">Last Updated: May 5, 2026</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
            <div className="bg-card border border-border/60 p-8 rounded-2xl group hover:border-primary/50 transition-colors">
              <div className="size-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Eye className="text-primary" size={24} />
              </div>
              <h3 className="text-lg font-black uppercase tracking-tighter italic mb-3">Transparency</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">We are open about the data we collect and how we use it to provide our services.</p>
            </div>
            <div className="bg-card border border-border/60 p-8 rounded-2xl group hover:border-primary/50 transition-colors">
              <div className="size-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Lock className="text-primary" size={24} />
              </div>
              <h3 className="text-lg font-black uppercase tracking-tighter italic mb-3">Security</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">Your data is protected with industry-standard security protocols and encryption.</p>
            </div>
          </div>

          <div className="prose dark:prose-invert prose-lg max-w-none 
            prose-headings:font-black prose-headings:tracking-tighter prose-headings:uppercase prose-headings:italic
            prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-6 prose-h2:text-primary
            prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-4
            prose-p:text-muted-foreground prose-p:leading-relaxed
            prose-li:text-muted-foreground
            prose-strong:text-foreground">
            
            <h2>1. Introduction</h2>
            <p>
              a. This privacy policy ("Privacy Policy") applies to the collection and processing of personal data ("Personal Data") by <strong>TRAC AI LLC</strong> in connection with our website. This Privacy Policy will help you understand how we collect and use your Personal Data and what we do with it.
            </p>
            <p>
              b. By visiting our website and/ or purchasing something from us, you agree to us handling your Personal Data in accordance with this Privacy Policy.
            </p>
            <p>
              c. <strong>Mobile Sharing Disclaimer:</strong> Mobile phone numbers collected for SMS/text messaging purposes and consent will not be shared with third parties or affiliates for marketing or promotional purposes. All of the sharing categories below exclude text messaging originator opt-in data and consent; this information will not be shared with any third parties.
            </p>
            <p>
              d. <strong>SMS & Marketing Consent:</strong> When you opt-in to our SMS text messaging program, you provide express written consent to receive marketing and promotional messages, as well as transactional and support messages. You may opt-out at any time by replying STOP to any message.
            </p>

            <h2>2. Personal data that we collect</h2>
            <p>
              a. Personal Data includes any information about an individual from which that person can be identified. It does not include Personal Data where the identity has been removed (anonymous data, e.g. your IP Address).
            </p>
            <p>
              b. Information you may provide us through the website includes:
            </p>
            <ul>
              <li><strong>Contact data</strong>, such as your first and last name, email address, billing address, shipping address and phone number.</li>
              <li><strong>Profile data</strong>, such as the username and password that you may set to establish an online account with us.</li>
              <li><strong>Communications</strong> that we exchange with you, including when you contact us with questions or feedback, through the website, email, social media (including Facebook, Instagram and Whatsapp).</li>
              <li><strong>Transactional data</strong>, such as information relating to or needed to complete your orders placed through our website including order numbers and transaction history.</li>
            </ul>

            <h3>Gmail Integration</h3>
            <p>
              If you choose to connect your Gmail account, we access:
            </p>
            <ul>
              <li><strong>Emails:</strong> Content including subject, body, sender, and recipients only when needed to display conversations within the CRM.</li>
              <li><strong>Metadata:</strong> Timestamps, labels, and headers to show contact activity timelines.</li>
              <li><strong>Labels:</strong> Access and management of Gmail labels to sync CRM pipeline stages with your inbox.</li>
            </ul>

            <h2>3. How we use your Personal Data</h2>
            <p>We use your Personal Data for the following:</p>
            <ul>
              <li>Provide you with the required services and/or products that you order from our website.</li>
              <li>Respond to your questions or requests.</li>
              <li>Improve our operations and content layout.</li>
              <li>Prevent, detect and manage risk against fraud and illegal activities.</li>
              <li>Comply with our financial regulatory and other legal obligations.</li>
              <li>Target advertisements, newsletters and service updates.</li>
              <li>Resolve disputes that may arise.</li>
            </ul>

            <h2>4. Who do we share your Personal Data with?</h2>
            <p>
              To enable us to provide our services to you on our website, we may share your information with trusted third parties, such third parties include financial institutions, payment processors, verification services, as well as any third parties that you have directly authorized to receive your Personal Data including courier service providers.
            </p>
            <p>
              We share Personal Data with third party business partners when this is necessary to provide our products and/or services. Examples of third parties to whom we may disclose Personal Data for this purpose are banks and payment method providers (such as credit card networks) when we provide payment processing services.
            </p>
            <p><strong>We do not and will not sell your personal information, including your Gmail data, to any third party.</strong></p>

            <h2>5. How we protect your Personal Data</h2>
            <p>
              a. We make reasonable efforts to ensure a level of security appropriate to the risk associated with the processing of Personal Data. We implement access control measures (physical and virtual), security protocols, policies and standards to ensure that our security infrastructures are in compliance with reasonable industry standards.
            </p>
            <p>
              b. We have also put in place procedures to deal with any suspected Personal Data breach and will notify you and any applicable regulator of a breach where we are legally required to do so.
            </p>

            <h2>6. How long do we store your information?</h2>
            <p>
              a. We will only retain your Personal Data for as long as necessary to fulfil the purposes we collected it for. This includes for example the purposes of satisfying any legal, regulatory, accounting, reporting requirements, to carry out legal work, for the establishment or defence of legal claims.
            </p>
            <p>
              b. We will retain your information for as long as your account is active or as needed to provide you with our services, comply with our legal and statutory obligations or verify your information with a financial institution.
            </p>

            <h2>7. Google Limited Use Policy</h2>
            <p>
              Our use and transfer to any other app of information received from Google APIs will adhere to the{' '}
              <a
                href="https://developers.google.com/terms/api-services-user-data-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary font-bold hover:underline"
              >
                Google API Services User Data Policy
              </a>
              , including the Limited Use requirements.
            </p>

            <h2>8. WhatsApp Business Communication</h2>
            <p>
              We use the WhatsApp Business API, provided by Meta, as a data processor. While messages are end-to-end encrypted, message metadata and content may be processed by Meta for up to 30 days to ensure delivery. You have the right to data portability and deletion.
            </p>

            <h2>9. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, you can contact us at{' '}
              <a href="mailto:info@heytracai.com" className="text-primary font-black hover:underline italic">
                info@heytracai.com
              </a>{' '}
              or call us at <strong>+1 (505) 377-2899</strong>.
            </p>
          </div>
          
          <div className="mt-20 pt-12 border-t border-border/50 flex flex-col md:flex-row items-center justify-between gap-6">
            <Link href="/" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">
              <ChevronLeft size={14} />
              Back to Home
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PrivacyPolicyPage;
