// SYNAPS 2.0 — Embedding-Based Semantic Confidence Scoring
// Upgraded: mergeAuditResults() now uses Gemini text-embedding-004 + cosine similarity
// Branch: feature/embedding-confidence-scoring

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

// ─────────────────────────────────────────────
// SYNAPS 2.0 ML UPGRADE: EMBEDDING UTILITIES
// ─────────────────────────────────────────────

/**
 * Fetches a text embedding vector from Google Gemini text-embedding-004.
 * Used to semantically compare audit gap descriptions across both auditors.
 * 
 * Model: text-embedding-004
 * Dimension: 768
 * API: generativelanguage.googleapis.com
 */
async function getEmbedding(text: string, apiKey: string): Promise<number[]> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "models/text-embedding-004",
        content: { parts: [{ text }] },
      }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    console.error("Embedding API error:", response.status, err);
    throw new Error(`Embedding API error: ${response.status}`);
  }

  const data = await response.json();
  return data.embedding?.values ?? [];
}

/**
 * Computes cosine similarity between two embedding vectors.
 * Returns a value between -1 and 1.
 * 1.0 = identical meaning, 0 = unrelated, -1 = opposite meaning.
 * 
 * Synaps 2.0 threshold:
 *   >= 0.82 → HIGH CONFIDENCE (both auditors flagged the same semantic gap)
 *   >= 0.50 → MODERATE (partial overlap — single auditor flag)
 *   <  0.50 → no meaningful match
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

// ─────────────────────────────────────────────
// SYNAPS 2.0: UPGRADED mergeAuditResults()
// Replaces: keyword overlap (Synaps 1.0)
// With:     cosine similarity via Gemini embeddings
// ─────────────────────────────────────────────

/**
 * SYNAPS 2.0 JUDGE SYSTEM
 *
 * Merges findings from Technical Auditor (Auditor A) and Business Auditor (Auditor B).
 * Uses semantic embedding similarity to determine confidence level per gap.
 *
 * Confidence Logic:
 *   HIGH CONFIDENCE   → cosine similarity >= 0.82 (both auditors flagged same gap)
 *   MODERATE          → cosine similarity 0.50–0.81 (partial semantic match)
 *   normal (single)   → no match found in other auditor's output
 *
 * Why this matters vs Synaps 1.0:
 *   1.0 would miss: "incident recovery procedure" matching "rollback plan"
 *   2.0 catches it:  both phrases embed similarly → similarity > 0.82 → HIGH CONFIDENCE
 *
 * @param tech    - Output from Technical Auditor (Auditor A)
 * @param business - Output from Business Auditor (Auditor B)
 * @param geminiApiKey - Gemini API key for text-embedding-004
 */
async function mergeAuditResults(tech: any, business: any, geminiApiKey: string): Promise<any> {
  const avgScore = Math.round((tech.qualityScore + business.qualityScore) / 2);
  const gradeMap = (s: number) =>
    s >= 90 ? "A" : s >= 80 ? "B" : s >= 70 ? "C" : s >= 60 ? "D" : "F";

  const techRisks = tech.risks || [];
  const bizRisks = business.risks || [];

  // ── Step 1: Generate embeddings for all risks from both auditors
  // We embed: title + description for richer semantic signal
  console.log(`[Synaps 2.0] Generating embeddings for ${techRisks.length} tech risks and ${bizRisks.length} biz risks...`);

  const techTexts = techRisks.map((r: any) => `${r.title}. ${r.description}`);
  const bizTexts = bizRisks.map((r: any) => `${r.title}. ${r.description}`);

  // Fetch all embeddings in parallel for performance
  const [techEmbeddings, bizEmbeddings] = await Promise.all([
    Promise.all(techTexts.map((t: string) => getEmbedding(t, geminiApiKey))),
    Promise.all(bizTexts.map((t: string) => getEmbedding(t, geminiApiKey))),
  ]);

  // ── Step 2: Build similarity matrix and assign confidence
  const merged: any[] = [];
  const usedBizIndices = new Set<number>();

  // Process each Tech Auditor gap
  for (let i = 0; i < techRisks.length; i++) {
    const risk = { ...techRisks[i], confidence: "normal" as string, similarityScore: 0 };

    let bestSimilarity = 0;
    let bestMatchIdx = -1;

    // Compare against every Business Auditor gap
    for (let j = 0; j < bizRisks.length; j++) {
      if (usedBizIndices.has(j)) continue;
      const sim = cosineSimilarity(techEmbeddings[i], bizEmbeddings[j]);

      if (sim > bestSimilarity) {
        bestSimilarity = sim;
        bestMatchIdx = j;
      }
    }

    // Apply Synaps 2.0 confidence thresholds
    if (bestSimilarity >= 0.82 && bestMatchIdx !== -1) {
      // HIGH CONFIDENCE: both auditors independently flagged same semantic gap
      risk.confidence = "high";
      risk.similarityScore = Math.round(bestSimilarity * 100) / 100;
      risk.description = `${risk.description} ${bizRisks[bestMatchIdx].description}`;
      if (bizRisks[bestMatchIdx].severity === "critical") risk.severity = "critical";
      usedBizIndices.add(bestMatchIdx);
      console.log(`[Synaps 2.0] HIGH CONFIDENCE match: "${risk.title}" ↔ "${bizRisks[bestMatchIdx].title}" (similarity: ${bestSimilarity.toFixed(3)})`);
    } else if (bestSimilarity >= 0.50 && bestMatchIdx !== -1) {
      // MODERATE: partial semantic overlap — flag transparently
      risk.confidence = "normal";
      risk.similarityScore = Math.round(bestSimilarity * 100) / 100;
      console.log(`[Synaps 2.0] MODERATE match: "${risk.title}" (similarity: ${bestSimilarity.toFixed(3)})`);
    } else {
      // Single auditor flag — no meaningful match
      risk.similarityScore = Math.round(bestSimilarity * 100) / 100;
    }

    risk.id = `risk-${Date.now()}-tech-${i}`;
    merged.push(risk);
  }

  // ── Step 3: Add unmatched Business Auditor gaps (unique findings)
  for (let j = 0; j < bizRisks.length; j++) {
    if (usedBizIndices.has(j)) continue;
    const risk = {
      ...bizRisks[j],
      confidence: "normal",
      similarityScore: 0,
      id: `risk-${Date.now()}-biz-${j}`,
    };
    merged.push(risk);
    console.log(`[Synaps 2.0] Unique Business gap (no Tech match): "${risk.title}"`);
  }

  // ── Step 4: Sort — HIGH CONFIDENCE + critical gaps surface first
  merged.sort((a, b) => {
    if (a.confidence === "high" && b.confidence !== "high") return -1;
    if (b.confidence === "high" && a.confidence !== "high") return 1;
    if (a.severity === "critical" && b.severity !== "critical") return -1;
    if (b.severity === "critical" && a.severity !== "critical") return 1;
    return b.similarityScore - a.similarityScore;
  });

  const highConfidenceCount = merged.filter((r) => r.confidence === "high").length;
  console.log(`[Synaps 2.0] Merge complete: ${merged.length} total gaps, ${highConfidenceCount} HIGH CONFIDENCE`);

  return {
    qualityScore: avgScore,
    grade: gradeMap(avgScore),
    risks: merged,
    // Synaps 2.0 metadata — visible in audit.json and dashboard
    auditMetadata: {
      version: "2.0",
      scoringMethod: "embedding-cosine-similarity",
      embeddingModel: "text-embedding-004",
      similarityThreshold: 0.82,
      techScore: tech.qualityScore,
      businessScore: business.qualityScore,
      avgScore,
      totalGaps: merged.length,
      highConfidenceGaps: highConfidenceCount,
      moderateGaps: merged.length - highConfidenceCount,
    },
    rawJson: JSON.stringify({
      techScore: tech.qualityScore,
      businessScore: business.qualityScore,
      avgScore,
      risks: merged,
    }),
  };
}

// ─────────────────────────────────────────────
// PROMPT BUILDERS (unchanged from Synaps 1.0)
// ─────────────────────────────────────────────

function buildArchitectPrompt(persona: string, deadline: string): string {
  const personaCtx = PERSONA_CONTEXT[persona] || PERSONA_CONTEXT.TPM;
  const deadlineCtx = deadline
    ? `\nProject Deadline: ${new Date(deadline).toLocaleDateString()}. Factor this deadline into risk assessments and timeline recommendations.`
    : "";
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

// ─────────────────────────────────────────────
// CORE UTILITIES (unchanged from Synaps 1.0)
// ─────────────────────────────────────────────

async function callLLM(
  systemPrompt: string,
  userMessage: string,
  apiKey: string,
  model: string = "google/gemini-2.5-flash"
) {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
    }),
  });

  if (!response.ok) {
    if (response.status === 429)
      throw { status: 429, message: "Rate limit exceeded. Please try again later." };
    if (response.status === 402)
      throw { status: 402, message: "AI credits exhausted. Please add credits in Settings → Workspace → Usage." };
    const errorText = await response.text();
    console.error("AI gateway error:", response.status, errorText);
    throw { status: response.status, message: `AI gateway error: ${errorText}` };
  }

  try {
    const data = await response.json();
    return data.choices?.[0]?.message?.content || "";
  } catch (e) {
    console.error("Failed to parse LLM response:", e);
    throw { status: 500, message: "Failed to parse AI response" };
  }
}

function parseAuditJson(raw: string) {
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Failed to parse audit JSON");
  return JSON.parse(jsonMatch[0]);
}

// ─────────────────────────────────────────────
// MAIN HANDLER
// ─────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const {
      skill,
      description,
      sqap,
      section,
      title,
      description: riskDesc,
      persona,
      deadline,
    } = body;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not set");
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Synaps 2.0: Gemini API key for embeddings
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

    let result: any;

    switch (skill) {
      case "architect": {
        const systemPrompt = buildArchitectPrompt(persona || "TPM", deadline || "");
        const userMessage = `Project Description:\n${description}\n\nOutput a detailed SQAP in Markdown format.`;
        result = await callLLM(systemPrompt, userMessage, LOVABLE_API_KEY);
        break;
      }

      case "auditor": {
        const userMessage = `SQAP Document:\n${sqap}\n\nReturn ONLY valid JSON.`;

        // Run both auditors in parallel (unchanged from 1.0)
        const [techRaw, bizRaw] = await Promise.all([
          callLLM(
            buildTechAuditorPrompt(persona || "TPM"),
            userMessage,
            LOVABLE_API_KEY,
            "google/gemini-2.5-flash"
          ),
          callLLM(
            buildBusinessAuditorPrompt(persona || "TPM"),
            userMessage,
            LOVABLE_API_KEY,
            "google/gemini-3-pro"
          ),
        ]);

        const techResult = parseAuditJson(techRaw);
        const bizResult = parseAuditJson(bizRaw);

        // ── SYNAPS 2.0: Use embedding-based merge if Gemini key available
        // Falls back to keyword overlap (1.0 behavior) if key not configured
        if (GEMINI_API_KEY) {
          console.log("[Synaps 2.0] Using embedding-based cosine similarity merge");
          result = await mergeAuditResults(techResult, bizResult, GEMINI_API_KEY);
        } else {
          console.warn("[Synaps 1.0 Fallback] GEMINI_API_KEY not set — using keyword overlap merge");
          result = mergeAuditResultsLegacy(techResult, bizResult);
        }
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
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// ─────────────────────────────────────────────
// SYNAPS 1.0 LEGACY FALLBACK (preserved for benchmarking)
// ─────────────────────────────────────────────

function mergeAuditResultsLegacy(tech: any, business: any): any {
  const avgScore = Math.round((tech.qualityScore + business.qualityScore) / 2);
  const gradeMap = (s: number) =>
    s >= 90 ? "A" : s >= 80 ? "B" : s >= 70 ? "C" : s >= 60 ? "D" : "F";

  const allRisks = [...(tech.risks || []), ...(business.risks || [])];
  const merged: any[] = [];
  const used = new Set<number>();

  const riskWordSets = allRisks.map((r: any) =>
    new Set(
      (r.title || "").toLowerCase().split(/\s+/).filter((w: string) => w.length > 3)
    )
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

      if (overlap >= 2 || (risk.section === allRisks[j].section && overlap >= 1)) {
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
    auditMetadata: {
      version: "1.0-legacy",
      scoringMethod: "keyword-overlap",
      techScore: tech.qualityScore,
      businessScore: business.qualityScore,
      avgScore,
    },
    rawJson: JSON.stringify({
      techScore: tech.qualityScore,
      businessScore: business.qualityScore,
      avgScore,
      risks: merged,
    }),
  };
}
