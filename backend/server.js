const express = require("express");
const cors = require("cors");
const axios = require("axios");
const OpenAI = require("openai");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { InferenceClient } = require("@huggingface/inference");
const pdfParse = require("pdf-parse");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: true }));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY
);

const hf = new InferenceClient(
  process.env.HF_API_KEY
);

async function searchWeb(query) {
  const response = await axios.post(
    "https://api.tavily.com/search",
    {
      query: query,
      search_depth: "basic",
      max_results: 5,
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.TAVILY_API_KEY}`,
      },
    }
  );

  return response.data.results
    .map((item, index) => {
      return `${index + 1}. ${item.title}\n${item.content}\n${item.url}`;
    })
    .join("\n\n");
}

app.post("/chat", async (req, res) => {
  try {
    const { message, image, fileName, fileType } = req.body;

   console.log("USER MESSAGE:", message);
if (image && fileType === "application/pdf") {
  const base64Data = image.split(",")[1];
  const pdfBuffer = Buffer.from(base64Data, "base64");

  const pdfData = await pdfParse(pdfBuffer);
  const pdfText = pdfData.text.slice(0, 12000);

  const pdfQuestion = message || "Summarize this PDF clearly.";

  const completion = await openai.chat.completions.create({
    model: "openrouter/free",
    messages: [
      {
        role: "system",
        content: `
You are ChatSG.
Answer only from the PDF content.
If the answer is not in the PDF, say you cannot find it in the PDF.
Be short, friendly, and clear.
`
      },
      {
        role: "user",
        content: `
PDF file name: ${fileName}

User question:
${pdfQuestion}

PDF content:
${pdfText}
`
      }
    ]
  });

  res.json({
    reply: completion.choices[0].message.content
  });

  return;
}

if (image && fileType && fileType.startsWith("text/")) {
  const base64Data = image.split(",")[1];
  const textContent = Buffer.from(base64Data, "base64").toString("utf-8");

  res.json({
    reply: textContent.slice(0, 4000)
  });

  return;
}

if (image && fileType && fileType.startsWith("image/")) {
  res.json({
    reply: "Image AI is not available now daa. Gemini quota illa, so image understanding later fix pannalam."
  });

  return;
}

let webResults = "";

const searchKeywords = [
  "latest",
  "current",
  "today",
  "news",
  "cm",
  "chief minister",
  "prime minister",
  "president",
  "price",
  "weather",
  "2026",
  "2027",
  "who is"
];

const safeMessage = message || "";

const shouldSearch = searchKeywords.some(keyword =>
  safeMessage.toLowerCase().includes(keyword)
);

if (shouldSearch) {
  webResults = await searchWeb(safeMessage);

  console.log("WEB RESULTS:");
  console.log(webResults);
}

    const userContent = image
  ? [
      {
        type: "text",
        text: `
User question:
${safeMessage}

Web search results only if available:
${webResults}
`
      },
      {
        type: "image_url",
        image_url: {
          url: image
        }
      }
    ]
  : `
User question:
${safeMessage}

Web search results only if available:
${webResults}
`;

const completion = await openai.chat.completions.create({
  model: "openrouter/free",
  messages: [
        {
          role: "system",
          content: `
You are ChatSG, a friendly chatbot.

Default rule:
- Always reply in English.

Language rules:
- If the user asks to talk in Tanglish, reply in Tanglish only.
- Tanglish means Tamil words written in English letters. Never use Tamil script.
- If the user asks to talk in Tamil, reply in Tamil script.
- If the user asks to talk in Telugu or Telugish, reply in Telugish only.
- Telugish means Telugu words written in English letters. Never use Telugu script unless the user asks for Telugu script.
- If the user asks to talk in Hindi, reply in Hinglish only.
- Hinglish means Hindi words written in English letters.
- If the user asks for any other language, reply in that language style. Prefer romanized text unless the user asks for native script.

Style:
- Be friendly, casual, short, and natural.
- Do not sound strict, robotic, or corporate.
- Do not use markdown symbols like *, **, headings, bullet points, or horizontal lines.
- Do not output labels like User Safety, Assistant, Metadata, System, or Analysis.
- Just answer directly.
- Answer only the user's exact question.
- Never add unrelated information.
- Never add links unless the user asks.

Current information:
- Use ONLY the latest web search results for current facts.
- If web results mention a current answer, trust web results over your memory.
- Never answer current facts from memory.
- If web results are missing or unclear, say you are not sure.
`,
        },
    {
  role: "user",
  content: userContent,
},
      ],
    });

    res.json({
      reply: completion.choices[0].message.content,
    });
  } catch (error) {
    console.log("FULL ERROR:", error.message);

   res.status(500).json({
  reply: "AI limit reached daa 😓 Konjam time kalichu try pannunga, illa new API key / paid credits venum."
});
  }
});

// app.listen(3000, () => {
//   console.log("🚀 Latest AI Chatbot Backend Running On Port 3000");
// });

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});

// fetch("http://192.168.29.18:3000/chat", {  ithu ai.js laa addd pannanum}