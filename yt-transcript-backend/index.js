import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { YoutubeTranscript } = require("youtube-transcript");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Extract video ID
function extractVideoId(url) {
  // Handle various YouTube URL formats
  let videoId = null;
  
  // Try youtu.be short format: https://youtu.be/VIDEO_ID or youtu.be/VIDEO_ID?...
  if (url.includes('youtu.be/')) {
    const match = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
    if (match) videoId = match[1];
  }
  
  // Try youtube.com format: youtube.com/watch?v=VIDEO_ID
  if (!videoId) {
    const match = url.match(/youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]+)/);
    if (match) videoId = match[1];
  }
  
  // Try if it's just a video ID directly
  if (!videoId && /^[a-zA-Z0-9_-]{11}$/.test(url)) {
    videoId = url;
  }
  
  return videoId;
}

// API route
app.post("/transcript", async (req, res) => {
  try {
    const { url, user_id } = req.body;

    if (!url || !user_id) {
      return res.status(400).json({ error: "Missing url or user_id" });
    }

    console.log("Received URL:", url);
    const videoId = extractVideoId(url);

    console.log("Extracted video ID:", videoId);
    if (!videoId) {
      return res.status(400).json({ 
        error: "Invalid YouTube URL. Could not extract video ID.",
        received_url: url
      });
    }

    console.log("Fetching transcript for video:", videoId);
    // 🔥 Fetch transcript
    let transcriptData;
    try {
      transcriptData = await YoutubeTranscript.fetchTranscript(videoId);
    } catch (fetchErr) {
      console.error("Error fetching transcript:", fetchErr.message);
      return res.status(400).json({
        error: "Failed to fetch transcript",
        details: fetchErr.message,
        video_id: videoId
      });
    }

    console.log("Transcript data type:", typeof transcriptData);
    console.log("Transcript data length:", Array.isArray(transcriptData) ? transcriptData.length : "Not an array");
    console.log("Transcript data:", transcriptData);
    
    if (transcriptData) {
      console.log("First item:", transcriptData[0]);
      console.log("Raw transcript data:", JSON.stringify(transcriptData).substring(0, 500));
    }

    if (!transcriptData || transcriptData.length === 0) {
      return res.status(400).json({
        error: "No transcript data found for this video",
        video_id: videoId
      });
    }

    const transcript = transcriptData.map(t => {
      console.log("Item:", t);
      return t.text || "";
    }).join(" ").trim();

    console.log("Transcript length:", transcript.length);
    console.log("Saving to Supabase...");
    
    // 🔥 Save to Supabase
    const { error } = await supabase.from("transcripts").insert({
      user_id,
      video_id: videoId,
      transcript
    });

    if (error) {
      console.error("Supabase error:", error);
      return res.status(500).json({ error: error.message });
    }

    console.log("Successfully saved!");
    return res.json({
      success: true,
      video_id: videoId,
      length: transcript.length
    });

  } catch (err) {
    console.error("Error:", err);
    return res.status(500).json({
      error: "Failed to extract transcript",
      details: err.message
    });
  }
});

// Start server
app.listen(process.env.PORT, () => {
  console.log(`Server running on http://localhost:${process.env.PORT}`);
});

// Test endpoint
app.get("/test", (req, res) => {
  res.json({
    status: "OK",
    YoutubeTranscript_available: !!YoutubeTranscript,
    has_fetchTranscript: typeof YoutubeTranscript?.fetchTranscript === "function"
  });
});