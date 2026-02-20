import React from "react";
import { Check } from "lucide-react";

// Pipeline stepper
export function SkillsStatus({ activeStep }: { activeStep: number }) {
  const steps = [
    { label: "Skill 1: Extraction", desc: "The Architect" },
    { label: "Skill 2: Computation", desc: "The Dual Auditor" },
    { label: "Skill 3: Optimization", desc: "The Optimizer" },
  ];

  return (
    <div className="flex items-center gap-6">
      {steps.map((step, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className={`relative w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all ${
            i < activeStep
              ? "bg-primary border-primary"
              : i === activeStep
              ? "border-primary"
              : "border-border"
          }`}>
            {i < activeStep ? (
              <Check className="h-4 w-4 text-primary-foreground" />
            ) : i === activeStep ? (
              <>
                <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                <div className="absolute inset-0 rounded-full border-2 border-primary animate-pulse-ring" />
              </>
            ) : (
              <div className="w-2.5 h-2.5 rounded-full bg-muted" />
            )}
          </div>
          <div>
            <p className={`text-xs font-medium ${i <= activeStep ? "text-foreground" : "text-muted-foreground"}`}>{step.label}</p>
            <p className="text-xs text-muted-foreground">{step.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
