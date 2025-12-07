
"use client";

import { motion } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react"; // Importing an icon for the tooltip trigger

interface MetersProps {
  competencyScore?: number;
  agencyScore?: number;
}

const MeterArc: React.FC<{ score: number; color: string; title: string; description: string }> = ({ score, color, title, description }) => {
  const radius = 40;
  const fullCircumference = 2 * Math.PI * radius;
  const partialCircumference = 0.75 * fullCircumference; // 75% of the circumference

  // Calculate the dashoffset based on the score and partial circumference
  const dashoffset = partialCircumference - (score / 100) * partialCircumference;

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-card rounded-lg shadow-lg">
      <div className="flex items-center gap-2 mb-2">
        <h4 className="text-lg font-semibold text-foreground">{title}</h4>
        <Tooltip>
          <TooltipTrigger className="cursor-pointer">
            <Info className="h-4 w-4 text-muted-foreground" />
          </TooltipTrigger>
          <TooltipContent>
            <p>{description}</p>
          </TooltipContent>
        </Tooltip>
      </div>
      <div className="relative w-32 h-32">
        <svg className="w-full h-full transform -rotate-135" viewBox="0 0 100 100">
          <circle
            className="text-gray-300"
            strokeWidth="10"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx="50"
            cy="50"
            strokeDasharray={partialCircumference}
            strokeDashoffset="0"
          />
          <motion.circle
            className={color}
            strokeWidth="10"
            strokeDasharray={partialCircumference}
            strokeDashoffset={partialCircumference} // Start fully hidden
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx="50"
            cy="50"
            animate={{ strokeDashoffset: dashoffset }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-3xl font-bold text-foreground">
          {score}%
        </div>
      </div>
    </div>
  );
};


const Meters: React.FC<MetersProps> = ({
  competencyScore = 85, // Placeholder score
  agencyScore = 70, // Placeholder score
}) => {
  return (
    <TooltipProvider>
      <div className="flex flex-col sm:flex-row gap-4">
        <MeterArc
          score={competencyScore}
          color="text-green-500"
          title="Competency"
          description="Competency: Reflects the candidate's skills and knowledge."
        />
        <MeterArc
          score={agencyScore}
          color="text-blue-500"
          title="Agency"
          description="Agency: Represents the candidate's proactive and self-driven nature."
        />
      </div>
    </TooltipProvider>
  );
};

export default Meters;
