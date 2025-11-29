
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import openaiRoutes from "./routes/openai.js";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json({ limit: "20mb" }));

app.get("/", (req, res) => {
  res.send("Backend running!");
});

app.use("/api/openai", openaiRoutes);

const port = process.env.PORT || 10000;
app.listen(port, () => console.log("Server running on port " + port));
