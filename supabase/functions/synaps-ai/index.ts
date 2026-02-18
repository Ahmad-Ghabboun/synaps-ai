import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ARCHITECT_PROMPT = `You are a Technical Architect. Your job is to take a raw project description and extract the Tech Stack, Security Goals, and Project Scope. You must output this information as a structured 'Project Quality Assurance Plan' (SQAP) in Markdown format with clear sections starting with ## for: Executive Summary, Technical Architecture, Security Requirements, Implementation Scope, and Risk Considerations. Be thorough, specific, and technically detailed.`;

const AUDITOR_PROMPT = `Analyze the provided SQAP document. Compute a Quality Score from 0 to 100 based on security best practices and technical feasibility. Identify specific 'Critical' and 'Moderate' risks.
You MUST output STRICTLY in JSON format with NO markdown formatting, NO backticks, NO additional text. Use this exact structure:
{"qualityScore": <number 0-100>, "grade": "<letter A-F>", "risks": [{"severity": "critical" or "moderate", "title": "<short title>", "description": "<detailed description>", "section": "<which SQAP section>", "impact": "<business impact>"}]}
Return ONLY valid JSON.`;

const OPTIMIZER_PROMPT = `You are a Security Architect. Fix the following security or technical flaw using industry best practices including PCI-DSS, OAuth 2.0, encryption standards (AES-256), tokenization, and secure third-party integrations. Output the corrected section content in Markdown format (without the ## heading) that can replace the flawed section in the original document. Include specific implementation details and security standards used.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { skill, description, sqap, section, title, description: riskDesc } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    let systemPrompt = "";
    let userMessage = "";

    switch (skill) {
      case "architect":
        systemPrompt = ARCHITECT_PROMPT;
        userMessage = `Project Description:\n${description}\n\nOutput a detailed SQAP in Markdown format.`;
        break;
      case "auditor":
        systemPrompt = AUDITOR_PROMPT;
        userMessage = `SQAP Document:\n${sqap}\n\nReturn ONLY valid JSON.`;
        break;
      case "optimizer":
        systemPrompt = OPTIMIZER_PROMPT;
        userMessage = `Flawed Section: ${section}\nIssue: ${title}\nDescription: ${riskDesc}\n\nOriginal SQAP:\n${sqap}\n\nOutput the corrected section content in Markdown.`;
        break;
      default:
        return new Response(JSON.stringify({ error: "Invalid skill" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits in Settings → Workspace → Usage." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content || "";

    let result: any;
    if (skill === "auditor") {
      // Parse JSON from response
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return new Response(JSON.stringify({ error: "Failed to parse audit JSON" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const parsed = JSON.parse(jsonMatch[0]);
      // Add IDs to risks
      parsed.risks = (parsed.risks || []).map((r: any, i: number) => ({
        ...r,
        id: `risk-${Date.now()}-${i}`,
      }));
      parsed.rawJson = jsonMatch[0];
      result = parsed;
    } else {
      result = rawContent;
    }

    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("synaps-ai error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
