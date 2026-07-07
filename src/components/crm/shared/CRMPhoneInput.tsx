'use client';

import React from "react";
import PhoneInput, { parsePhoneNumber } from "react-phone-number-input";
import flags from "react-phone-number-input/flags";
import "react-phone-number-input/style.css";
import { cn } from "@/lib/utils";

interface CRMPhoneInputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  onBlur?: () => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  className?: string;
  inputClassName?: string;
  context?: "modal" | "inline-edit" | "table-cell";
}

interface CRMPhoneDisplayProps {
  value: string;
  placeholder?: string;
  className?: string;
}

export const CRMPhoneDisplay = ({ value, placeholder = "-", className }: CRMPhoneDisplayProps) => {
  if (!value) {
    return <span className="text-muted-foreground/60 italic font-bold uppercase text-[9px] tracking-widest">{placeholder}</span>;
  }

  let phoneNumber;
  try {
    phoneNumber = parsePhoneNumber(value, 'US');
  } catch (e) {
    // Ignore error and fall back
  }

  if (!phoneNumber) {
    return <span className={className}>{value}</span>;
  }

  const Flag = phoneNumber.country ? flags[phoneNumber.country] : null;
  const formatted = phoneNumber.formatInternational();

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {Flag && (
        <span className="flex items-center justify-center w-5 h-3.5 overflow-hidden rounded-[2px] shadow-sm border border-border/40 shrink-0">
          <Flag title={phoneNumber.country || ""} />
        </span>
      )}
      <span className="truncate">{formatted}</span>
    </div>
  );
};

export const CRMPhoneInput = React.forwardRef<HTMLInputElement, CRMPhoneInputProps>(
  (
    {
      value,
      onChange,
      placeholder = "Enter phone number...",
      disabled = false,
      autoFocus = false,
      onBlur,
      onKeyDown,
      className,
      inputClassName,
      context = "modal",
    },
    ref
  ) => {
    // Determine styles based on context
    const getContextStyles = () => {
      switch (context) {
        case "table-cell":
          return "h-full bg-background border-none rounded-none px-4 text-xs font-bold focus-within:ring-0";
        case "inline-edit":
          return "h-10 bg-background border border-input rounded-md px-3 text-base font-medium focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2";
        case "modal":
        default:
          return "h-12 bg-secondary/5 border border-border/20 rounded-xl px-4 text-[11px] font-bold focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500";
      }
    };

    const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
      // Check if focus has moved to an element outside the entire wrapper (like clicking outside the cell)
      if (e.currentTarget.contains(e.relatedTarget as Node)) {
        return;
      }
      if (onBlur) {
        onBlur();
      }
    };

    return (
      <div 
        className={cn("phone-input-wrapper w-full", className)}
        onBlur={handleBlur}
      >
        <PhoneInput
          international
          defaultCountry="US"
          value={value || ""}
          onChange={(val) => onChange(val || "")}
          placeholder={placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          onKeyDown={onKeyDown}
          ref={ref as any}
          className={cn(
            "flex items-center w-full transition-all focus-within:outline-none",
            getContextStyles()
          )}
          numberInputProps={{
            className: cn(
              "flex-1 h-full bg-transparent border-none outline-none focus:ring-0 focus:outline-none p-0 text-inherit font-inherit min-w-0 placeholder:text-muted-foreground/50",
              inputClassName
            ),
          }}
        />
        <style jsx global>{`
          .PhoneInputCountry {
            display: flex;
            align-items: center;
            margin-right: 0.5rem;
            height: 100%;
          }
          .PhoneInputCountrySelect {
            cursor: pointer;
            position: absolute;
            top: 0;
            left: 0;
            height: 100%;
            width: 100%;
            opacity: 0;
            z-index: 1;
            border: none;
          }
          .PhoneInputCountryIcon {
            width: 1.25em;
            height: 1em;
            box-shadow: 0 0 1px 0 rgba(0, 0, 0, 0.3);
            border-radius: 2px;
            background-color: var(--background);
          }
          .PhoneInputCountrySelectArrow {
            display: block;
            content: '';
            width: 0;
            height: 0;
            margin-left: 0.35rem;
            border-left: 0.15rem solid transparent;
            border-right: 0.15rem solid transparent;
            border-top: 0.25rem solid;
            opacity: 0.45;
            transition: opacity 0.2s ease;
          }
          .PhoneInputCountrySelectTrigger {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100%;
            position: relative;
            background: transparent;
            border: none;
            padding: 0;
            margin: 0;
            outline: none;
          }
        `}</style>
      </div>
    );
  }
);

CRMPhoneInput.displayName = "CRMPhoneInput";
