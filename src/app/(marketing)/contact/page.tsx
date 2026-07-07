"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Mail, Phone, MapPin, MessageSquare, 
  Send, ChevronLeft, Globe, CheckCircle2, 
  Loader2, Building2, Smartphone
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { PricingNavbar } from '@/components/ui/pricing-navbar';

// Simplified schema: Everything is optional, no regex
const contactSchema = z.object({
  name: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  subject: z.string().optional(),
  message: z.string().optional(),
  smsConsent: z.boolean().optional(),
});

type ContactFormData = z.infer<typeof contactSchema>;

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast.success('Message sent successfully');
        setIsSuccess(true);
        reset();
      } else {
        toast.error('Failed to send message. Please try again.');
      }
    } catch (error) {
      toast.error('Error connecting to service.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-poppins overflow-hidden">
      <PricingNavbar />
      
      {/* Subtle Background Elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
      </div>

      <div className="container mx-auto px-4 pt-36 pb-12 md:pt-44 md:pb-24 relative z-10">
        {/* Navigation */}
        <motion.div 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-12"
        >
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            <span>Back to Home</span>
          </Link>
        </motion.div>

        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24">
            
            {/* Column 1: Info */}
            <div className="lg:col-span-5 space-y-12">
              <div className="space-y-6">
                <motion.h1 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-5xl md:text-6xl font-black tracking-tight uppercase"
                >
                  Contact Us
                </motion.h1>
                
                <motion.p 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-lg text-muted-foreground leading-relaxed max-w-md"
                >
                  We are here to assist with your inquiries. Please reach out to our team using the contact details below or by submitting the form.
                </motion.p>
              </div>

              {/* Contact Information */}
              <div className="space-y-6">
                {[
                  { 
                    icon: Mail, 
                    label: 'Email', 
                    value: 'info@heytracai.com', 
                    href: 'mailto:info@heytracai.com' 
                  },
                  { 
                    icon: Smartphone, 
                    label: 'Phone', 
                    value: '+1 (505) 377-2899', 
                    href: 'tel:+15053772899' 
                  },
                  { 
                    icon: MapPin, 
                    label: 'Office', 
                    value: 'Louisiana Blvd NE, Albuquerque, NM', 
                    href: 'https://www.google.com/maps/place/Traconomics/@36.1228082,-86.7917479,17z/data=!3m1!4b1!4m6!3m5!1s0x886465000efe04e9:0x3a2317f60aeee3d0!8m2!3d36.1228039!4d-86.789173!16s%2Fg%2F11mkg7ynh4?entry=ttu&g_ep=EgoyMDI2MDYxMC4wIKXMDSoASAFQAw%3D%3D' 
                  }
                ].map((item, idx) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + (idx * 0.1) }}
                    className="flex items-start gap-4"
                  >
                    <div className="size-10 bg-secondary rounded-lg flex items-center justify-center text-foreground shrink-0">
                      <item.icon size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">{item.label}</p>
                      <p className="text-base font-semibold">{item.value}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="pt-8 border-t border-border/50"
              >
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest mb-4">Business Hours</p>
                <div className="space-y-1 text-sm">
                  <p className="font-semibold">Available 24/7</p>
                  <p className="text-muted-foreground">Operational every day, including weekends and holidays.</p>
                </div>
              </motion.div>
            </div>

            {/* Column 2: Form */}
            <div className="lg:col-span-7">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="p-8 md:p-10 border-border/60 shadow-sm rounded-3xl">
                  <AnimatePresence mode="wait">
                    {!isSuccess ? (
                      <motion.div
                        key="form"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                      >
                        <div className="mb-8">
                          <h2 className="text-2xl font-bold mb-2">Send a Message</h2>
                          <p className="text-sm text-muted-foreground">Please provide your information and we will get back to you.</p>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider ml-1">Name</Label>
                              <Input 
                                id="name"
                                placeholder="Your full name"
                                {...register('name')}
                                className="h-12 bg-muted/30 border-border/40 focus:border-primary/50 rounded-xl px-4 transition-all"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider ml-1">Email</Label>
                              <Input 
                                id="email"
                                type="email"
                                placeholder="Email address"
                                {...register('email')}
                                className="h-12 bg-muted/30 border-border/40 focus:border-primary/50 rounded-xl px-4 transition-all"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <Label htmlFor="phone" className="text-xs font-bold uppercase tracking-wider ml-1">Phone</Label>
                              <Input 
                                id="phone"
                                placeholder="Contact number"
                                {...register('phone')}
                                className="h-12 bg-muted/30 border-border/40 focus:border-primary/50 rounded-xl px-4 transition-all"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="company" className="text-xs font-bold uppercase tracking-wider ml-1">Company</Label>
                              <Input 
                                id="company"
                                placeholder="Company name"
                                {...register('company')}
                                className="h-12 bg-muted/30 border-border/40 focus:border-primary/50 rounded-xl px-4 transition-all"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="subject" className="text-xs font-bold uppercase tracking-wider ml-1">Subject</Label>
                            <Input 
                              id="subject"
                              placeholder="Message subject"
                              {...register('subject')}
                              className="h-12 bg-muted/30 border-border/40 focus:border-primary/50 rounded-xl px-4 transition-all"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="message" className="text-xs font-bold uppercase tracking-wider ml-1">Message</Label>
                            <Textarea 
                              id="message"
                              placeholder="How can we help you?"
                              {...register('message')}
                              className="min-h-[150px] bg-muted/30 border-border/40 focus:border-primary/50 rounded-2xl p-4 transition-all resize-none"
                            />
                          </div>

                          <div className="flex items-start gap-3 bg-muted/20 p-4 rounded-2xl border border-border/20">
                            <input 
                              type="checkbox" 
                              id="smsConsent"
                              {...register('smsConsent')}
                              className="mt-1 size-4 rounded border-border/60 text-primary focus:ring-primary/50 cursor-pointer"
                            />
                            <div className="space-y-1">
                              <Label htmlFor="smsConsent" className="text-xs font-bold uppercase tracking-wider cursor-pointer">
                                Opt-in to SMS Notifications & Marketing
                              </Label>
                              <p className="text-[10px] text-muted-foreground leading-relaxed">
                                By checking this box and submitting this form, you provide express written consent to receive automated SMS/text messages, including promotional and marketing messages, from TRAC AI LLC at the phone number provided. Consent is not a condition of purchase. Message frequency varies. Msg & data rates may apply. Reply STOP to opt-out, HELP for help. See our <Link href="/privacy-policy" className="underline hover:text-primary">Privacy Policy</Link> and <Link href="/terms-of-service" className="underline hover:text-primary">Terms of Service</Link>.
                              </p>
                            </div>
                          </div>

                          <Button 
                            type="submit" 
                            disabled={isSubmitting}
                            className="w-full h-14 bg-primary text-primary-foreground hover:bg-primary/90 rounded-2xl font-bold uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-3"
                          >
                            {isSubmitting ? (
                              <Loader2 className="animate-spin" size={18} />
                            ) : (
                              <>
                                Submit Message
                                <Send size={16} />
                              </>
                            )}
                          </Button>
                        </form>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="success"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center text-center py-12"
                      >
                        <div className="size-20 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 mb-6">
                          <CheckCircle2 size={40} />
                        </div>
                        <h2 className="text-3xl font-bold mb-2">Message Sent</h2>
                        <p className="text-muted-foreground max-w-sm mb-10">
                          Thank you for reaching out. Our team has received your message and will contact you shortly.
                        </p>
                        <Button 
                          onClick={() => setIsSuccess(false)}
                          variant="outline" 
                          className="h-11 px-8 rounded-xl font-bold uppercase tracking-widest text-[10px]"
                        >
                          Send New Message
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Details */}
      <div className="container mx-auto px-4 py-12 border-t border-border/40">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 opacity-60 text-[10px] font-bold uppercase tracking-widest">
          <div className="flex items-center gap-2">
            <Building2 size={16} />
            <span>TRAC AI LLC</span>
          </div>
          <div className="flex gap-8">
            <span>New Mexico</span>
            <span>London</span>
            <span>New York</span>
          </div>
        </div>
      </div>
    </div>
  );
}
