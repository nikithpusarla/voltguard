require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const nodemailer = require('nodemailer');
const { GoogleGenAI } = require('@google/genai');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_PROMPT = `You are the VoltGuard Electrical virtual assistant. VoltGuard Electrical is a 24/7 national commercial electrical contractor (phone 1800 945 221, email service@voltguardelectrical.com.au). Services: Asset Management, Reactive Maintenance, Statutory Testing, National Account Management, EV Charger Installation, Energy Efficiency Audits, Commercial Lighting Upgrades, Energy Metering, Solar Power. Service area: Australia-wide, major cities Sydney, Melbourne, Brisbane, Canberra, Adelaide, Perth, Darwin, Hobart. Be concise, friendly, professional. Never invent specific prices — give general guidance and offer to connect them with the team for a quote. If the user wants a quote or callout, collect name, phone, suburb, and a brief description of the issue, then confirm a team member will follow up, and output a structured JSON lead block at the end of your reply for the backend to capture. Don't give live electrical safety/DIY repair advice — for anything involving exposed wiring, sparks, burning smell, or shock risk, tell them to stop, stay away from the area, and call the 24/7 line immediately.

CRITICAL: When you have gathered enough info for a lead (name, phone, suburb, description), you MUST include exactly ONE valid JSON block at the very end of your response, wrapped in \`\`\`json and \`\`\` tags.
Format:
\`\`\`json
{
  "lead": {
    "name": "...",
    "phone": "...",
    "suburb": "...",
    "description": "..."
  }
}
\`\`\``;

// Helper to send email notification
async function notifyLead(lead) {
  console.log('--- NEW LEAD CAPTURED ---', lead);
  
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('SMTP credentials not configured. Lead captured but email not sent.');
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: `"VoltGuard Bot" <${process.env.SMTP_USER}>`,
      to: process.env.LEAD_NOTIFICATION_EMAIL || 'service@voltguardelectrical.com.au',
      subject: `New Lead: ${lead.name} from Chatbot`,
      text: `New lead captured from the chat widget:\n\nName: ${lead.name}\nPhone: ${lead.phone}\nSuburb: ${lead.suburb}\nDescription: ${lead.description}`,
    });
    console.log('Lead notification email sent successfully.');
  } catch (error) {
    console.error('Failed to send lead email:', error);
  }
}

// Memory cache for simple rate limiting
const ipRequestCounts = new Map();

// Serve static files from root directory (where index.html is)
app.use(express.static(__dirname));

app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;
  const ip = req.ip || req.connection.remoteAddress;

  // Simple Rate Limiting (max 20 requests per IP)
  const count = ipRequestCounts.get(ip) || 0;
  if (count >= 20) {
    return res.status(429).json({ error: 'Rate limit exceeded. Please call 1800 945 221.' });
  }
  ipRequestCounts.set(ip, count + 1);

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Messages array is required' });
  }

  try {
    if (!process.env.GEMINI_API_KEY) {
      // Mock response if API key is missing (for local testing without exposing key)
      const mockReply = "Hello! I am the VoltGuard Assistant. (API Key not configured, mock mode active). How can I help you today?";
      return res.json({ reply: mockReply });
    }

    // Format messages for Gemini API
    // Gemini expects an array of contents with role (user/model) and parts [{text: "..."}]
    const formattedHistory = [];
    
    // We handle the system prompt in the SDK call, so we just map user/assistant messages
    for (const msg of messages) {
        if(msg.role === 'user') {
            formattedHistory.push({ role: 'user', parts: [{ text: msg.content }] });
        } else if (msg.role === 'assistant') {
            formattedHistory.push({ role: 'model', parts: [{ text: msg.content }] });
        }
    }

    // Extract the latest user message to send
    const latestMessage = formattedHistory.pop();
    
    const chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: SYSTEM_PROMPT,
            temperature: 0.2
        }
    });

    // Send history if any (Wait, google-genai SDK takes history differently. 
    // We should send the full conversation context or initialize chat with history.
    // The google-genai chat instance manages history automatically if we use it across turns,
    // but this is a stateless endpoint. Let's just create a new text generation request with concatenated history,
    // or initialize the chat with history.
    const chatWithHistory = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: SYSTEM_PROMPT,
            temperature: 0.2
        },
        history: formattedHistory
    });

    const response = await chatWithHistory.sendMessage({ message: latestMessage.parts[0].text });
    let replyText = response.text;

    // Check for lead JSON block
    const jsonRegex = /```json\s*(\{[\s\S]*?\})\s*```/;
    const match = replyText.match(jsonRegex);
    
    if (match) {
      try {
        const parsed = JSON.parse(match[1]);
        if (parsed.lead) {
          // Process lead asynchronously
          notifyLead(parsed.lead);
          // Strip JSON from user-facing reply
          replyText = replyText.replace(match[0], '').trim();
        }
      } catch (err) {
        console.error('Failed to parse lead JSON:', err);
      }
    }

    res.json({ reply: replyText });
  } catch (error) {
    console.error('Chat API Error:', error);
    res.status(500).json({ error: 'Internal server error while processing chat.' });
  }
});

app.listen(PORT, () => {
  console.log(`VoltGuard Server running on http://localhost:${PORT}`);
});
