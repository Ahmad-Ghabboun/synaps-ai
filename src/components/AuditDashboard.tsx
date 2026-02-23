import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import type { AuditResult, Risk } from "@/types/synaps";

interface AuditDashboardProps {
  score: number;
  grade: string;
  auditResult: AuditResult | null;
  sectionsCount: number;
}

export default function AuditDashboard({ score, grade, auditResult, sectionsCount }: AuditDashboardProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const [barsVisible, setBarsVisible] = useState(false);
  const [countersReady, setCountersReady] = useState(false);

  const risks = auditResult?.risks || [];
  const criticalCount = risks.filter((r: Risk) => r.severity === "critical").length;
  const moderateCount = risks.filter((r: Risk) => r.severity === "moderate").length;
  const totalGaps = criticalCount + moderateCount;
  const highConfidenceCount = risks.filter((r: Risk) => r.confidence === "high").length;
  const normalConfidenceCount = risks.filter((r: Risk) => r.confidence !== "high").length;
  const resolvedCount = 0;

  useEffect(() => {
    let frame: number;
    let start: number | null = null;
    const duration = 1200;
    const animate = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      setAnimatedScore(Math.round(progress * score));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    const timer = setTimeout(() => { frame = requestAnimationFrame(animate); }, 200);
    return () => { clearTimeout(timer); cancelAnimationFrame(frame); };
  }, [score]);

  useEffect(() => {
    const t = setTimeout(() => setBarsVisible(true), 800);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setCountersReady(true), 1200);
    return () => clearTimeout(t);
  }, []);

  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedScore / 100) * circumference;

  const confidenceTotal = highConfidenceCount + normalConfidenceCount;
  const confidenceRatioValue = confidenceTotal > 0 ? highConfidenceCount / confidenceTotal : 0;

  const bars = [
    {
      label: "Critical Gaps",
      value: totalGaps > 0 ? criticalCount / totalGaps : 0,
      display: `${criticalCount}/${totalGaps}`,
      badge: "High Severity",
      colorClass: "audit-bar-red",
    },
    {
      label: "High Confidence",
      value: totalGaps > 0 ? highConfidenceCount / totalGaps : 0,
      display: `${totalGaps > 0 ? Math.round((highConfidenceCount / totalGaps) * 100) : 0}%`,
      badge: "AI Validated",
      colorClass: "audit-bar-blue",
    },
    {
      label: "Section Coverage",
      value: Math.min(sectionsCount / 12, 1),
      display: `${sectionsCount}/12`,
      badge: "Completeness",
      colorClass: "audit-bar-green",
    },
    {
      label: "Confidence Ratio",
      value: confidenceRatioValue,
      display: `${highConfidenceCount} High / ${normalConfidenceCount} Moderate`,
      badge: "Reliability",
      colorClass: "audit-bar-purple",
      isSplit: true,
      splitParts: { high: highConfidenceCount, normal: normalConfidenceCount },
    },
    {
      label: "Gap Resolution Rate",
      value: totalGaps > 0 ? resolvedCount / totalGaps : 0,
      display: totalGaps > 0 ? `${resolvedCount}/${totalGaps}` : "—",
      badge: "Progress",
      colorClass: "audit-bar-teal",
      emptyLabel: totalGaps > 0 ? "Fix issues to track progress" : undefined,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Section A: Glowing Circular Ring */}
      <div className="flex flex-col items-center">
        <div className="relative w-[220px] h-[220px]">
          <svg
            width="220" height="220" viewBox="0 0 220 220"
            className="absolute inset-0 audit-ring-glow-rotate"
          >
            <defs>
              <linearGradient id="glow-gradient-light" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(217, 91%, 60%)" stopOpacity="0.4" />
                <stop offset="100%" stopColor="hsl(245, 58%, 51%)" stopOpacity="0.15" />
              </linearGradient>
              <linearGradient id="glow-gradient-dark" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(185, 96%, 55%)" stopOpacity="0.5" />
                <stop offset="100%" stopColor="hsl(270, 80%, 60%)" stopOpacity="0.2" />
              </linearGradient>
            </defs>
            <circle
              cx="110" cy="110" r={radius + 8}
              fill="none"
              className="stroke-[hsl(217,91%,60%)]/30 dark:stroke-[hsl(185,96%,55%)]/40"
              strokeWidth="5"
              style={{ filter: "blur(4px)" }}
            />
          </svg>

          <svg width="220" height="220" viewBox="0 0 220 220" className="-rotate-90 relative z-10 audit-ring-svg">
            <defs>
              <linearGradient id="ring-gradient-light" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(217, 91%, 60%)" />
                <stop offset="100%" stopColor="hsl(245, 58%, 51%)" />
              </linearGradient>
              <linearGradient id="ring-gradient-dark" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(185, 96%, 55%)" />
                <stop offset="100%" stopColor="hsl(270, 80%, 60%)" />
              </linearGradient>
            </defs>
            <circle cx="110" cy="110" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="12" opacity="0.3" />
            <circle
              cx="110" cy="110" r={radius} fill="none"
              className="audit-ring-stroke"
              strokeWidth="12"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 1.2s ease-out" }}
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
            <span className="text-6xl font-bold text-foreground tabular-nums">{animatedScore}</span>
            <span className="text-sm font-semibold text-muted-foreground">{grade}</span>
            <span className="text-xs text-muted-foreground mt-1">Completeness Score</span>
          </div>
        </div>
      </div>

      {/* Section B: Five Metric Bar Rows */}
      <div className="space-y-2">
        {bars.map((bar, i) => (
          <div
            key={bar.label}
            className="rounded-xl border border-border bg-card p-3 shadow-sm"
            style={{ opacity: barsVisible ? 1 : 0, transform: barsVisible ? "translateY(0)" : "translateY(8px)", transition: `all 0.4s ease-out ${i * 100}ms` }}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-medium text-foreground">{bar.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground tabular-nums">{bar.display}</span>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{bar.badge}</Badge>
              </div>
            </div>
            {bar.isSplit && bar.splitParts ? (
              <div className="relative h-2 rounded-full bg-muted overflow-hidden flex">
                <div
                  className="audit-bar-purple audit-bar-shimmer rounded-l-full"
                  style={{
                    width: barsVisible ? `${confidenceTotal > 0 ? (bar.splitParts.high / confidenceTotal) * 100 : 0}%` : "0%",
                    transition: `width 0.8s ease-out ${i * 100 + 400}ms`,
                  }}
                />
                <div
                  className="bg-muted-foreground/30 rounded-r-full"
                  style={{
                    width: barsVisible ? `${confidenceTotal > 0 ? (bar.splitParts.normal / confidenceTotal) * 100 : 0}%` : "0%",
                    transition: `width 0.8s ease-out ${i * 100 + 400}ms`,
                  }}
                />
              </div>
            ) : (
              <div className="relative h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={`absolute inset-y-0 left-0 rounded-full ${bar.colorClass} audit-bar-shimmer`}
                  style={{
                    width: barsVisible ? `${bar.value * 100}%` : "0%",
                    transition: `width 0.8s ease-out ${i * 100 + 400}ms`,
                  }}
                />
              </div>
            )}
            {bar.emptyLabel && bar.value === 0 && (
              <p className="text-[10px] text-muted-foreground mt-1 italic">{bar.emptyLabel}</p>
            )}
          </div>
        ))}
      </div>

      {/* Section C: Three Flip Counter Cards */}
      <div className="grid grid-cols-3 gap-3">
        <FlipCard label="Critical" value={criticalCount} ready={countersReady} colorClass="audit-counter-red" />
        <FlipCard label="Moderate" value={moderateCount} ready={countersReady} colorClass="audit-counter-yellow" />
        <FlipCard label="Sections" value={sectionsCount} ready={countersReady} colorClass="audit-counter-neutral" />
      </div>
    </div>
  );
}

function FlipCard({ label, value, ready, colorClass }: { label: string; value: number; ready: boolean; colorClass: string }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!ready) return;
    let current = 0;
    const target = value;
    if (target === 0) { setDisplayValue(0); return; }
    const step = Math.max(1, Math.floor(target / 10));
    const interval = setInterval(() => {
      current += step;
      if (current >= target) { current = target; clearInterval(interval); }
      setDisplayValue(current);
    }, 60);
    return () => clearInterval(interval);
  }, [ready, value]);

  return (
    <div className={`rounded-xl border p-6 flex flex-col items-center gap-2 shadow-sm ${colorClass} ${ready ? "audit-counter-breathe" : ""}`}>
      <span
        className="text-4xl font-bold tabular-nums text-foreground"
        style={{
          transform: ready ? "rotateX(0deg)" : "rotateX(90deg)",
          transition: "transform 0.6s ease-out",
          display: "inline-block",
        }}
      >
        {displayValue}
      </span>
      <span className="text-xs text-muted-foreground font-medium">{label}</span>
    </div>
  );
}
