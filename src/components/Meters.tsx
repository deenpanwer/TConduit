
"use client";

import { motion } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetersProps {
  competencyScore?: number;
  agencyScore?: number;
}

interface MeterArcProps {
    score: number;
    color: string;
    title: string;
    description: string;
}

const MeterArc: React.FC<MeterArcProps> = ({ score, color, title, description }) => {
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center">
        <div className="relative w-24 h-24">
            <svg className="w-full h-full" viewBox="0 0 80 80">
                <circle
                    className="text-muted/20"
                    strokeWidth="8"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx="40"
                    cy="40"
                />
                <motion.circle
                    className={color}
                    strokeWidth="8"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx="40"
                    cy="40"
                    transform="rotate(-90 40 40)"
                    animate={{ strokeDashoffset }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-xl font-bold text-foreground">
                {score}%
            </div>
        </div>
        <div className="flex items-center gap-1 mt-2">
            <h4 className="text-sm font-semibold text-muted-foreground">{title}</h4>
            <Tooltip>
                <TooltipTrigger className="cursor-pointer">
                    <Info className="h-3 w-3 text-muted-foreground/70" />
                </TooltipTrigger>
                <TooltipContent>
                    <p className="max-w-xs">{description}</p>
                </TooltipContent>
            </Tooltip>
      </div>
    </div>
  );
};


const Meters: React.FC<MetersProps> = ({
  competencyScore = 0,
  agencyScore = 0,
}) => {
  return (
    <TooltipProvider>
      <div className="flex flex-row justify-center gap-8 w-full">
        <MeterArc
          score={competencyScore}
          color="text-green-500"
          title="Competency"
          description="Measures the alignment of the candidate's verified skills, experience, and past project success with your specific job requirements."
        />
        <MeterArc
          score={agencyScore}
          color="text-blue-500"
          title="Agency"
          description="Evaluates indicators of proactivity, reliability, and self-management, such as response time, client reviews, and project completion rates."
        />
      </div>
    </TooltipProvider>
  );
};

export default Meters;
