
import express from "express";
import multer from "multer";
import { OpenAI } from "openai";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

router.post("/text", async (req, res) => {
  try {
    const { prompt } = req.body;
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });
    res.json({ output: response.choices[0].message.content });
  } catch (e) {
    res.status(500).json({ error: "OpenAI text error" });
  }
});

router.post("/vision", upload.single("image"), async (req, res) => {
  try {
    const prompt = req.body.prompt || "Describe the image.";
    const imageBuffer = req.file.buffer.toString("base64");
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "user", content: [
            { type: "input_text", text: prompt },
            { type: "input_image", image_url: `data:image/jpeg;base64,${imageBuffer}` }
        ]}
      ]
    });
    res.json({ output: response.choices[0].message.content });
  } catch (e) {
    res.status(500).json({ error: "OpenAI vision error" });
  }
});

export default router;
