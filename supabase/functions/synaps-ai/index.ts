import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PERSONA_CONTEXT: Record<string, string> = {
  TPM: "The user is a Technical Project Manager. Emphasize timeline risks, stakeholder communication, dependency management, and delivery milestones.",
  Analyst: "The user is an Analyst. Emphasize data integrity, methodology rigor, quantitative metrics, and analytical frameworks.",
  Entrepreneur: "The user is an Entrepreneur. Emphasize market viability, competitive advantage, cost efficiency, and go-to-market strategy.",
};

function buildArchitectPrompt(persona: string, deadline: string): string {
  const personaCtx = PERSONA_CONTEXT[persona] || PERSONA_CONTEXT.TPM;
  const deadlineCtx = deadline ? `\nProject Deadline: ${new Date(deadline).toLocaleDateString()}. Factor this deadline into risk assessments and timeline recommendations.` : "";
  return `You are a Technical Architect creating a Project Quality Assurance Plan (SQAP).
${personaCtx}${deadlineCtx}

Generate 3 professional Markdown documents combined into one output with clear ## section headers:
1. Executive Summary (include deadline if provided), Technical Architecture, Security Requirements
2. Implementation Scope, Risk Considerations
3. Quality Metrics, Compliance Requirements

Be thorough, specific, and technically detailed. Tailor language and emphasis to the user's persona.`;
}

function buildTechAuditorPrompt(persona: string): string {
  const personaCtx = PERSONA_CONTEXT[persona] || PERSONA_CONTEXT.TPM;
  return `You are an independent Technical Risk Auditor. ${personaCtx}
Analyze the document and identify genuine technical gaps that could cause the project to fail.
Be fair — score relative to what a ${persona} planning document at this stage should contain.
You MUST output STRICTLY in JSON with NO markdown, NO backticks, NO extra text:
{"qualityScore": <number 0-100>, "grade": "<letter A-F>", "risks": [{"severity": "critical" or "moderate", "title": "<short title>", "description": "<detailed description>", "section": "<which section>", "impact": "<business impact>"}]}`;
}

function buildBusinessAuditorPrompt(persona: string): string {
  const personaCtx = PERSONA_CONTEXT[persona] || PERSONA_CONTEXT.TPM;
  return `You are an independent Business Risk Auditor. ${personaCtx}
Analyze the document and identify genuine business gaps that could cause the project to fail.
Be fair — score relative to what a ${persona} planning document at this stage should contain.
You MUST output STRICTLY in JSON with NO markdown, NO backticks, NO extra text:
{"qualityScore": <number 0-100>, "grade": "<letter A-F>", "risks": [{"severity": "critical" or "moderate", "title": "<short title>", "description": "<detailed description>", "section": "<which section>", "impact": "<business impact>"}]}`;
}

const OPTIMIZER_PROMPT = `You are a Security Architect. You will receive a complete SQAP document and a specific flaw to fix.

CRITICAL RULES:
1. You MUST output the ENTIRE SQAP document with the fix merged into the relevant section.
2. NEVER remove, omit, or shorten any existing sections, headings, or content.
3. Treat the current SQAP as a base document. Append or intelligently merge new technical requirements under the appropriate ## headers.
4. Use industry best practices including PCI-DSS, OAuth 2.0, encryption standards (AES-256), tokenization, and secure third-party integrations.
5. Include specific implementation details and security standards used in your fix.
6. Output the full corrected SQAP in Markdown format, preserving all ## section headers exactly as they appear.`;

function mergeAuditResults(tech: any, business: any): any {
  const avgScore = Math.round((tech.qualityScore + business.qualityScore) / 2);
  const gradeMap = (s: number) => s >= 90 ? "A" : s >= 80 ? "B" : s >= 70 ? "C" : s >= 60 ? "D" : "F";

  // Merge and deduplicate risks via keyword matching
  const allRisks = [...(tech.risks || []), ...(business.risks || [])];
  const merged: any[] = [];
  const used = new Set<number>();

  // Pre-compute word sets for optimization
  const riskWordSets = allRisks.map((r: any) => 
    new Set((r.title || "").toLowerCase().split(/\s+/).filter((w: string) => w.length > 3))
  );

  for (let i = 0; i < allRisks.length; i++) {
    if (used.has(i)) continue;
    let risk = { ...allRisks[i], confidence: "normal" as string };
    const titleWords = riskWordSets[i];

    for (let j = i + 1; j < allRisks.length; j++) {
      if (used.has(j)) continue;
      const otherWords = riskWordSets[j];
      let overlap = 0;
      titleWords.forEach((w) => { if (otherWords.has(w)) overlap++; });

      if (overlap >= 2 || risk.section === allRisks[j].section && overlap >= 1) {
        risk.confidence = "high";
        risk.description = risk.description + " " + allRisks[j].description;
        if (allRisks[j].severity === "critical") risk.severity = "critical";
        used.add(j);
      }
    }
    risk.id = `risk-${Date.now()}-${i}`;
    merged.push(risk);
    used.add(i);
  }

  return {
    qualityScore: avgScore,
    grade: gradeMap(avgScore),
    risks: merged,
    rawJson: JSON.stringify({ techScore: tech.qualityScore, businessScore: business.qualityScore, avgScore, risks: merged }),
  };
}

async function callLLM(systemPrompt: string, userMessage: string, apiKey: string) {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
    }),
  });

  if (!response.ok) {
    if (response.status === 429) throw { status: 429, message: "Rate limit exceeded. Please try again later." };
    if (response.status === 402) throw { status: 402, message: "AI credits exhausted. Please add credits in Settings → Workspace → Usage." };
    const errorText = await response.text();
    console.error("AI gateway error:", response.status, errorText);
    throw { status: response.status, message: `AI gateway error: ${errorText}` };
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

function parseAuditJson(raw: string) {
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Failed to parse audit JSON");
  return JSON.parse(jsonMatch[0]);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { skill, description, sqap, section, title, description: riskDesc, persona, deadline } = body;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    let result: any;

    switch (skill) {
      case "architect": {
        const systemPrompt = buildArchitectPrompt(persona || "TPM", deadline || "");
        const userMessage = `Project Description:\n${description}\n\nOutput a detailed SQAP in Markdown format.`;
        result = await callLLM(systemPrompt, userMessage, LOVABLE_API_KEY);
        break;
      }
      case "auditor": {
        // Run dual audit: Technical + Business personas
        const userMessage = `SQAP Document:\n${sqap}\n\nReturn ONLY valid JSON.`;
        const [techRaw, bizRaw] = await Promise.all([
        callLLM(buildTechAuditorPrompt(persona || "TPM"), userMessage, LOVABLE_API_KEY),
        callLLM(buildBusinessAuditorPrompt(persona || "TPM"), userMessage, LOVABLE_API_KEY),
      ]);
        const techResult = parseAuditJson(techRaw);
        const bizResult = parseAuditJson(bizRaw);
        result = mergeAuditResults(techResult, bizResult);
        break;
      }
      case "optimizer": {
        const userMessage = `Flawed Section: ${section}\nIssue: ${title}\nDescription: ${riskDesc}\n\nOriginal SQAP:\n${sqap}\n\nOutput the full corrected SQAP in Markdown.`;
        result = await callLLM(OPTIMIZER_PROMPT, userMessage, LOVABLE_API_KEY);
        break;
      }
      default:
        return new Response(JSON.stringify({ error: "Invalid skill" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("synaps-ai error:", e);
    const status = e.status || 500;
    const message = e.message || (e instanceof Error ? e.message : "Unknown error");
    return new Response(
      JSON.stringify({ error: message }),
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
