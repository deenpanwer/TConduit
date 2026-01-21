"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Check, Briefcase, DollarSign, User, Building, Globe, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface HiringModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidateName: string;
  onConfirm: (data: HiringData) => void;
}

export interface HiringData {
  userName: string;
  orgName: string;
  siteUrl: string;
  logoUrl?: string;
  message: string;
  hiringType: "hourly" | "fulltime";
  rate?: string;
  salary?: string;
  currency: string;
  agreedToTerms: boolean;
}

export function HiringModal({ isOpen, onClose, candidateName, onConfirm }: HiringModalProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<HiringData>({
    userName: "",
    orgName: "",
    siteUrl: "",
    logoUrl: "",
    message: "",
    hiringType: "hourly",
    rate: "",
    salary: "",
    currency: "USD",
    agreedToTerms: false,
  });

  const handleInputChange = (field: keyof HiringData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (step === 1) setStep(2);
    else {
      onConfirm(formData);
      // We don't close immediately, the parent will handle the transition to the Purple Hub
    }
  };

  const isStep1Valid = formData.userName.length > 0 && formData.orgName.length > 0;
  const isStep2Valid = formData.hiringType === "hourly" ? !!formData.rate : !!formData.salary;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px] w-[95vw] max-h-[90vh] overflow-y-auto gap-0 p-0 bg-background border-border shadow-2xl rounded-2xl md:rounded-3xl">
        {/* Progress Bar */}
        <div className="h-1 w-full bg-secondary shrink-0">
          <div 
            className="h-full bg-primary transition-all duration-500 ease-in-out" 
            style={{ width: step === 1 ? '50%' : '100%' }}
          />
        </div>

        {/* Header */}
        <div className="p-4 md:p-6 pb-2 bg-gradient-to-b from-muted/50 to-transparent shrink-0">
          <DialogHeader>
            <DialogTitle className="text-lg md:text-2xl font-bold flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-primary" />
              Hire {candidateName}
            </DialogTitle>
            <DialogDescription className="text-xs md:text-base">
              {step === 1 ? "Let's start with your organization details." : "Define the compensation and terms."}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-4 md:p-6 pt-2 space-y-4 md:space-y-6">
          {step === 1 ? (
            <div className="space-y-4 md:space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
                <div className="space-y-2">
                  <Label htmlFor="userName" className="flex items-center gap-1.5 text-[10px] md:text-xs uppercase font-bold text-muted-foreground/70 tracking-wider">
                    Your Name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="userName" 
                      placeholder="Jane Doe" 
                      className="pl-9 bg-secondary/20 h-10 md:h-11"
                      value={formData.userName}
                      onChange={(e) => handleInputChange("userName", e.target.value)}
                      autoFocus
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="orgName" className="flex items-center gap-1.5 text-[10px] md:text-xs uppercase font-bold text-muted-foreground/70 tracking-wider">
                     Organization
                  </Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="orgName" 
                      placeholder="Acme Inc." 
                      className="pl-9 bg-secondary/20 h-10 md:h-11"
                      value={formData.orgName}
                      onChange={(e) => handleInputChange("orgName", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
                <div className="space-y-2">
                    <Label htmlFor="siteUrl" className="flex items-center gap-1.5 text-[10px] md:text-xs uppercase font-bold text-muted-foreground/70 tracking-wider">
                        Website URL <span className="text-muted-foreground/50 font-normal lowercase">(Optional)</span>
                    </Label>
                    <div className="relative">
                        <Globe className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                        id="siteUrl" 
                        placeholder="https://acme.com" 
                        className="pl-9 bg-secondary/20 h-10 md:h-11"
                        value={formData.siteUrl}
                        onChange={(e) => handleInputChange("siteUrl", e.target.value)}
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="logoUrl" className="flex items-center gap-1.5 text-[10px] md:text-xs uppercase font-bold text-muted-foreground/70 tracking-wider">
                        Logo URL <span className="text-muted-foreground/50 font-normal lowercase">(For Docs)</span>
                    </Label>
                    <Input 
                    id="logoUrl" 
                    placeholder="https://acme.com/logo.png" 
                    className="bg-secondary/20 h-10 md:h-11"
                    value={formData.logoUrl}
                    onChange={(e) => handleInputChange("logoUrl", e.target.value)}
                    />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message" className="flex items-center gap-1.5 text-[10px] md:text-xs uppercase font-bold text-muted-foreground/70 tracking-wider">
                    Message to Candidate
                </Label>
                <Textarea 
                  id="message" 
                  placeholder={`Hi ${candidateName}, we're impressed by your work on...`}
                  className="min-h-[80px] md:min-h-[100px] bg-secondary/20 resize-none"
                  value={formData.message}
                  onChange={(e) => handleInputChange("message", e.target.value)}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-5 md:space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-3">
                <Label className="text-[10px] md:text-xs uppercase font-bold text-muted-foreground/70 tracking-wider">Engagement Type</Label>
                <RadioGroup 
                  defaultValue="hourly" 
                  value={formData.hiringType} 
                  onValueChange={(val) => handleInputChange("hiringType", val as "hourly" | "fulltime")}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4"
                >
                  <div>
                    <RadioGroupItem value="hourly" id="hourly" className="peer sr-only" />
                    <Label
                      htmlFor="hourly"
                      className="flex flex-row sm:flex-col items-center sm:justify-center gap-3 sm:gap-0 rounded-xl border-2 border-muted bg-popover p-3 md:p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 peer-data-[state=checked]:text-primary cursor-pointer transition-all"
                    >
                      <ClockIcon className="sm:mb-2 h-5 w-5 md:h-6 md:w-6" />
                      <div className="flex flex-col sm:items-center">
                        <span className="font-semibold text-sm md:text-base">Hourly Contract</span>
                        <span className="text-[10px] md:text-xs text-muted-foreground font-normal mt-0.5 md:mt-1">Pay for hours worked</span>
                      </div>
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="fulltime" id="fulltime" className="peer sr-only" />
                    <Label
                      htmlFor="fulltime"
                      className="flex flex-row sm:flex-col items-center sm:justify-center gap-3 sm:gap-0 rounded-xl border-2 border-muted bg-popover p-3 md:p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 peer-data-[state=checked]:text-primary cursor-pointer transition-all"
                    >
                      <BriefcaseIcon className="sm:mb-2 h-5 w-5 md:h-6 md:w-6" />
                      <div className="flex flex-col sm:items-center">
                        <span className="font-semibold text-sm md:text-base">Full-Time</span>
                        <span className="text-[10px] md:text-xs text-muted-foreground font-normal mt-0.5 md:mt-1">Annual salary & benefits</span>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {formData.hiringType === "hourly" ? (
                <div className="space-y-2">
                  <Label htmlFor="rate" className="text-[10px] md:text-xs uppercase font-bold text-muted-foreground/70 tracking-wider">Proposed Hourly Rate</Label>
                  <div className="relative flex items-center">
                    <div className="absolute left-3 top-2.5 text-muted-foreground font-bold">$</div>
                    <Input 
                      id="rate" 
                      type="number" 
                      placeholder="50" 
                      className="pl-7 pr-12 bg-secondary/20 font-mono text-base md:text-lg h-10 md:h-11"
                      value={formData.rate}
                      onChange={(e) => handleInputChange("rate", e.target.value)}
                    />
                    <div className="absolute right-3 top-2.5 text-muted-foreground text-xs md:text-sm font-medium">/hr</div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="salary" className="text-[10px] md:text-xs uppercase font-bold text-muted-foreground/70 tracking-wider">Proposed Annual Salary</Label>
                  <div className="relative flex items-center">
                    <div className="absolute left-3 top-2.5 text-muted-foreground font-bold">$</div>
                    <Input 
                      id="salary" 
                      type="number" 
                      placeholder="120,000" 
                      className="pl-7 pr-16 bg-secondary/20 font-mono text-base md:text-lg h-10 md:h-11"
                      value={formData.salary}
                      onChange={(e) => handleInputChange("salary", e.target.value)}
                    />
                    <div className="absolute right-3 top-2.5 text-muted-foreground text-xs md:text-sm font-medium">/year</div>
                  </div>
                </div>
              )}
              
              <div className="pt-4 border-t border-border/50">
                <div className="flex items-start space-x-3">
                    <input 
                        type="checkbox" 
                        id="terms" 
                        className="mt-1 w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                        checked={formData.agreedToTerms}
                        onChange={(e) => handleInputChange("agreedToTerms", e.target.checked)}
                    />
                    <div className="grid gap-1.5 leading-none">
                        <label
                            htmlFor="terms"
                            className="text-xs md:text-sm font-medium leading-tight md:leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                            I agree to the <a href="/legal/master_services_agreement" target="_blank" className="text-primary hover:underline">MSA</a>, <a href="/legal/dpa" target="_blank" className="text-primary hover:underline">DPA</a>, and <a href="/legal/terms" target="_blank" className="text-primary hover:underline">ToS</a>.
                        </label>
                        <p className="text-[0.7rem] md:text-[0.8rem] text-muted-foreground leading-snug">
                            By clicking "Proceed", you confirm authority to bind your organization.
                        </p>
                    </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="p-4 md:p-6 pt-2 bg-background flex flex-row items-center justify-between gap-2">
            {step === 2 ? (
                 <Button variant="ghost" size="sm" onClick={() => setStep(1)} className="text-muted-foreground hover:text-foreground h-9 md:h-10">
                 Back
               </Button>
            ) : (
                <div className="flex-1"></div>
            )}
         
          <div className="flex gap-2">
             {step === 1 && (
                <Button variant="ghost" size="sm" onClick={onClose} className="text-muted-foreground hover:text-foreground h-9 md:h-10">
                    Cancel
                </Button>
             )}
            <Button size="sm" onClick={handleNext} disabled={step === 1 ? !isStep1Valid : (!isStep2Valid || !formData.agreedToTerms)} className="px-4 md:px-8 font-bold h-9 md:h-10 text-xs md:text-sm">
                {step === 1 ? (
                    <>Next <ArrowRight className="ml-1.5 md:ml-2 w-3.5 h-3.5 md:w-4 md:h-4" /></>
                ) : (
                    <>Complete <Check className="ml-1.5 md:ml-2 w-3.5 h-3.5 md:w-4 md:h-4" /></>
                )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ClockIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

function BriefcaseIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  )
}
