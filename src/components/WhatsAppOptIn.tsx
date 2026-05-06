import React from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import Link from 'next/link';

interface WhatsAppOptInProps {
  isChecked: boolean;
  onCheckedChange: (checked: boolean) => void;
  type: 'Utility' | 'Marketing';
}

export const WhatsAppOptIn: React.FC<WhatsAppOptInProps> = ({ isChecked, onCheckedChange, type }) => {

  return (
    <div className="items-top flex space-x-2">
      <Checkbox id="terms1" checked={isChecked} onCheckedChange={onCheckedChange} />
      <div className="grid gap-1.5 leading-none">
        <label
          htmlFor="terms1"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          I agree to receive {type} updates from Traconomics on WhatsApp.
        </label>
        <p className="text-sm text-muted-foreground">
          You can view our <Link href="/privacy-policy"><span className="text-blue-500 hover:underline">Privacy Policy</span></Link> for more details.
        </p>
      </div>
    </div>
  );
};