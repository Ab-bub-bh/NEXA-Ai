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

// ============================================
// WhatsApp Cloud API — NAYE IMPORTS
// ============================================   // ✅ ADD

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());



/*mongoose.connect("mongodb://127.0.0.1:27017/voiceHistory")
.then(() => console.log("mongoDB Connected"))
.catch(err => console.log(err));
const voiceSchema = new mongoose.Schema({
    command: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const VoiceModel = mongoose.model("VoiceHistory", voiceSchema);

// 🔐 All API keys from .env
/*const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = process.env.VOICE_ID;*/
const GROQ_API_KEY = process.env.GROQ_API_KEY;

/*const NEWS_API_KEY = process.env.NEWS_API_KEY;*/

app.post("/speak", async (req, res) => {  
  const { message } = req.body;  
  console.log("Recived message:", message);
  
  try { 
    const lower = message.toLowerCase().trim();

    // 🖼 IMAGE CHECK
    const isImageRequest = lower.includes("generate") && lower.includes("image");

    if (isImageRequest) {
      
      try {
        const imageResponse = await fetch("http://localhost:5000/generate-image", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ prompt: message }),
        });

        const data = await imageResponse.json();
        console.log("🛑 IMAGE RETURN");

        return res.json(data);

      } catch (error) {
        return res.status(500).json({ error: "Image route failed" });
      }
    }
    

    // 🏏 CRICKET CHECK
    const isCricket =
     lower.startsWith("score") || lower.includes("cricket") || lower.includes("match");
      
if (isCricket) {
  try {
    const cricketResponse = await fetch(
      "https://api.cricapi.com/v1/currentMatches?apikey=bd447f5a-529b-477e-87c9-4047e08687b9&offset=0"
    );

    const cricketData = await cricketResponse.json();

console.log("Cricket API Response:", cricketData);

const match = cricketData.data.find(m =>
  message.toLowerCase().includes(m.teams[0].toLowerCase()) ||
  message.toLowerCase().includes(m.teams[1].toLowerCase())
);

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
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: modifiedPrompt }]
      }),
    });

    const data = await response.json();

    const finalText =
      data.output_text ||
      data.choices?.[0]?.message?.content ||
      "No response";

    console.log("Cricket AI Reply:", finalText);
    
    const voiceResponse = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: finalText,
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      }
    );

    res.set({
      "Content-Type": "audio/mpeg",
    });

    return voiceResponse.body.pipe(res);

  } catch (error) {
    return res.status(500).json({ error: "Cricket route failed" });
  }
}
    

    // Automation Keywords
    const isYoutube = lower.includes("open") && lower.includes("youtube");
    const isWhatsapp = lower.includes("open") && lower.includes("whatsapp");
    const isChrome = lower.includes("open") && lower.includes("chrome");
    const isVSCode = lower.includes("open") && lower.includes("visual studio code") || lower.includes("vs code");

    const isAutomation = isYoutube || isWhatsapp || isChrome || isVSCode;

    // 🟢 AUTOMATION MODE  
    if (isAutomation) {

      const speakText = "okay sir";

      const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(speakText)}&tl=hi&client=tw-ob`;

const googleRes = await fetch(ttsUrl, {
  headers: { 'User-Agent': 'Mozilla/5.0' }
});

const audioBuffer = Buffer.from(await googleRes.arrayBuffer());

res.set("Content-Type", "audio/mpeg");
res.send(audioBuffer);

     /* const voiceResponse = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
        {
          method: "POST",
          headers: {
            "xi-api-key": ELEVENLABS_API_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: speakText,
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75
            },
          }),
        }
      );

      console.log("Voice status:", voiceResponse.status);
    console.log("Voice type:", voiceResponse.headers.get("content-type"));

if (!voiceResponse.ok) {
  const errorText = await voiceResponse.text();
  console.log("Voice Error:", errorText);
  return res.status(500).json({ error: "Voice failed" });
}

      const audioBuffer = await voiceResponse.arrayBuffer();

      res.set({
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.byteLength,
      });

      res.send(Buffer.from(audioBuffer));*/

      setTimeout(() => {
        if (isYoutube) {
          fetch("http://localhost:5000/youtube", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ command: message }),
          });
        }

        if (isWhatsapp) {
          fetch("http://localhost:5000/whatsapp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ command: message }),
          });
        }

        if (isChrome) {
          fetch("http://localhost:5000/chrome", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ command: message }),
          });
        }

        if (isVSCode) {
          fetch("http://localhost:5000/vscode", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ command: message }),
          });
        }

      }, 800);

      return;
    }

  
    console.log("🔥 AI ROUTE HIT:", message);

    let finalText = "";


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
    headers: {
      "Authorization": `Bearer ${GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "openai/gpt-oss-20b",
      messages: [{ role: "user", content :SYSTEM_INSTRUCTIONS}],
      reasoning_effort:"low",
      temperature: 0.3,
      max_tokens: 500, // 1 line ke liye itna kaafi hai
    }),
  });

  const data = await response.json();

/*console.log("🔥 GROQ STATUS:", response.status);
console.log("🔥 GROQ DATA:", data);*/
  // Groq me sirf yahi format aayega
  finalText = data.choices?.[0]?.message?.content?.trim() || "No response";
console.log("AI Reply:", finalText);

console.log("Ai Reply:", finalText);
console.log("Google TTS voice coming");

const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(finalText)}&tl=en&client=tw-ob`;

const googleRes = await fetch(ttsUrl, {
  headers: { 'User-Agent': 'Mozilla/5.0' }
});

const audioBuffer = Buffer.from(await googleRes.arrayBuffer());

res.set("Content-Type", "audio/mpeg");
return res.send(audioBuffer);


/*console.log("Ai Reply :" ,finalText);
console.log("ElevenLabs voice coming ");
// Groq TTS - ElevenLabs ka replacement
const voiceResponse = await fetch(
  "https://api.groq.com/openai/v1/audio/speech",
  {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "canopylabs/orpheus-v1-english",
     input: finalText.slice(0, 195), 
      voice:  "autumn", 
      response_format: "wav"     //  Female - Rachel jaisi
      // voice: "Fritz-PlayAI", // Male chahiye to ye use karo
    }),
  }
);

if (!voiceResponse.ok) {
  const errorText = await voiceResponse.text();
  console.error("Groq TTS Error:", errorText);
  return res.status(voiceResponse.status).json({ error: errorText });
}

const audioBuffer = Buffer.from(await voiceResponse.arrayBuffer());

res.set("Content-Type", "audio/wav");
return res.send(audioBuffer);*/

   /*const voiceResponse = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: finalText,
          voice_settings: { stability: 0.5, similarity_boost: 0.75 },
        }),
      }
    );

    if (!voiceResponse.ok) {
  const errorText = await voiceResponse.text();
  console.error("ElevenLabs Error:", errorText);
  return res.status(voiceResponse.status).json({ error: errorText });
}

    
    const audioBuffer = Buffer.from(await voiceResponse.arrayBuffer());

res.set("Content-Type", "audio/mpeg");

return res.send(audioBuffer);*/

    /*res.set({
      "Content-Type": "audio/mpeg",
    });

    return voiceResponse.body.pipe(res);*/

 } catch (error) {  
    console.error("Speak Route Error:", error);  
    res.status(500).json({ error: error.message });  
  }
});





app.post("/generate-image", async (req, res) => {
 
try {
    const { prompt } = req.body;
    console.log("Received text:", prompt);

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "Invalid prompt" });
    }

    const encoded = encodeURIComponent(prompt);
    const  url = `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1024&nologo=true&model=flux`;


    const response = await fetch(url);

    console.log("Pollinations Status:", response.status);
    console.log("Content-Type:", response.headers.get("content-type"));

    if (!response.ok) {
      const err = await response.text();
      console.log("Pollinations Error:", err);
      return res.status(response.status).json({ error: err });
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.startsWith("image/")) {
      const errText = await response.text();
      console.log("Non-image response:", errText);
      return res.status(502).json({ error: "Provider did not return image" });
    }

    const buffer = await response.arrayBuffer();
    console.log("Image bytes:", buffer.byteLength);

    const base64Image = Buffer.from(buffer).toString("base64");

    return res.json({
      type: "image",
      image: base64Image,
    });

  } catch (error) {
    console.error("Image Route Error:", error);
    return res.status(500).json({ error: "Image generation failed" });
  }
});


// 🎧 YOUTUBE SONG AUTOMATION
app.post("/youtube", async (req, res) => {
  try {
    console.log("🎙 YouTube command received");

    let command = req.body.command.toLowerCase();
    let songName = command.replace("nexa", "").trim();
    if (!songName) songName = "latest songs";

    console.log("🎵 Searching:", songName);

    // ⭐ UNIVERSAL VIDEO + SONG DIRECT PLAY URL
    const search = encodeURIComponent(songName + " youtube");
    const url = `https://www.google.com/search?q=${search}+site:youtube.com&btnI=1`;

    // OPEN IN CHROME → DIRECT VIDEO PLAY
    exec(`start chrome "${url}"`);

    await VoiceModel.create({
      command:req.body.command});
    console.log("saved to mongodb :" ,req.body.command );

    res.json({ status: "ok", action: `Playing: ${songName}` });

  } catch (err) {
    console.error("Robot.js Error:", err);
    res.status(500).json({ error: "Automation failed" });
  }
});



// =====================================================================
// WhatsApp Desktop automation via PowerShell SendKeys
// =====================================================================

function escapeSendKeys(text) {
  return text.replace(/([+^%~(){}\[\]])/g, (c) => `{${c}}`);
}

function escapePsQuote(text) {
  return text.replace(/'/g, "''");
}

function sendWhatsAppDesktop(contact, message) {
  return new Promise((resolve) => {
    const safeContact = escapeSendKeys(escapePsQuote(contact));
    const safeMessage = escapeSendKeys(escapePsQuote(message));

    const psScript = `
$ErrorActionPreference = 'Stop'
try {
  $wshell = New-Object -ComObject wscript.shell
  $activated = $wshell.AppActivate('WhatsApp')
  if (-not $activated) {
    Write-Output 'WINDOW_NOT_FOUND'
    exit 1
  }
  Start-Sleep -Milliseconds 800
  $wshell.SendKeys('^n')
  Start-Sleep -Milliseconds 1200
  $wshell.SendKeys('${safeContact}')
  Start-Sleep -Milliseconds 2000
  $wshell.SendKeys('{ENTER}')
  Start-Sleep -Milliseconds 1800
  $wshell.SendKeys('${safeMessage}')
  Start-Sleep -Milliseconds 600
  $wshell.SendKeys('{ENTER}')
  Write-Output 'SENT'
} catch {
  Write-Output "ERROR: $($_.Exception.Message)"
  exit 1
}
`;

    const tmpFile = path.join(os.tmpdir(), `wa_send_${Date.now()}.ps1`);
    writeFileSync(tmpFile, psScript, "utf8");

    exec(
      `powershell -NoProfile -ExecutionPolicy Bypass -File "${tmpFile}"`,
      { timeout: 30000 },
      (err, stdout) => {
        try { unlinkSync(tmpFile); } catch {}

        const out = (stdout || "").trim();
        if (out.includes("WINDOW_NOT_FOUND")) {
          return resolve({
            success: false,
            message: "WhatsApp Desktop window not found. Please open WhatsApp first.",
          });
        }
        if (out.includes("SENT")) {
          return resolve({
            success: true,
            message: "WhatsApp message sent successfully",
          });
        }
        return resolve({
          success: false,
          message: "Message could not be sent",
        });
      }
    );
  });
}
app.post("/whatsapp", async (req, res) => {
  console.log("🟦 Opening WhatsApp...");
  const { command } = req.body;
  console.log("whatsapp route hit:", command);

  if (!command || typeof command !== "string") {
    return res.json({ success: false, message: "Command is required" });
  }

  const lower = command.toLowerCase().trim();
  const hasOpen = lower.startsWith("open whatsapp");
  const hasSend = lower.includes("send message to");

  // 1️⃣ Sirf open karna (purana behaviour)
  if (hasOpen && !hasSend) {
    exec(`start "" "whatsapp:"`, () => {
      console.log("🟢 WhatsApp opened (ONLY OPEN MODE)");
      return res.send("WhatsApp opened successfully.");
    });
    return;
  }

  // 2️⃣ Message bhejna (Desktop app ke through)
  if (hasSend) {
    const afterKeyword = command.split(/send message to/i)[1];
    if (!afterKeyword || !afterKeyword.trim()) {
      return res.json({
        success: false,
        message: "Contact and message are required",
      });
    }

    const parts = afterKeyword.trim().split(/\s+/);
    const contact = parts.shift();
    const text = parts.join(" ");

    if (!contact) {
      return res.json({ success: false, message: "Contact not specified" });
    }
    if (!text) {
      return res.json({ success: false, message: "Message text not specified" });
    }

    // Pehle WhatsApp Desktop open/focus karo, phir send
    exec(`start "" "whatsapp:"`, async () => {
      await new Promise((r) => setTimeout(r, 3500));

      try {
        const result = await sendWhatsAppDesktop(contact, text);
        return res.json(result);
      } catch (err) {
        console.error("WhatsApp route error:", err);
        return res.json({
          success: false,
          message: "Failed to send WhatsApp message",
        });
      }
    });
    return;
  }

  return res.json({ success: false, message: "Unrecognized WhatsApp command" });
});


/*app.post("/whatsapp", (req, res) => {
  console.log("🟦 Opening WhatsApp...");
  const { command } = req.body;
  console.log("whatsapp route hit:", command);

  const lower = command.toLowerCase().trim();

  // 🔵 Detect command type
  const hasOpen = lower.startsWith("open whatsapp");
  const hasSend = lower.includes("send message to");

  // 🔵 Extract contact + message ONLY IF send command exists
  let contact = "";
  let text = "";

  if (hasSend && hasOpen) {
     exec(`start WHA "${url}"`);
    const parts = command.split("send message to")[1].trim().split(" ");
    contact = parts.shift();
    text = parts.join(" ");
  }

  // 1️⃣ ONLY OPEN WHATSAPP (NO automation)
  if (hasOpen && !hasSend) {
    exec(`start "" "whatsapp:"`, () => {
      console.log("🟢 WhatsApp opened (ONLY OPEN MODE)");
      return res.send("WhatsApp opened successfully.");
    });
    return;
  }*/

  // 2️⃣ OPEN WHATSAPP + SEND MESSAGE (Automation mode)

app.post("/chrome", (req, res) => {
  console.log("🟦 Opening Chrome...");

  exec(`start chrome`, (err) => {
    if (err) {
      console.log("❌ Chrome not found");
      return res.send("Chrome not found on this PC.");
    }

    console.log("🟢 Chrome opened");
    res.send("Opened Chrome.");
  });
});

// --------------------------------------

app.post("/vscode", (req, res) => {
  console.log("🟦 Opening VS Code...");

  
  exec(`code`, (err) => {
    if (!err) {
      console.log("🟢 VS Code opened using PATH");
      return res.send("VS Code opened.");
    }

    const exe = `"${process.env.LOCALAPPDATA}\\Programs\\Microsoft VS Code\\Code.exe"`;

    exec(`powershell -command ${exe}`, (err2) => {
      if (!err2) {
        console.log("🟢 VS Code opened via EXE");
        return res.send("VS Code opened via EXE.");
      }

      console.log("❌ VS Code not found on this PC");
      res.send("VS Code not found.");
    });
  });
});

// --------------------------------------
// 🚀 START SERVER
// --------------------------------------


app.get("/speak", (res) => {
  res.sendFile(path.join(__dirname, "voice.html"));
});

app.get("/chat", (res) => {
  res.sendFile(path.join(__dirname, "chat.html"));
});



//chat route //

/*const AGNES_API_KEY = process.env.AGNES_API_KEY;
const AGNES_BASE_URL = process.env.AGNES_BASE_URL;*/

app.post("/chat", async (req, res) => {  
  const { message } = req.body;  
  console.log("Recived message:", message);
  
  try { 
    const lower = message.toLowerCase().trim();

    // 🖼 IMAGE CHECK
  const isImageRequest = lower.includes("generate") && lower.includes("image")|| lower.includes("create") && lower.includes("image");

    if (isImageRequest) {
      
      try {
        const imageResponse = await fetch("http://localhost:5000/generate_image", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ prompt: message }),
        });

        const data = await imageResponse.json();
        console.log("🛑 IMAGE RETURN");

        return res.json(data);

      } catch (error) {
        return res.status(500).json({ error: "Image route failed" });
      }
    }

 // 🎬 VIDEO CHECK (V.D. command)
 
 const small = message.toLowerCase().trim();

const isVideoRequest = small.includes("generate") && small.includes("video") || small.includes("create") && small.includes("video");
 
if (isVideoRequest) {

  console.log("🎬 Video generation prompt received:", message);
  const videoPrompt =  message;


  try{

    await fetch("http://localhost:5000/generate-video", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt: videoPrompt }),

    });

    const videoData = await videoRes.json();

    return res.json(videoData);   

  } catch (error) {
    return res.status(500).json({ error: "Video route failed" });
  }
}
    
 

    // 🏏 CRICKET CHECK
    const isCricket =
     lower.startsWith("score") || lower.includes("cricket") || lower.includes("match");
      
if (isCricket) {
  try {
    const cricketResponse = await fetch(
      "https://api.cricapi.com/v1/currentMatches?apikey=bd447f5a-529b-477e-87c9-4047e08687b9&offset=0"
    );

    const cricketData = await cricketResponse.json();

console.log("Cricket API Response:", cricketData);

const match = cricketData.data.find(m =>
  message.toLowerCase().includes(m.teams[0].toLowerCase()) ||
  message.toLowerCase().includes(m.teams[1].toLowerCase())
);

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
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: modifiedPrompt }]
      }),
    });

    const data = await response.json();

    const finalText =
      data.output_text ||
      data.choices?.[0]?.message?.content ||
      "No response";

    console.log("Cricket AI Reply:", finalText);
    
    const voiceResponse = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: finalText,
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      }
    );

    res.set({
      "Content-Type": "audio/mpeg",
    });

    return voiceResponse.body.pipe(res);

  } catch (error) {
    return res.status(500).json({ error: "Cricket route failed" });
  }
}
    

    // Automation Keywords
    const isYoutube = lower.includes("open youtube");
    const isWhatsapp = lower.includes("open whatsapp");
    const isChrome = lower.includes("open chrome");
    const isVSCode = lower.includes("open visual studio code");

    const isAutomation = isYoutube || isWhatsapp || isChrome || isVSCode;

    // 🟢 AUTOMATION MODE  
    if (isAutomation) {

      const speakText = "okay sir";

      res.json({ message: speakText });
     /* const voiceResponse = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
        {
          method: "POST",
          headers: {
            "xi-api-key": ELEVENLABS_API_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: speakText,
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75
            },
          }),
        }
      );

      console.log("Voice status:", voiceResponse.status);
    console.log("Voice type:", voiceResponse.headers.get("content-type"));

if (!voiceResponse.ok) {
  const errorText = await voiceResponse.text();
  console.log("Voice Error:", errorText);
  return res.status(500).json({ error: "Voice failed" });
}

      const audioBuffer = await voiceResponse.arrayBuffer();

      res.set({
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.byteLength,
      });

      res.send(Buffer.from(audioBuffer));*/

      setTimeout(() => {
        if (isYoutube) {
          fetch("http://localhost:5000/youtube", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ command: message }),
          });
        }

        if (isWhatsapp) {
          fetch("http://localhost:5000/whatsapp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ command: message }),
          });
        }

        if (isChrome) {
          fetch("http://localhost:5000/chrome", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ command: message }),
          });
        }

        if (isVSCode) {
          fetch("http://localhost:5000/vscode", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ command: message }),
          });
        }

      }, 800);

      return;
    }

  
    console.log("🔥 AI ROUTE HIT:", message);

    let finalText = "";

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
    method: "POST",
    headers: {
      "Authorization": `Bearer ${GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "openai/gpt-oss-20b",
      messages: [{ role: "user", content: SYSTEM_RULES  }],
      reasoning_effort:"low",
      temperature: 0.3,
      max_tokens: 500, // 1 line ke liye itna kaafi hai
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.log("Groq Error:", err);
    return res.sendStatus(response.status);
}

  const data = await response.json();

console.log("🔥 GROQ STATUS:", response.status);
console.log("🔥 GROQ DATA:", data);
  // Groq me sirf yahi format aayega
  finalText = data.choices?.[0]?.message?.content?.trim() || "No response";
console.log("AI Reply:", finalText);

res.json({ message: finalText });





/*console.log("Ai Reply :" ,finalText);
console.log("ElevenLabs voice coming ");
// Groq TTS - ElevenLabs ka replacement
const voiceResponse = await fetch(
  "https://api.groq.com/openai/v1/audio/speech",
  {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "canopylabs/orpheus-v1-english",
     input: finalText.slice(0, 195), 
      voice:  "autumn", 
      response_format: "wav"     //  Female - Rachel jaisi
      // voice: "Fritz-PlayAI", // Male chahiye to ye use karo
    }),
  }
);

if (!voiceResponse.ok) {
  const errorText = await voiceResponse.text();
  console.error("Groq TTS Error:", errorText);
  return res.status(voiceResponse.status).json({ error: errorText });
}

const audioBuffer = Buffer.from(await voiceResponse.arrayBuffer());

res.set("Content-Type", "audio/wav");
return res.send(audioBuffer);*/

   /*const voiceResponse = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: finalText,
          voice_settings: { stability: 0.5, similarity_boost: 0.75 },
        }),
      }
    );

    if (!voiceResponse.ok) {
  const errorText = await voiceResponse.text();
  console.error("ElevenLabs Error:", errorText);
  return res.status(voiceResponse.status).json({ error: errorText });
}

    
    const audioBuffer = Buffer.from(await voiceResponse.arrayBuffer());

res.set("Content-Type", "audio/mpeg");

return res.send(audioBuffer);*/

    /*res.set({
      "Content-Type": "audio/mpeg",
    });

    return voiceResponse.body.pipe(res);*/

 } catch (error) {  
    console.error("Speak Route Error:", error);  
    res.status(500).json({ error: error.message });  
  }
});



  app.post("/generate_image", async (req, res) => {
  try {
    const { prompt } = req.body;
    console.log("Received text:", prompt);

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "Invalid prompt" });
    }

    const encoded = encodeURIComponent(prompt);
    const  url = `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1024&nologo=true&model=flux`;

    console.log("Requesting:", url);

    const response = await fetch(url);

    console.log("Pollinations Status:", response.status);
    console.log("Content-Type:", response.headers.get("content-type"));

    if (!response.ok) {
      const err = await response.text();
      console.log("Pollinations Error:", err);
      return res.sendStatus(response.status);
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.startsWith("image/")) {
      const errText = await response.text();
      console.log("Non-image response:", errText);
      return res.status(502).json({});
    }

    const buffer = await response.arrayBuffer();
    console.log("Image bytes:", buffer.byteLength);

    const base64Image = Buffer.from(buffer).toString("base64");

    return res.json({
      type: "image",
      image: base64Image,
    });

  } catch (error) {
    console.error("Image Route Error:", error);
    return res.status(500).json({ message: "Image generation failed" });
  }
});

app.post("/generate-video", async (req, res) => {
  try {
    const { prompt } = req.body;
    console.log("🎬 [1] /generate-video hit");
    console.log("🎬 [2] Prompt:", prompt);

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "Invalid prompt" });
    }

    const encodedPrompt = encodeURIComponent(prompt);
    const url = `https://gen.pollinations.ai/video/${encodedPrompt}?model=veo&duration=5&aspectRatio=16:9`;

    console.log("🎬 Sending to Pollinations:", url);

    const pollRes = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${process.env.POLLINATIONS_API_KEY}`,
      },
    });

    console.log("Pollinations Status:", pollRes.status);
    console.log("Content-Type:", pollRes.headers.get("content-type"));

    if (!pollRes.ok) {
      const err = await pollRes.text();
      console.log("Pollinations Error:", err);
      return res.status(pollRes.status).json({ error: err });
    }

    const contentType = pollRes.headers.get("content-type") || "";
    if (!contentType.startsWith("video/")) {
      const errText = await pollRes.text();
      console.log("Non-video response:", errText);
      return res.status(502).json({ error: "Provider did not return a video" });
    }

    const buffer = await pollRes.arrayBuffer();
    console.log("Video bytes:", buffer.byteLength);

    const base64Video = Buffer.from(buffer).toString("base64");

    return res.json({
      type: "video",
      video: base64Video,
    });

  } catch (err) {
    console.error("Video route error:", err);
    return res.status(500).json({ error: "Video generation failed" });
  }
});



// 🎧 YOUTUBE SONG AUTOMATION
app.post("/youtube", async (req, res) => {
  try {
    console.log("🎙 YouTube command received");

    let command = req.body.command.toLowerCase();
    let songName = command.replace("nexa", "").trim();
    if (!songName) songName = "latest songs";

    console.log("🎵 Searching:", songName);

    // ⭐ UNIVERSAL VIDEO + SONG DIRECT PLAY URL
    const search = encodeURIComponent(songName + " youtube");
    const url = `https://www.google.com/search?q=${search}+site:youtube.com&btnI=1`;

    // OPEN IN CHROME → DIRECT VIDEO PLAY
    exec(`start chrome "${url}"`);

   /* await VoiceModel.create({
      command:req.body.command});
    console.log("saved to mongodb :" ,req.body.command );*/

    res.json({ status: "ok", action: `Playing: ${songName}` });

  } catch (err) {
    console.error("Robot.js Error:", err);
    res.status(500).json({ error: "Automation failed" });
  }
});



// =====================================================================
// WhatsApp Desktop automation via PowerShell SendKeys
// =====================================================================

app.post("/whatsapp", async (req, res) => {
  console.log("🟦 Opening WhatsApp...");
  const { command } = req.body;
  console.log("whatsapp route hit:", command);

  if (!command || typeof command !== "string") {
    return res.json({ success: false, message: "Command is required" });
  }

  const lower = command.toLowerCase().trim();
  const hasOpen = lower.startsWith("open whatsapp");
  const hasSend = lower.includes("send message to");

  // 1️⃣ Sirf open karna (purana behaviour)
  if (hasOpen && !hasSend) {
    exec(`start "" "whatsapp:"`, () => {
      console.log("🟢 WhatsApp opened (ONLY OPEN MODE)");
      return res.send("WhatsApp opened successfully.");
    });
    return;
  }

  // 2️⃣ Message bhejna (Desktop app ke through)
  if (hasSend) {
    const afterKeyword = command.split(/send message to/i)[1];
    if (!afterKeyword || !afterKeyword.trim()) {
      return res.json({
        success: false,
        message: "Contact and message are required",
      });
    }

    const parts = afterKeyword.trim().split(/\s+/);
    const contact = parts.shift();
    const text = parts.join(" ");

    if (!contact) {
      return res.json({ success: false, message: "Contact not specified" });
    }
    if (!text) {
      return res.json({ success: false, message: "Message text not specified" });
    }

    // Pehle WhatsApp Desktop open/focus karo, phir send
    exec(`start "" "whatsapp:"`, async () => {
      await new Promise((r) => setTimeout(r, 3500));

      try {
        const result = await sendWhatsAppDesktop(contact, text);
        return res.json(result);
      } catch (err) {
        console.error("WhatsApp route error:", err);
        return res.json({
          success: false,
          message: "Failed to send WhatsApp message",
        });
      }
    });
    return;
  }

  return res.json({ success: false, message: "Unrecognized WhatsApp command" });
});


/*app.post("/whatsapp", (req, res) => {
  console.log("🟦 Opening WhatsApp...");
  const { command } = req.body;
  console.log("whatsapp route hit:", command);

  const lower = command.toLowerCase().trim();

  // 🔵 Detect command type
  const hasOpen = lower.startsWith("open whatsapp");
  const hasSend = lower.includes("send message to");

  // 🔵 Extract contact + message ONLY IF send command exists
  let contact = "";
  let text = "";

  if (hasSend && hasOpen) {
     exec(`start WHA "${url}"`);
    const parts = command.split("send message to")[1].trim().split(" ");
    contact = parts.shift();
    text = parts.join(" ");
  }

  // 1️⃣ ONLY OPEN WHATSAPP (NO automation)
  if (hasOpen && !hasSend) {
    exec(`start "" "whatsapp:"`, () => {
      console.log("🟢 WhatsApp opened (ONLY OPEN MODE)");
      return res.send("WhatsApp opened successfully.");
    });
    return;
  }*/

  // 2️⃣ OPEN WHATSAPP + SEND MESSAGE (Automation mode)

app.post("/chrome", (req, res) => {
  console.log("🟦 Opening Chrome...");

  exec(`start chrome`, (err) => {
    if (err) {
      console.log("❌ Chrome not found");
      return res.send("Chrome not found on this PC.");
    }

    console.log("🟢 Chrome opened");
    res.send("Opened Chrome.");
  });
});

// --------------------------------------

app.post("/vscode", (req, res) => {
  console.log("🟦 Opening VS Code...");

  
  exec(`code`, (err) => {
    if (!err) {
      console.log("🟢 VS Code opened using PATH");
      return res.send("VS Code opened.");
    }

    const exe = `"${process.env.LOCALAPPDATA}\\Programs\\Microsoft VS Code\\Code.exe"`;

    exec(`powershell -command ${exe}`, (err2) => {
      if (!err2) {
        console.log("🟢 VS Code opened via EXE");
        return res.send("VS Code opened via EXE.");
      }

      console.log("❌ VS Code not found on this PC");
      res.send("VS Code not found.");
    });
  });
});

// --------------------------------------
// 🚀 START SERVER
// --------------------------------------
app.listen(5000, () => {
  console.log("🚀 Automation Routes Server Running on PORT 5000");
});


/*app.post("/generate-image", async (req, res) => {
  try {
    const { prompt } = req.body;
    console.log("Received text:", prompt);

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "Invalid prompt" });
    }

    const response = await fetch(
      "https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell",
    
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${HUGGING_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs: prompt }),
      }
    );

    // ✅ Hugging Face response check
    console.log("HF Status:", response.status);
    console.log("HF Content-Type:", response.headers.get("content-type"));

    if (!response.ok) {
      const err = await response.text();
      console.log("HF Error:", err);
      return res.status(response.status).json({ error: err });
    }

    const buffer = await response.arrayBuffer();

    // ✅ Check image size
    console.log("Image bytes:", buffer.byteLength);

    const base64Image = Buffer.from(buffer).toString("base64");

    return res.json({
      type: "image",
      image: base64Image,
    });

  } catch (error) {
    console.error("Image Route Error:", error);
    return res.status(500).json({ error: "Image generation failed" });
  }
});*/


// =====================================================================
// WhatsApp Cloud API — Manual 5min + Freeform 5min (3 replies) + Template
// ===================================================================

// ════════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════════
// WHATSAPP CLOUD API — AI AUTO-REPLY SYSTEM
// Flow: Manual 5min → AI 5min (max 3) → Cooldown 5min → Repeat
// ════════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════════

// ---- Constants ----
// ════════════════════════════════════════════════════════════
// WHATSAPP CLOUD API — INSTANT AI REPLY
// ════════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════════
// WHATSAPP CLOUD API — INSTANT AI REPLY
// No timers, no Redis, no BullMQ
// ════════════════════════════════════════════════════════════

const GROQ_MODEL = "llama-3.3-70b-versatile";

// ---- Groq AI ----
async function askGroq(userMessage) {
  const SYSTEM_RULES = `
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
${userMessage}

FINAL OUTPUT:
`;

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [{ role: "user", content: SYSTEM_RULES }],
      temperature: 0.3,
      max_tokens: 500,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq error: ${res.status} ${err}`);
  }

  const data = await res.json();
  const reply = data.choices?.[0]?.message?.content?.trim();
  if (!reply) throw new Error("Empty Groq reply");
  return reply;
}

// ---- WhatsApp Send Text ----
async function waSendText(to, text) {
  const url = `https://graph.facebook.com/v21.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: text },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`WhatsApp send failed: ${res.status} ${err}`);
  }
  return res.json();
}

// ---- Webhook Verification (GET) ----
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    console.log("✅ Webhook verified");
    return res.status(200).send(challenge);
  }
  console.log("❌ Webhook verification failed");
  return res.sendStatus(403);
});

// ---- Webhook Handler (POST) ----
app.post("/webhook", async (req, res) => {
  res.sendStatus(200);

  try {
    const body = req.body;
    if (body.object !== "whatsapp_business_account") return;

    const entry = body.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    if (!value) return;

    const messages = value.messages;
    if (!Array.isArray(messages)) return;

    for (const message of messages) {
      if (message.type !== "text") continue;

      const from = message.from;
      const text = message.text?.body;
      if (!from || !text) continue;

      console.log(`📩 [${from}] ${text}`);

      try {
        const reply = await askGroq(text);
        await waSendText(from, reply);
        console.log(`📤 [${from}] Reply: ${reply}`);
      } catch (err) {
        console.error(`Reply failed [${from}]:`, err.message);
      }
    }
  } catch (err) {
    console.error("Webhook error:", err.message);
  }
});

// ════════════════════════════════════════════════════════════
// END — WhatsApp Cloud API
// ════════════════════════════════════════════════════════════

// ============================================
// 🚀 START SERVER
// ============================================
app.listen(5000, () => {
  console.log("🚀 Automation Routes Server Running on PORT 5000");
});

