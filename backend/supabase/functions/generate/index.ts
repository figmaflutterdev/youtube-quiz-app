// @ts-ignore
/// <reference types="https://deno.land/x/deno_types@0.1.0/mod.d.ts" />
import { serve } from "https://deno.land/std/http/server.ts";

async function fetchTranscriptFromYoutube(videoId: string): Promise<string> {
  try {
    console.error(`[DEBUG] Fetching transcript for videoId: ${videoId}`);

    // Use youtube-transcript API endpoint (works from server)
    const transcriptRes = await fetch(
      `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      }
    );

    if (transcriptRes.ok) {
      const xml = await transcriptRes.text();
      const textMatches = xml.match(/<text[^>]*>(.*?)<\/text>/gs) || [];

      if (textMatches.length > 0) {
        const transcript = textMatches
          .map((match: string) => match.replace(/<[^>]*>/g, ""))
          .map((text: string) =>
            text
              .replace(/&amp;/g, "&")
              .replace(/&lt;/g, "<")
              .replace(/&gt;/g, ">")
              .replace(/&quot;/g, '"')
              .replace(/&#39;/g, "'")
              .trim()
          )
          .filter((text: string) => text.length > 0)
          .join(" ");

        if (transcript.length > 50) {
          console.error(`[DEBUG] Transcript fetched, length: ${transcript.length}`);
          return transcript.slice(0, 12000);
        }
      }
    }

    // Fallback: Try auto-generated captions
    const autoRes = await fetch(
      `https://www.youtube.com/api/timedtext?v=${videoId}&kind=asr&lang=en`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      }
    );

    if (autoRes.ok) {
      const xml = await autoRes.text();
      const textMatches = xml.match(/<text[^>]*>(.*?)<\/text>/gs) || [];

      if (textMatches.length > 0) {
        const transcript = textMatches
          .map((match: string) => match.replace(/<[^>]*>/g, ""))
          .map((text: string) =>
            text
              .replace(/&amp;/g, "&")
              .replace(/&lt;/g, "<")
              .replace(/&gt;/g, ">")
              .replace(/&quot;/g, '"')
              .replace(/&#39;/g, "'")
              .trim()
          )
          .filter((text: string) => text.length > 0)
          .join(" ");

        if (transcript.length > 50) {
          console.error(
            `[DEBUG] Auto-generated transcript fetched, length: ${transcript.length}`
          );
          return transcript.slice(0, 12000);
        }
      }
    }

    throw new Error(
      "No captions found for this video. Please use a video with captions enabled."
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch transcript";
    console.error(`[ERROR] ${message}`);
    throw new Error(message);
  }
}

serve(async (req: Request) => {
  try {
    const { videoId, transcript, type } = await req.json();

    // Support both modes:
    // 1. Frontend sends videoId (backend fetches transcript)
    // 2. Frontend sends transcript directly (backend processes it)

    let cleanedTranscript: string;

    if (videoId) {
      // Mode 1: Fetch transcript from YouTube using videoId
      console.error(`[DEBUG] Received videoId: ${videoId}`);
      cleanedTranscript = await fetchTranscriptFromYoutube(videoId);
    } else if (transcript) {
      // Mode 2: Use provided transcript
      console.error(`[DEBUG] Received transcript directly, length: ${transcript.length}`);
      if (typeof transcript !== "string" || transcript.length < 50) {
        return new Response(
          JSON.stringify({
            error: "Transcript must be a non-empty string with meaningful content",
          }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
      cleanedTranscript = transcript;
    } else {
      return new Response(
        JSON.stringify({ error: "videoId or transcript is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!type) {
      return new Response(
        JSON.stringify({ error: "type is required (quiz or notes)" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Clean transcript
    cleanedTranscript = cleanedTranscript
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 12000);

    console.error(`[DEBUG] Type: ${type}`);

    // Dynamic prompt
    let prompt = "";

    if (type === "quiz") {
      prompt = `
You are an AI teacher.

From the transcript below, generate exactly 5 multiple choice questions based ONLY on the actual content.
Each question must have 4 meaningful options and one correct answer.

Return ONLY valid JSON with no markdown, no code fences, no explanation:
{
  "quiz": [
    {
      "question": "actual question about the content",
      "options": ["option1", "option2", "option3", "option4"],
      "answer": "the correct option text"
    }
  ]
}

Transcript:
${cleanedTranscript}
      `;
    } else if (type === "notes") {
      prompt = `
You are an AI tutor.

From the transcript below, generate clean structured notes based ONLY on the actual content.
Use bullet points and keep it simple and readable.

Return ONLY valid JSON with no markdown, no code fences, no explanation:
{
  "notes": "your notes here with bullet points using \\n• for each point"
}

Transcript:
${cleanedTranscript}
      `;
    } else {
      return new Response(
        JSON.stringify({ error: "Invalid type. Use 'quiz' or 'notes'" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // OpenRouter API call
    // @ts-ignore
    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY")!;

    if (!OPENROUTER_API_KEY) {
      return new Response(
        JSON.stringify({ error: "OPENROUTER_API_KEY is not set in environment" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const openrouterRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://your-app-url.com",
        "X-Title": "YouTube Quiz & Notes App",
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-001",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    if (!openrouterRes.ok) {
      const errorData = await openrouterRes.json();
      throw new Error(
        `OpenRouter API Error: ${openrouterRes.status} - ${JSON.stringify(errorData)}`
      );
    }

    const openrouterData = await openrouterRes.json();

    const output = openrouterData?.choices?.[0]?.message?.content || "";

    if (!output) {
      console.error("OpenRouter Response:", JSON.stringify(openrouterData, null, 2));
      throw new Error("No response text from OpenRouter API");
    }

    // Parse safely
    let parsed;
    try {
      parsed = JSON.parse(output);
    } catch {
      parsed = { raw: output };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`[ERROR] ${message}`);

    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});