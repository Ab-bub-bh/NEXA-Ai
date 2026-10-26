import express from "express";
import cors from "cors";
import { exec } from "child_process";
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
import { writeFileSync, unlinkSync } from "fs";
import path from "path";
import os from "os";
import { fileURLToPath } from "url";
import { google } from "googleapis";
import nodemailer from "nodemailer";
import crypto from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("🔥🔥🔥 SERVER.JS LOADED - WhatsApp Cloud API v2");

const app = express();
app.use(cors());

app.use(express.json());

const API_BASE = (location.hostname === "localhost" || location.hostname === "127.0.0.1" || location.protocol === "file:")
      ? "http://localhost:5000"
      : "https://nexa-ai-pgs3.onrender.com";

// ============================================
// DATABASE CONNECTION
// ============================================
mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/voiceHistory")
.then(() => console.log("mongoDB Connected"))
.catch(err => console.log(err));

// Voice command history — existing, UNTOUCHED
const voiceSchema = new mongoose.Schema({
    command: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});
const VoiceModel = mongoose.model("VoiceHistory", voiceSchema);

// ✅ NAYA — Groq chat logs ke liye (bilkul alag collection)
const groqLogSchema = new mongoose.Schema({
    userMessage: { type: String, required: true },
    aiResponse: { type: String, required: true },
    model: { type: String },
    tokensUsed: { type: Number },
    createdAt: { type: Date, default: Date.now }
});
const GroqLog = mongoose.model("GroqLog", groqLogSchema);

const imageSchema = new mongoose.Schema({
  prompt: { type: String, required: true },
  imageData: { type: String, required: true }, // Base64 string store hoga
  provider: { type: String, required: true }, // 'nvidia' ya 'pollinations'
  createdAt: { type: Date, default: Date.now }
});

const ImageModel = mongoose.model('Image', imageSchema);



// ==============================================================
// 🚀 TUMHARA MAIN CODE (BILKUL UNTOUCHED - JESA THA WESA HI)
// ==============================================================

const GROQ_API_KEY = process.env.GROQ_API_KEY;

app.post("/speak", async (req, res) => {  
  const { message } = req.body;  
  console.log("Recived message:", message);
  
  try { 
    const lower = message.toLowerCase().trim();

    const isImageRequest = lower.includes("generate") && lower.includes("image");

    if (isImageRequest) {
      try {
        const imageResponse = await fetch(`${API_BASE}/generate-image`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: message }),
        });
        const data = await imageResponse.json();
        return res.json(data);
      } catch (error) {
        return res.status(500).json({ error: "Image route failed" });
      }
    }
    
    const isCricket = lower.startsWith("score") || lower.includes("cricket") || lower.includes("match");
      
if (isCricket) {
  try {
    const cricketResponse = await fetch("https://api.cricapi.com/v1/currentMatches?apikey=bd447f5a-529b-477e-87c9-4047e08687b9&offset=0");
    const cricketData = await cricketResponse.json();
    const match = cricketData.data.find(m => message.toLowerCase().includes(m.teams[0].toLowerCase()) || message.toLowerCase().includes(m.teams[1].toLowerCase()));
    const score = match?.score?.[0];

    let modifiedPrompt = `
Match: ${match?.name}
Score: ${score?.r}/${score?.w} in ${score?.o} overs
Status: ${match?.status}
User asked: ${message}
Reply in one short line with
`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${GROQ_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "llama-3.1-8b-instant", messages: [{ role: "user", content: modifiedPrompt }] }),
    });

    const data = await response.json();
    const finalText = data.output_text || data.choices?.[0]?.message?.content || "No response";
    
    const voiceResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
        method: "POST",
        headers: { "xi-api-key": ELEVENLABS_API_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ text: finalText, voice_settings: { stability: 0.5, similarity_boost: 0.75 } }),
      });

    res.set({ "Content-Type": "audio/mpeg" });
    return voiceResponse.body.pipe(res);

  } catch (error) {
    return res.status(500).json({ error: "Cricket route failed" });
  }
}
    
    const isYoutube = lower.includes("open") && lower.includes("youtube");
    const isWhatsapp = lower.includes("open") && lower.includes("whatsapp");
    const isChrome = lower.includes("open") && lower.includes("chrome");
    const isVSCode = lower.includes("open") && lower.includes("visual studio code") || lower.includes("vs code");

    const isAutomation = isYoutube || isWhatsapp || isChrome || isVSCode;

    if (isAutomation) {
      const speakText = "okay sir";
      const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(speakText)}&tl=hi&client=tw-ob`;
      const googleRes = await fetch(ttsUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const audioBuffer = Buffer.from(await googleRes.arrayBuffer());
      res.set("Content-Type", "audio/mpeg");
      res.send(audioBuffer);

      setTimeout(() => {
        if (isYoutube) fetch("http://localhost:5000/youtube", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ command: message }) });
        if (isWhatsapp) fetch("http://localhost:5000/whatsapp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ command: message }) });
        if (isChrome) fetch("http://localhost:5000/chrome", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ command: message }) });
        if (isVSCode) fetch("http://localhost:5000/vscode", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ command: message }) });
      }, 800);

      return;
    }

let SYSTEM_INSTRUCTIONS = `
- Your name is Nexa.
- Tone: warm, natural, conversational — like a thoughtful friend.
- Understand both English and Hinglish input, but ALWAYS reply in English only.
- Even if Abhi speaks Hinglish, respond in clean English.
- Never use Hindi words, Hinglish, or Devanagari script in your reply.
- Use contractions naturally (it's, you're, I'll, let's).
- Keep responses to 1 short sentences ( 2 words total). Never exceed 2 words.
- Briefly acknowledge what Abhi says, then answer.
- Match Abhi's energy — casual when he's casual, serious when he's serious.
- Small humor is fine when appropriate.
- Never sound robotic or over-formal.
- Do NOT explain long.
- Do NOT ask follow-up questions.
- Avoid filler like "Sure!", "Of course!", "Certainly!".
- Always end with proper punctuation (. ! ?) for natural voice.
- Speak only in English or Hinglish (Roman letters). Never use Hindi script.

USER COMMAND:
${message}

FINAL OUTPUT:
`;

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${GROQ_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "openai/gpt-oss-20b",
      messages: [{ role: "user", content :SYSTEM_INSTRUCTIONS}],
      reasoning_effort:"low",
      temperature: 0.3,
      max_tokens: 500,
    }),
  });

  const data = await response.json();
  let finalText = data.choices?.[0]?.message?.content?.trim() || "No response";
      VoiceModel.create({
        command: message
    }).catch(err => console.error("VoiceModel save failed:", err.message));
  const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(finalText)}&tl=en&client=tw-ob`;
  const googleRes = await fetch(ttsUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const audioBuffer = Buffer.from(await googleRes.arrayBuffer());

  res.set("Content-Type", "audio/mpeg");
  return res.send(audioBuffer);

 } catch (error) {  
    console.error("Speak Route Error:", error);  
    res.status(500).json({ error: error.message });  
  }
});

app.post("/generate-image", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== "string") return res.status(400).json({ error: "Invalid prompt" });
    const encoded = encodeURIComponent(prompt);
    const url = `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1024&nologo=true&model=flux`;
    const response = await fetch(url);
    if (!response.ok) return res.status(response.status).json({ error: await response.text() });
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.startsWith("image/")) return res.status(502).json({ error: "Provider did not return image" });
    const buffer = await response.arrayBuffer();
    return res.json({ type: "image", image: Buffer.from(buffer).toString("base64") });
  } catch (error) {
    return res.status(500).json({ error: "Image generation failed" });
  }
});

app.post("/youtube", async (req, res) => {
  try {
    let command = req.body.command.toLowerCase();
    let songName = command.replace("nexa", "").trim();
    if (!songName) songName = "latest songs";
    const search = encodeURIComponent(songName + " youtube");
    const url = `https://www.google.com/search?q=${search}+site:youtube.com&btnI=1`;
    exec(`start chrome "${url}"`);
    await VoiceModel.create({ command: req.body.command });
    res.json({ status: "ok", action: `Playing: ${songName}` });
  } catch (err) {
    res.status(500).json({ error: "Automation failed" });
  }
});

function escapeSendKeys(text) { return text.replace(/([+^%~(){}\[\]])/g, (c) => `{${c}}`); }
function escapePsQuote(text) { return text.replace(/'/g, "''"); }

function sendWhatsAppDesktop(contact, message) {
  return new Promise((resolve) => {
    const safeContact = escapeSendKeys(escapePsQuote(contact));
    const safeMessage = escapeSendKeys(escapePsQuote(message));
    const psScript = `
$ErrorActionPreference = 'Stop'
try {
  $wshell = New-Object -ComObject wscript.shell
  $activated = $wshell.AppActivate('WhatsApp')
  if (-not $activated) { Write-Output 'WINDOW_NOT_FOUND'; exit 1 }
  Start-Sleep -Milliseconds 800
  $wshell.SendKeys('^n'); Start-Sleep -Milliseconds 1200
  $wshell.SendKeys('${safeContact}'); Start-Sleep -Milliseconds 2000
  $wshell.SendKeys('{ENTER}'); Start-Sleep -Milliseconds 1800
  $wshell.SendKeys('${safeMessage}'); Start-Sleep -Milliseconds 600
  $wshell.SendKeys('{ENTER}')
  Write-Output 'SENT'
} catch { Write-Output "ERROR: $($_.Exception.Message)"; exit 1 }
`;
    const tmpFile = path.join(os.tmpdir(), `wa_send_${Date.now()}.ps1`);
    writeFileSync(tmpFile, psScript, "utf8");
    exec(`powershell -NoProfile -ExecutionPolicy Bypass -File "${tmpFile}"`, { timeout: 30000 }, (err, stdout) => {
        try { unlinkSync(tmpFile); } catch {}
        const out = (stdout || "").trim();
        if (out.includes("WINDOW_NOT_FOUND")) return resolve({ success: false, message: "WhatsApp Desktop window not found." });
        if (out.includes("SENT")) return resolve({ success: true, message: "WhatsApp message sent successfully" });
        return resolve({ success: false, message: "Message could not be sent" });
      }
    );
  });
}

app.post("/whatsapp", async (req, res) => {
  const { command } = req.body;
  if (!command || typeof command !== "string") return res.json({ success: false, message: "Command is required" });
  const lower = command.toLowerCase().trim();
  const hasOpen = lower.startsWith("open whatsapp");
  const hasSend = lower.includes("send message to");

  if (hasOpen && !hasSend) {
    exec(`start "" "whatsapp:"`, () => res.send("WhatsApp opened successfully."));
    return;
  }

  if (hasSend) {
    const afterKeyword = command.split(/send message to/i)[1];
    if (!afterKeyword || !afterKeyword.trim()) return res.json({ success: false, message: "Contact and message are required" });
    const parts = afterKeyword.trim().split(/\s+/);
    const contact = parts.shift();
    const text = parts.join(" ");
    if (!contact || !text) return res.json({ success: false, message: "Contact or text not specified" });
    exec(`start "" "whatsapp:"`, async () => {
      await new Promise((r) => setTimeout(r, 3500));
      try {
        const result = await sendWhatsAppDesktop(contact, text);
        return res.json(result);
      } catch (err) {
        return res.json({ success: false, message: "Failed to send WhatsApp message" });
      }
    });
    return;
  }
  return res.json({ success: false, message: "Unrecognized WhatsApp command" });
});

app.post("/chrome", (req, res) => {
  exec(`start chrome`, (err) => {
    if (err) return res.send("Chrome not found on this PC.");
    res.send("Opened Chrome.");
  });
});

app.post("/vscode", (req, res) => {
  exec(`code`, (err) => {
    if (!err) return res.send("VS Code opened.");
    const exe = `"${process.env.LOCALAPPDATA}\\Programs\\Microsoft VS Code\\Code.exe"`;
    exec(`powershell -command ${exe}`, (err2) => {
      if (!err2) return res.send("VS Code opened via EXE.");
      res.send("VS Code not found.");
    });
  });
});

app.get("/voice", (req, res) => { res.sendFile(path.join(__dirname, "voice.html")); });
app.get("/ai", (req, res) => { res.sendFile(path.join(__dirname, "ai.html")); });
app.get("/agent", (req, res) => { res.sendFile(path.join(__dirname, "agent.html")); });


//CHAT ROOT //

app.post("/chat", async (req, res) => {  
  const { message } = req.body;  
  try { 
    const lower = message.toLowerCase().trim();

    const isImageRequest = lower.includes("generate") && lower.includes("image")|| lower.includes("create") && lower.includes("image") || lower.includes("gen") && lower.includes("image");
    if (isImageRequest) {
      try {
        const imageResponse = await fetch(`${API_BASE}/generate_image`, {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: message }),
        });
        return res.json(await imageResponse.json());
      } catch (error) { return res.status(500).json({ error: "Image route failed" }); }
    }

 const small = message.toLowerCase().trim();
 const isVideoRequest = small.includes("generate") && small.includes("video") || small.includes("create") && small.includes("video");
 
if (isVideoRequest) {
  try{
    const videoRes = await fetch("http://localhost:5000/generate-video", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: message }),
    });
    return res.json(await videoRes.json());   
  } catch (error) { return res.status(500).json({ error: "Video route failed" }); }
}

    const isCricket = lower.startsWith("score") || lower.includes("cricket") || lower.includes("match");
if (isCricket) {
  try {
    const cricketResponse = await fetch("https://api.cricapi.com/v1/currentMatches?apikey=bd447f5a-529b-477e-87c9-4047e08687b9&offset=0");
    const cricketData = await cricketResponse.json();
    const match = cricketData.data.find(m => message.toLowerCase().includes(m.teams[0].toLowerCase()) || message.toLowerCase().includes(m.teams[1].toLowerCase()));
    const score = match?.score?.[0];
    let modifiedPrompt = `Match: ${match?.name}\nScore: ${score?.r}/${score?.w} in ${score?.o} overs\nStatus: ${match?.status}\nUser asked: ${message}\nReply in one short line with\n`;
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST", headers: { "Authorization": `Bearer ${GROQ_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "llama-3.1-8b-instant", messages: [{ role: "user", content: modifiedPrompt }] }),
    });
    const data = await response.json();
    const finalText = data.output_text || data.choices?.[0]?.message?.content || "No response";
    const voiceResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
        method: "POST", headers: { "xi-api-key": ELEVENLABS_API_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ text: finalText, voice_settings: { stability: 0.5, similarity_boost: 0.75 } }),
      });
    res.set({ "Content-Type": "audio/mpeg" });
    return voiceResponse.body.pipe(res);
  } catch (error) { return res.status(500).json({ error: "Cricket route failed" }); }
}
    
    const isYoutube = lower.includes("open youtube");
    const isWhatsapp = lower.includes("open whatsapp");
    const isChrome = lower.includes("open chrome");
    const isVSCode = lower.includes("open visual studio code");
    const isAutomation = isYoutube || isWhatsapp || isChrome || isVSCode;

    if (isAutomation) {
      const speakText = "okay sir";
      res.json({ message: speakText });
      setTimeout(() => {
        if (isYoutube) fetch("http://localhost:5000/youtube", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ command: message }) });
        if (isWhatsapp) fetch("http://localhost:5000/whatsapp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ command: message }) });
        if (isChrome) fetch("http://localhost:5000/chrome", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ command: message }) });
        if (isVSCode) fetch("http://localhost:5000/vscode", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ command: message }) });
      }, 800);
      return;
    }

let SYSTEM_RULES = `
- Your name is Nexa.
- Always address the user as "Abhi".
- Tone: warm, natural, conversational — like a thoughtful friend.
- Language: Match Abhi's language.
- If he speaks English → reply in English.
- If he speaks Hindi or Hinglish → reply in Hinglish (Hindi written in English letters, e.g., "kaise ho", "bilkul", "chalta hai").
- Never use Devanagari script. Always use Roman/English letters.
- Use contractions naturally (it's, you're, I'll, let's).
- Keep responses to 1-2 short sentences (10-20 words total). Never exceed 25 words.
- Briefly acknowledge what Abhi says, then answer.
- Match Abhi's energy — casual when he's casual, serious when he's serious.
- Small humor is fine when appropriate.
- Never sound robotic or over-formal.
- Do NOT explain long.
- Do NOT ask follow-up questions.
- Avoid filler like "Sure!", "Of course!", "Certainly!".
- Always end with proper punctuation (. ! ?) for natural voice.
- Speak only in English or Hinglish (Roman letters). Never use Hindi script.


USER COMMAND:
${message}

FINAL OUTPUT:
`;

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST", headers: { "Authorization": `Bearer ${GROQ_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "openai/gpt-oss-20b", messages: [{ role: "user", content: SYSTEM_RULES  }], reasoning_effort:"low", temperature: 0.3, max_tokens: 500 }),
  });

  if (!response.ok) return res.sendStatus(response.status);
  const data = await response.json();
    const finalText = data.choices?.[0]?.message?.content?.trim() || "No response";
   res.json({ message: finalText })
      GroqLog.create({
        userMessage: message,
        aiResponse: finalText,
        model: "openai/gpt-oss-20b",
        tokensUsed: data.usage?.total_tokens || 0
    }).catch(err => console.error("GroqLog save failed:", err.message));

 } catch (error) {  
    res.status(500).json({ error: error.message });  
  }
});

/*app.post("/generate_image", async (req, res) => {
  console.log("\n--- 🚀 NEW IMAGE REQUEST RECEIVED ---");
  
  try {
    const { prompt } = req.body;
    console.log("📝 Prompt:", prompt);

    if (!prompt || typeof prompt !== "string") {
      console.log("❌ Error: Prompt is missing or invalid.");
      return res.status(400).json({ message: "Invalid prompt" });
    }

    const payload = {
      "prompt": prompt,
      "width": 1024,
      "height": 1024,
      "seed": 0,
      "steps": 50
    };

    console.log("⏳ Sending request to NVIDIA... (Please wait)");

    // 30 second timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); 

    const response = await fetch("https://ai.api.nvidia.com/v1/genai/black-forest-labs/flux.1-dev", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.NVIDIA_API_KEY ? process.env.NVIDIA_API_KEY.trim() : ""}`,
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    console.log("📡 NVIDIA Response Status:", response.status);

    const responseText = await response.text();

    // If API returns an error (e.g., Adult/NSFW prompt blocked)
    if (!response.ok) {
      console.error("❌ NVIDIA Error:", responseText);
      // Send exact error to frontend via 'message' key
      return res.status(response.status).json({ message: `NVIDIA Error: ${responseText}` });
    }

    // If Status is 200 OK
    const data = JSON.parse(responseText);
    const base64Image = data.artifacts?.[0]?.base64 || data.image;

    if (!base64Image) {
      return res.status(502).json({ message: "No image data received" });
    }

    console.log("✅ Image generated successfully!");
    return res.json({ type: "image", image: base64Image });

  } catch (error) {
    console.error("❌ CATCH ERROR:", error.message);
    
    if (error.name === 'AbortError') {
      return res.status(504).json({ message: "NVIDIA took too long to respond (Timeout 30s)" });
    }
    return res.status(500).json({ message: `Internal Server Error: ${error.message}` });
  }
});*/


// Helper function for Fallback (Pollinations API)
async function generateFromPollinations(prompt, res) {
  try {
    console.log("🎨 Generating image via Pollinations AI (Fallback)...");
    const encoded = encodeURIComponent(prompt);
    const url = `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1024&nologo=true&model=flux`;
    
    const response = await fetch(url);
    if (!response.ok) return res.sendStatus(response.status);
    
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.startsWith("image/")) {
      return res.status(502).json({ message: "Invalid response from Pollinations." });
    }
    
    const buffer = await response.arrayBuffer();

try {
      await ImageModel.create({
        prompt: prompt,
        imageData: base64Image,
        provider: "pollinations"
      });
      console.log("💾 Image saved to Database (Pollinations)");
    } catch (dbError) {
      console.error("⚠️ DB Save Error (Pollinations):", dbError.message);
    }

    console.log("✅ Image successfully generated by Pollinations!");
    return res.json({ type: "image", image: Buffer.from(buffer).toString("base64") });
  } catch (error) {
    return res.status(500).json({ message: "Image generation failed" });
  }
}

// Main Route
app.post("/generate_image", async (req, res) => {
  console.log("\n--- 🚀 NEW IMAGE REQUEST RECEIVED ---");
  
  try {
    const { prompt } = req.body;
    console.log("📝 Prompt:", prompt);

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ message: "Invalid prompt provided." });
    }

    const payload = {
      "prompt": prompt,
      "width": 1024,
      "height": 1024,
      "seed": 0,
      "steps": 50
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); 

    // ==========================================
    // ATTEMPT 1: NVIDIA API
    // ==========================================
    const response = await fetch("https://ai.api.nvidia.com/v1/genai/black-forest-labs/flux-3-image-klein", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.NVIDIA_API_KEY ? process.env.NVIDIA_API_KEY.trim() : ""}`,
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    const responseText = await response.text();

    // Agar HTTP Status 200 nahi hai (e.g. 429 Too Many Requests, 401 Invalid Key)
    if (!response.ok) {
      console.error("❌ NVIDIA API FAILED:", responseText);
      console.log("🔄 Switching to Pollinations API...");
      return await generateFromPollinations(prompt, res);
    }

    // JSON Parse safety
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.log("🔄 NVIDIA Parse Error, switching to Pollinations...");
      return await generateFromPollinations(prompt, res);
    }

    const base64Image = data.artifacts?.[0]?.base64 || data.image;

    // SMART CHECK: Agar image data khaali hai
    if (!base64Image) {
      const apiError = data.detail || data.error || data.message || (data.artifacts && data.artifacts[0]?.finishReason);
      
      if (apiError) {
        const errorString = JSON.stringify(apiError).toLowerCase();
        
        // Agar Limit ya Quota ka error hai -> Switch to Pollinations
        if (errorString.includes("limit") || errorString.includes("quota") || errorString.includes("exceeded")) {
          console.log("⚠️ NVIDIA Limit Exhausted. Switching to Pollinations API...");
          return await generateFromPollinations(prompt, res);
        }
        
        // Agar content filter ka error hai -> Dono jagah se block hoga, toh error dikhao
        return res.status(400).json({ message: `NVIDIA Error: ${typeof apiError === 'string' ? apiError : JSON.stringify(apiError)}` });
      }

      // Agar response bilkul khaali hai (No error, No image) -> Safety Filter
      console.log("🛑 Content Restricted: No image data or error message.");
      return res.status(400).json({ 
        message: "Content Restricted: Your prompt was blocked by safety filters. Please try a different prompt." 
      });
    }

    try {
      await ImageModel.create({
        prompt: prompt,
        imageData: base64Image,
        provider: "nvidia"
      });
      console.log("💾 Image saved to Database (NVIDIA)");
    } catch (dbError) {
      console.error("⚠️ DB Save Error (NVIDIA):", dbError.message);
      // Agar DB save fail bhi ho, toh user ko image milni chahiye
    }

    console.log("✅ Image successfully generated by NVIDIA!");
    return res.json({ type: "image", image: base64Image });

  } catch (error) {
    console.error("❌ CATCH ERROR (NVIDIA):", error.message);
    
    // Agar Timeout ho gaya ya Network fail hua -> Switch to Pollinations
    console.log("🔄 NVIDIA Timeout/Crash. Switching to Pollinations API...");
    return await generateFromPollinations(req.body.prompt, res);
  }
});

/*app.post("/generate_image", async (req, res) => {
  console.log("\n--- 🚀 NEW IMAGE REQUEST RECEIVED ---");
  
  try {
    const { prompt } = req.body;
    console.log("📝 Prompt:", prompt);

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ message: "Invalid prompt provided." });
    }

    const payload = {
      "prompt": prompt,
      "width": 1024,
      "height": 1024,
      "seed": 0,
      "steps": 50
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); 

    const response = await fetch("https://ai.api.nvidia.com/v1/genai/black-forest-labs/flux-3-image-klein", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.NVIDIA_API_KEY ? process.env.NVIDIA_API_KEY.trim() : ""}`,
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    
    const responseText = await response.text();

    // 1. Agar HTTP Status 200 nahi hai (e.g. 429 Too Many Requests, 401 Invalid Key)
    if (!response.ok) {
      console.error("❌ NVIDIA API FAILED:", responseText);
      return res.status(response.status).json({ 
        message: `NVIDIA Error: ${responseText}` 
      });
    }

    // 2. JSON Parse safety
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      return res.status(502).json({ message: "Invalid response format from AI." });
    }

    const base64Image = data.artifacts?.[0]?.base64 || data.image;

    // 3. SMART CHECK: Agar image data khaali hai
    if (!base64Image) {
      // Pehle check karein ki NVIDIA ne koi specific error toh nahi bheja
      const apiError = data.detail || data.error || data.message || (data.artifacts && data.artifacts[0]?.finishReason);
      
      if (apiError) {
        const errorString = JSON.stringify(apiError).toLowerCase();
        
        // Agar Limit ya Quota ka error hai
        if (errorString.includes("limit") || errorString.includes("quota") || errorString.includes("exceeded")) {
          console.log("⚠️ API Limit Exhausted.");
          return res.status(429).json({ message: "API Limit Reached: The image generation limit has been exhausted. Please try again later." });
        }
        
        // Agar koi aur error hai
        return res.status(400).json({ message: `NVIDIA Error: ${typeof apiError === 'string' ? apiError : JSON.stringify(apiError)}` });
      }

      // Agar response bilkul khaali hai (No error, No image) -> Safety Filter
      console.log("🛑 Content Restricted: No image data or error message.");
      return res.status(400).json({ 
        message: "Content Restricted: Your prompt was blocked by safety filters. Please try a different prompt." 
      });
    }

    console.log("✅ Image successfully generated!");
    return res.json({ type: "image", image: base64Image });

  } catch (error) {
    console.error("❌ CATCH ERROR:", error.message);
    
    if (error.name === 'AbortError') {
      return res.status(504).json({ message: "NVIDIA took too long to respond (Timeout 30s)." });
    }
    return res.status(500).json({ message: `Internal Server Error: ${error.message}` });
  }
});*/
/*app.post("/generate_image", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== "string") return res.status(400).json({ error: "Invalid prompt" });
    const encoded = encodeURIComponent(prompt);
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(encoded)}?width=1024&height=1024&nologo=true&model=flux`;
    const response = await fetch(url);
    if (!response.ok) return res.sendStatus(response.status);
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.startsWith("image/")) return res.status(502).json({});
    const buffer = await response.arrayBuffer();
    return res.json({ type: "image", image: Buffer.from(buffer).toString("base64") });
  } catch (error) {
    return res.status(500).json({ message: "Image generation failed" });
  }
});*/


app.post("/generate-video", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== "string") return res.status(400).json({ error: "Invalid prompt" });
    const encodedPrompt = encodeURIComponent(prompt);
    const url = `https://gen.pollinations.ai/video/${encodedPrompt}?model=veo&duration=5&aspectRatio=16:9`;
    const pollRes = await fetch(url, { headers: { "Authorization": `Bearer ${process.env.POLLINATIONS_API_KEY}` } });
    if (!pollRes.ok) return res.status(pollRes.status).json({ error: await pollRes.text() });
    const contentType = pollRes.headers.get("content-type") || "";
    if (!contentType.startsWith("video/")) return res.status(502).json({ error: "Provider did not return a video" });
    const buffer = await pollRes.arrayBuffer();
    return res.json({ type: "video", video: Buffer.from(buffer).toString("base64") });
  } catch (err) {
    return res.status(500).json({ error: "Video generation failed" });
  }
});

app.post("/youtube", async (req, res) => {
  try {
    let command = req.body.command.toLowerCase();
    let songName = command.replace("nexa", "").trim();
    if (!songName) songName = "latest songs";
    const search = encodeURIComponent(songName + " youtube");
    const url = `https://www.google.com/search?q=${search}+site:youtube.com&btnI=1`;
    exec(`start chrome "${url}"`);
   /* await VoiceModel.create({
      command:req.body.command});
    console.log("saved to mongodb :" ,req.body.command );*/
    res.json({ status: "ok", action: `Playing: ${songName}` });
  } catch (err) {
    res.status(500).json({ error: "Automation failed" });
  }
});

app.post("/whatsapp", async (req, res) => {
  const { command } = req.body;
  if (!command || typeof command !== "string") return res.json({ success: false, message: "Command is required" });
  const lower = command.toLowerCase().trim();
  const hasOpen = lower.startsWith("open whatsapp");
  const hasSend = lower.includes("send message to");

  if (hasOpen && !hasSend) {
    exec(`start "" "whatsapp:"`, () => res.send("WhatsApp opened successfully."));
    return;
  }

  if (hasSend) {
    const afterKeyword = command.split(/send message to/i)[1];
    if (!afterKeyword || !afterKeyword.trim()) return res.json({ success: false, message: "Contact and message are required" });
    const parts = afterKeyword.trim().split(/\s+/);
    const contact = parts.shift();
    const text = parts.join(" ");
    if (!contact || !text) return res.json({ success: false, message: "Contact or text not specified" });
    exec(`start "" "whatsapp:"`, async () => {
      await new Promise((r) => setTimeout(r, 3500));
      try {
        const result = await sendWhatsAppDesktop(contact, text);
        return res.json(result);
      } catch (err) {
        return res.json({ success: false, message: "Failed to send WhatsApp message" });
      }
    });
    return;
  }
  return res.json({ success: false, message: "Unrecognized WhatsApp command" });
});

app.post("/chrome", (req, res) => {
  exec(`start chrome`, (err) => {
    if (err) return res.send("Chrome not found on this PC.");
    res.send("Opened Chrome.");
  });
});

app.post("/vscode", (req, res) => {
  exec(`code`, (err) => {
    if (!err) return res.send("VS Code opened.");
    const exe = `"${process.env.LOCALAPPDATA}\\Programs\\Microsoft VS Code\\Code.exe"`;
    exec(`powershell -command ${exe}`, (err2) => {
      if (!err2) return res.send("VS Code opened via EXE.");
      res.send("VS Code not found.");
    });
  });
});


// ==============================================================
// 🚀 EMAIL AUTOMATION WORKFLOW (Naya Code - Sabse Neeche)
// ==============================================================

// Schemas for Automation
const userSchema = new mongoose.Schema({
    googleId: { type: String, required: true, unique: true },
    email: { type: String, required: true },
    name: { type: String },
    accessToken: { type: String },
    refreshToken: { type: String },
    tokenExpiry: { type: Date },
    createdAt: { type: Date, default: Date.now }
});
const UserModel = mongoose.model("User", userSchema);

const automationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    type: { type: String, enum: ["test", "use"], required: true },
    senderEmail: { type: String },
    recipient: { type: String, required: true },
    message: { type: String, required: true },
    timerMinutes: { type: Number, required: true },
    timerUnit: { type: String, enum: ["minutes", "seconds"], default: "minutes" },
    status: { type: String, enum: ["processing", "success", "failed", "cancelled"], default: "processing" },
    scheduledAt: { type: Date, required: true },
    firedAt: { type: Date },
    createdAt: { type: Date, default: Date.now }
});
const AutomationModel = mongoose.model("Automation", automationSchema);

// Mailers & Timers
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.BOT_EMAIL,
        pass: process.env.BOT_EMAIL_PASS
    }
});

async function sendEmailViaGmailAPI(user, recipient, message, fromEmail) {
    const authClient = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
    );
    authClient.setCredentials({ access_token: user.accessToken, refresh_token: user.refreshToken });

    if (user.tokenExpiry && new Date(user.tokenExpiry) < new Date()) {
        try {
            const { credentials } = await authClient.refreshAccessToken();
            user.accessToken = credentials.access_token;
            if (credentials.refresh_token) user.refreshToken = credentials.refresh_token;
            user.tokenExpiry = credentials.expiry_date ? new Date(credentials.expiry_date) : null;
            await user.save();
        } catch (refreshErr) {
            throw new Error("User token expired. Please login again.");
        }
    }

    const gmail = google.gmail({ version: "v1", auth: authClient });
    const rawMessage = [
        `From: ${fromEmail || user.email}`,
        `To: ${recipient}`,
        `Subject: Message from Nexa AI`,
        `MIME-Version: 1.0`,
        `Content-Type: text/plain; charset="UTF-8"`,
        "",
        message
    ].join("\r\n");

    const encodedMessage = Buffer.from(rawMessage).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    await gmail.users.messages.send({ userId: "me", requestBody: { raw: encodedMessage } });
}

async function fireAutomation(automationId) {
    try {
        const automation = await AutomationModel.findById(automationId);
        if (!automation || automation.status !== "processing") return;

        let success = false;
        if (automation.type === "test") {
            await transporter.sendMail({
                from: process.env.BOT_EMAIL,
                to: automation.recipient,
                subject: "Message from Nexa AI",
                text: automation.message
            });
            success = true;
        } else if (automation.type === "use") {
            const user = await UserModel.findById(automation.userId);
            if (!user) throw new Error("User not found");
            const fromEmail = automation.senderEmail || user.email;
            await sendEmailViaGmailAPI(user, automation.recipient, automation.message, fromEmail);
            success = true;
        }

        automation.status = success ? "success" : "failed";
        automation.firedAt = new Date();
        await automation.save();
        console.log(`✅ Email sent: ${automation.type} → ${automation.recipient}`);
    } catch (err) {
        console.error(`❌ Automation ${automationId} failed:`, err.message);
        await AutomationModel.findByIdAndUpdate(automationId, { status: "failed", firedAt: new Date() });
    }
}

function scheduleAutomation(automation) {
    const delay = new Date(automation.scheduledAt).getTime() - Date.now();
    if (delay <= 0) {
        fireAutomation(automation._id.toString());
        return;
    }
    console.log(`⏰ Scheduled ${automation._id} in ${Math.round(delay / 1000)}s → ${automation.recipient}`);
    setTimeout(() => fireAutomation(automation._id.toString()), delay);
}

const sessionTokens = new Map();
const SESSION_TOKEN_TTL_MS = 60 * 1000;

setInterval(() => {
    const now = Date.now();
    for (const [token, data] of sessionTokens.entries()) {
        if (data.expiresAt < now) sessionTokens.delete(token);
    }
}, 30 * 1000);

// OAuth Routes
const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

const OAUTH_SCOPES = [
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile"
];



app.get("/auth/google", (req, res) => {
    const url = oauth2Client.generateAuthUrl({ access_type: "offline", scope: OAUTH_SCOPES, prompt: "consent" });
    res.redirect(url);
});

app.get("/auth/google/callback", async (req, res) => {
    const { code } = req.query;
    if (!code) return res.status(400).send("Authorization code missing");

    try {
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);
        const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
        const userInfo = await oauth2.userinfo.get();

        const user = await UserModel.findOneAndUpdate(
            { googleId: userInfo.data.id },
            {
                googleId: userInfo.data.id,
                email: userInfo.data.email,
                name: userInfo.data.name,
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token,
                tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null
            },
            { upsert: true, new: true }
        );

        console.log("✅ User authenticated:", user.email);

        // Redirect back to ai.html with user info in query params
        /*const frontendBase = process.env.FRONTEND_URL || "";
res.redirect(`${frontendBase}/ai.html?userId=${user._id}&email=${encodeURIComponent(user.email)}`);*/
          const token = crypto.randomBytes(32).toString("hex");
          sessionTokens.set(token, {
         userId: user._id.toString(),
         email: user.email,
        expiresAt: Date.now() + SESSION_TOKEN_TTL_MS
      });
       const frontendBase = process.env.FRONTEND_URL || "";
      res.redirect(`${frontendBase}/agent.html#t=${token}`)


    } catch (err) {
        console.error("OAuth callback error:", err);
        res.status(500).send("Authentication failed: " + err.message);
    }
});

app.post("/auth/session", (req, res) => {
    try {
        const { token } = req.body;
        if (!token) return res.status(400).json({ success: false, error: "Token required" });

        const data = sessionTokens.get(token);
        if (!data) return res.status(401).json({ success: false, error: "Invalid or expired token" });

        if (data.expiresAt < Date.now()) {
            sessionTokens.delete(token);
            return res.status(401).json({ success: false, error: "Token expired" });
        }

        // One-time use — delete immediately
        sessionTokens.delete(token);

        res.json({ success: true, userId: data.userId, email: data.email });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
  });

// Automation API Routes
app.post("/api/automation/schedule", async (req, res) => {
    try {
        const { userId, type, senderEmail, recipient, message, timerMinutes, timerUnit } = req.body;
        if (!type || !["test", "use"].includes(type)) return res.status(400).json({ success: false, error: "Type must be 'test' or 'use'" });
        if (!recipient || !message || !timerMinutes) return res.status(400).json({ success: false, error: "Fields required" });
        if (type === "use" && !userId) return res.status(400).json({ success: false, error: "userId required" });
        const timer = Number(timerMinutes);
        if (isNaN(timer) || timer <= 0) return res.status(400).json({ success: false, error: "Invalid timer" });

        // Optional sender email validation (basic format check)
        if (senderEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(senderEmail)) {
            return res.status(400).json({ success: false, error: "Invalid sender email" });
        }

        // Normalize timerUnit
        const unit = timerUnit === "seconds" ? "seconds" : "minutes";

        const scheduledAt = new Date(Date.now() + timer * 60 * 1000);
        const automation = await AutomationModel.create({
            userId: userId || null,
            type,
            senderEmail: senderEmail || null,
            recipient,
            message,
            timerMinutes: timer,
            timerUnit: unit,
            status: "processing",
            scheduledAt
        });
        scheduleAutomation(automation);
        res.json({ success: true, automationId: automation._id, scheduledAt });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.get("/api/automation/list", async (req, res) => {
    try {
        const { userId } = req.query;
       /* const query = userId ? { userId } : { type: "test" };*/
       const query = userId 
    ? { $or: [{ userId }, { type: "test" }] } 
    : { type: "test" };
        const automations = await AutomationModel.find(query).sort({ createdAt: -1 }).limit(50);
        res.json({ success: true, automations });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.post("/api/automation/cancel/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const automation = await AutomationModel.findById(id);
        if (!automation) return res.status(404).json({ success: false, error: "Not found" });
        if (automation.status !== "processing") return res.status(400).json({ success: false, error: `Cannot cancel` });
        automation.status = "cancelled";
        await automation.save();
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Automation Routes Server Running on PORT ${PORT}`);
});

mongoose.connection.once("open", async () => {
  try {
    const pending = await AutomationModel.find({ status: "processing" });
    console.log(`📋 Loading ${pending.length} pending automation(s)`);
    pending.forEach(scheduleAutomation);
  } catch (err) {
    console.error("Failed to load pending automations:", err.message);
  }
});
 