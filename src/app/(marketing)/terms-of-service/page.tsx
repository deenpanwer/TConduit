import React from 'react';
import Link from 'next/link';
import { FileText, Shield, MapPin, Phone, Mail, Scale } from 'lucide-react';
import { Navbar } from '@/components/home/Navbar';
import { Footer } from '@/components/home/Footer';

const TermsOfServicePage = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      {/* Header */}
      <header className="relative py-24 bg-secondary/30 overflow-hidden border-b border-border/50">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 opacity-50">
          <div className="absolute -top-[20%] -left-[15%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[150px]" />
          <div className="absolute -bottom-[20%] -right-[15%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[150px]" />
        </div>
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center justify-center size-20 bg-primary/10 rounded-3xl mb-8 border border-primary/20 rotate-3 hover:rotate-0 transition-transform duration-500 shadow-xl shadow-primary/5">
            <FileText className="text-primary" size={40} />
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase italic mb-4">
            Terms & Conditions
          </h1>
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-[0.2em]">Effective Date: May 5, 2026</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          {/* Business Info Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            <div className="bg-card border border-border/60 p-6 rounded-2xl flex flex-col items-center text-center group hover:border-primary/50 transition-colors">
              <div className="size-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <MapPin className="text-primary" size={24} />
              </div>
              <h3 className="text-xs font-black uppercase tracking-widest mb-2">Registered Office</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                <a href="https://www.google.com/maps/place/Traconomics/@36.1228082,-86.7917479,17z/data=!3m1!4b1!4m6!3m5!1s0x886465000efe04e9:0x3a2317f60aeee3d0!8m2!3d36.1228039!4d-86.789173!16s%2Fg%2F11mkg7ynh4?entry=ttu&g_ep=EgoyMDI2MDYxMC4wIKXMDSoASAFQAw%3D%3D" target="_blank" rel="noopener noreferrer" className="hover:underline">
                  Louisiana Blvd NE, Ste A #9599, Albuquerque, NM 87113
                </a>
              </p>
            </div>
            <div className="bg-card border border-border/60 p-6 rounded-2xl flex flex-col items-center text-center group hover:border-primary/50 transition-colors">
              <div className="size-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Phone className="text-primary" size={24} />
              </div>
              <h3 className="text-xs font-black uppercase tracking-widest mb-2">Contact Number</h3>
              <p className="text-xs text-muted-foreground">+923178005465</p>
            </div>
            <div className="bg-card border border-border/60 p-6 rounded-2xl flex flex-col items-center text-center group hover:border-primary/50 transition-colors">
              <div className="size-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Mail className="text-primary" size={24} />
              </div>
              <h3 className="text-xs font-black uppercase tracking-widest mb-2">Support Email</h3>
              <p className="text-xs text-muted-foreground">info@heytracai.com</p>
            </div>
          </div>

          <div className="prose dark:prose-invert prose-lg max-w-none 
            prose-headings:font-black prose-headings:tracking-tighter prose-headings:uppercase prose-headings:italic
            prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-6 prose-h2:text-primary
            prose-p:text-muted-foreground prose-p:leading-relaxed
            prose-li:text-muted-foreground
            prose-strong:text-foreground">
            
            <h2>1. Introduction</h2>
            <p>
              a. This website is owned and operated by <strong>TRAC AI LLC</strong> (hereinafter and throughout this website referred to as "we", "us" and "our"). Our registered office is at Louisiana Blvd NE, Ste A #9599, Albuquerque, NM 87113. Our principal place of business is located at Louisiana Blvd NE, Ste A #9599, Albuquerque, NM 87113.
            </p>
            <p>
              b. We offer this website, including all information, tools, products and services available from this website to you, the user, conditioned upon your acceptance of all terms, conditions, policies and notices stated here.
            </p>
            <p>
              c. If you have any problems placing your order on our website, or require support after placing an order through our website, please contact us by calling us on <strong>+923178005465</strong> or send us an email on <strong>info@heytracai.com</strong>.
            </p>

            <h2>2. Applicability and Updates</h2>
            <p>
              a. By visiting our site and/ or purchasing something from us, you engage in our "Service" and agree to be bound by the following terms and conditions ("Terms and Conditions"), including those additional terms and conditions and policies referenced herein and/or available by hyperlink. These Terms and Conditions apply to all users of the site, including without limitation users who are browsers, vendors, customers, merchants, and/ or contributors of content.
            </p>
            <p>
              b. In consideration of your use of our website and services, you represent that you are of legal age to form a binding contract and are not a person barred from receiving products and services under the laws of Pakistan or other applicable jurisdiction.
            </p>
            <p>
              c. We may need to update our Terms and Conditions from time to time, each time you place an order on our website you will be agreeing to the latest version of our Terms and Conditions.
            </p>

            <h2>3. Terms of Usage</h2>
            <p>You are prohibited from using this website or its content:</p>
            <ul>
              <li>for any unlawful purpose;</li>
              <li>to solicit others to perform or participate in any unlawful acts;</li>
              <li>to violate any international, federal, provincial or state laws, regulations and rules;</li>
              <li>to infringe upon or violate our intellectual property rights or the intellectual property rights of others;</li>
              <li>to harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate based on gender, sexual orientation, religion, ethnicity, race, age, national origin, or disability;</li>
              <li>to submit false or misleading information;</li>
              <li>to upload or transmit viruses or any other type of malicious code that will or may be used in any way that will affect the functionality or operation of the service or interfere with or circumvent the security features of our service, any related website, other websites, or the internet;</li>
              <li>to collect or track the personal information of others or spam, phish, pharm, pretext, spider, crawl, or scrape; or</li>
              <li>for any obscene or immoral purpose.</li>
            </ul>
            <p>
              We reserve the right to terminate your use of the Service or any related website for violating any of the prohibited uses.
            </p>

            <h2>4. Intellectual Property</h2>
            <p>
              This website and its related software and content (including images and designs) are the intellectual property of and is exclusively owned by us. The structure, organization, and code of the website and its related software contain valuable trade secrets and confidential information of <strong>TRAC AI LLC</strong>. Except as expressly stated herein, these terms and conditions do not grant you any intellectual property rights whatsoever in the website and its related software and all rights are reserved by <strong>TRAC AI LLC</strong>.
            </p>

            <h2>5. Indemnity and Limitation of Liability</h2>
            <p>
              a. You agree to indemnify us, defend and hold us harmless and our parent, subsidiaries, affiliates, partners, officers, directors, agents, contractors, licensors, service providers, subcontractors, suppliers, interns and employees, harmless from any claim or demand, including reasonable attorneys' fees, made by any third-party due to or arising out of your breach of these Terms and Conditions or the documents they incorporate by reference, or your violation of any law or the rights of a third-party.
            </p>
            <p>
              b. Neither we nor any third parties provide any warranty or guarantee as to the accuracy, timeliness, performance, completeness or suitability of the information and materials found or offered on this website for any particular purpose. You acknowledge that such information and materials may contain inaccuracies or errors and we expressly exclude liability for any such inaccuracies or errors to the fullest extent permitted by law.
            </p>
            <p>
              c. Your use of any information or materials on this website is entirely at your own risk, for which we shall not be liable. It shall be your own responsibility to ensure that any products, services or information available through this website meet your specific requirements.
            </p>
            <p>
              d. To the extent permitted by law, we also disclaim all warranties, whether express or implied, including the implied warranties of merchantability, fitness for a particular purpose, title and non-infringement.
            </p>
            <p>
              e. We reserve the right to not process an order that you place on our website. This is usually for the following reasons:
            </p>
            <ul>
              <li>We no longer hold stock of the goods or services that you ordered from us.</li>
              <li>We are unable to ship goods to your location.</li>
              <li>The goods or services that you have ordered are no longer available.</li>
              <li>Any reason outside of our control.</li>
            </ul>

            <h2>6. Termination</h2>
            <p>
              We may immediately change or terminate your access to our products, services and this website, or any online membership(s) with us, with or without notice, at any time, without liability to you, any other user or any third party. We reserve the right to terminate your access if, without limitation, you have: (1) provided us with false or misleading registration information; (2) interfered with other users or the administration of our services or websites; (3) upon a request by law enforcement or other governmental authorities; or (4) otherwise violated these Terms and Conditions.
            </p>

            <h2>7. Severability and Waiver</h2>
            <p>
              If any portion of these terms is found to be unenforceable, the unenforceable portion will be deemed amended to the minimum extent necessary to make it enforceable, and if it can't be made enforceable, then it will be severed and the remaining portion will remain in full force and effect. If we fail to enforce any of these terms, it will not be considered a waiver. Any amendment to or waiver of these terms must be made in writing and signed by us.
            </p>

            <h2>8. Governing Law</h2>
            <p>
              Our Terms and Conditions are governed by the laws of the State of New Mexico, United States and you agree that the courts of <strong>Albuquerque, New Mexico</strong> will have exclusive jurisdiction in any dispute that you have with us.
            </p>

            <h2>9. WhatsApp Messaging Terms</h2>
            <p>
              By providing your phone number and opting in to our WhatsApp messaging service, you consent to receive automated messages from Trac AI. You can opt-out at any time by replying with 'STOP' or 'UNSUBSCRIBE'. Message frequency will vary based on your interaction with our service. Standard message and data rates may apply.
            </p>

            <h2>10. Cancellation/Return/Refund Policy</h2>
            <p>
              We offer a 30-day money-back guarantee for all of our products. If you are not satisfied with your purchase, you may request a full refund within 30 days of the purchase date. To request a refund, please contact us at <strong>info@heytracai.com</strong>. We do not offer refunds for any purchases made after the 30-day period.
            </p>

            <h2>11. Contact Us</h2>
            <p>
              If you have any questions about these Terms, please contact us at{' '}
              <a href="mailto:info@heytracai.com" className="text-primary font-black hover:underline italic">
                info@heytracai.com
              </a>{' '}
              or call us at <strong>+923178005465</strong>.
            </p>
          </div>
          
          <div className="mt-20 pt-12 border-t border-border/50 flex flex-col md:flex-row items-center justify-between gap-6">
            <Link href="/" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">
              <ChevronLeft size={14} />
              Back to Home
            </Link>
            <div className="flex items-center gap-4">
              <div className="size-8 bg-secondary rounded-lg flex items-center justify-center">
                <Shield className="text-primary" size={16} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Secure & Transparent</span>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

const ChevronLeft = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
);

export default TermsOfServicePage;
