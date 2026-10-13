require("dotenv").config();

const express = require("express");
const cors = require("cors");

const { GoogleGenAI } = require("@google/genai");

const portfolioContext = require("./portfolio-context");

const app = express();

const PORT = process.env.PORT || 3000;

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

app.post("/api/chat", async (req, res) => {
  try {
    const { messages } = req.body;

    if (!Array.isArray(messages)) {
      return res.status(400).json({
        error: "Invalid messages"
      });
    }

    const conversationText = messages
      .map(message => {
        const role =
          message.role === "assistant"
            ? "AI Assistant"
            : "Visitor";

        return `${role}: ${message.content}`;
      })
      .join("\n\n");

    const prompt = `
${portfolioContext}

========================================
CONVERSATION
========================================

${conversationText}

========================================
RESPONSE STYLE
========================================

Respond to the visitor's latest message.

Follow these rules carefully:

1. DO NOT write long paragraphs.

2. Use short paragraphs of 1-2 sentences maximum.

3. Use bullet points when listing information.

4. Use numbered lists when explaining multiple steps or items.

5. Use clear headings when the answer contains different sections.

6. Keep answers concise, friendly, professional and easy to read.

7. Do not repeat information unnecessarily.

8. Answer only what the visitor asked.

9. If the visitor asks about skills, group them into categories.

10. If the visitor asks about projects, show:
   - Project name
   - Short description
   - Main features
   - Technologies

11. If the visitor asks about education, show the information
    in separate lines or bullet points.

12. If the visitor asks about achievements, use bullet points.

13. If the visitor asks a simple question, give a simple answer.
    Do not provide unnecessary information.

14. If the information is not available in the portfolio context,
    say:
    "I don't have that information available."

15. NEVER invent information about Likitha.

16. NEVER claim to be Likitha.

========================================
FORMATTING EXAMPLES
========================================

For skills:

**Technical Skills**

**Programming**
- Python
- Java
- SQL

**AI / ML**
- Artificial Intelligence
- Machine Learning
- Generative AI
- NLP

**Web Development**
- HTML
- CSS
- JavaScript
- React
- REST APIs

For projects:

**ECHO - Your AI Companion**

- **Description:** Intelligent AI companion for chat, voice and video.
- **Features:** AI memory, emotion-aware responses, voice interaction.
- **Technologies:** Spring Boot, REST APIs, Prompt Engineering.

For education:

**Education**

- **College:** GM Institute of Technology
- **Degree:** B.E. Information Science and Engineering
- **Duration:** 2023 - 2027
- **CGPA:** 8.5/10

For achievements:

**Achievements**

- 70+ Google Cloud skill badges
- Google Cloud Arcade Ranger
- Multiple hands-on cloud labs and challenges
- Participated in multiple hackathons

Always prefer this structured format over large paragraphs.
`;

    const response = await ai.models.generateContent({
  model: "gemini-3-flash-preview",
  contents: prompt
});

    res.json({
      reply: response.text || "I couldn't generate a response."
    });

  } catch (error) {

    console.error("Gemini error:", error);

    res.status(500).json({
      error: "Something went wrong while talking to Gemini."
    });
  }
});

app.listen(PORT, () => {
  console.log("");
  console.log("================================");
  console.log(" Portfolio AI Agent");
  console.log(" Gemini backend");
  console.log("================================");
  console.log("");
  console.log(`Running at: http://localhost:${PORT}`);
  console.log("");
});