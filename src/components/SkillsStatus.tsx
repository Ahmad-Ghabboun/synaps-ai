import React from "react";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function SkillsStatus({ activeStep }: { activeStep: number }) {
  const steps = [
    { label: "Extraction", desc: "Architect" },
    { label: "Cross-Validation", desc: "Claude & Gemini" },
    { label: "Adjudication", desc: "Synaps" },
  ];

  return (
    <div className="flex items-center gap-4">
      {steps.map((step, i) => {
        const isActive = activeStep === i;
        const isComplete = activeStep > i;

        return (
          <div key={i} className="flex items-center gap-2">
            <div
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full border text-[10px] font-medium transition-colors",
                isActive
                  ? "border-primary text-primary bg-primary/10"
                  : isComplete
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-muted-foreground/30 text-muted-foreground/50"
              )}
            >
              {isComplete ? (
                <Check className="h-3.5 w-3.5" />
              ) : isActive ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                i + 1
              )}
            </div>
            <div className="flex flex-col">
              <span
                className={cn(
                  "text-xs font-medium leading-none",
                  isActive || isComplete ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
              {isActive && (
                <span className="text-[10px] text-muted-foreground leading-none mt-0.5">
                  {step.desc}
                </span>
              )}
            </div>
            {i < steps.length - 1 && (
              <div className="h-px w-8 bg-border" />
            )}
          </div>
        );
      })}
    </div>
  );
}
