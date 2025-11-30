// index.js - ClearView backend with Google Vision window auto-detect

import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 10000;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

// --- Basic services + pricing (you can tweak these) ---
const services = [
  { id: 1, name: "Window Cleaning", pricePerUnit: 7, unitLabel: "window" },
  { id: 2, name: "Gutter Cleaning", pricePerUnit: 150, unitLabel: "job" },
  { id: 3, name: "Pressure Washing", pricePerUnit: 125, unitLabel: "hour" },
  { id: 4, name: "House Washing", pricePerUnit: 60, unitLabel: "hour" },
  { id: 5, name: "Rope Access", pricePerUnit: 50, unitLabel: "hour" },
];

const HOME_BASE_ADDRESS = "2969 Whisper Way, Coquitlam, BC";
const TAX_RATE = 0.05;

app.use(cors());
app.use(express.json());

// Simple root
app.get("/", (req, res) => {
  res.send("ClearView backend is running");
});

// Return all services
app.get("/services", (req, res) => {
  res.json(services);
});

// Manual quote (existing)
app.post("/quotes", (req, res) => {
  const { serviceId, units } = req.body;

  const service = services.find((s) => s.id === Number(serviceId));
  if (!service) {
    return res.status(400).json({ error: "Invalid service" });
  }

  const unitsNum = Number(units);
  if (Number.isNaN(unitsNum) || unitsNum <= 0) {
    return res.status(400).json({ error: "Units/hours must be a positive number" });
  }

  const subtotal = unitsNum * service.pricePerUnit;
  const tax = +(subtotal * TAX_RATE).toFixed(2);
  const total = +(subtotal + tax).toFixed(2);

  res.json({
    service: service.name,
    units: unitsNum,
    pricePerUnit: service.pricePerUnit,
    subtotal,
    tax,
    total,
  });
});

// ---------- Helpers for auto-detect ----------

// 1) Geocode address -> {lat, lng}
async function geocodeAddress(address) {
  const url =
    "https://maps.googleapis.com/maps/api/geocode/json?address=" +
    encodeURIComponent(address) +
    "&key=" +
    GOOGLE_API_KEY;

  const response = await fetch(url);
  const data = await response.json();

  if (!data.results || !data.results[0]) {
    throw new Error("No geocoding results");
  }

  return data.results[0].geometry.location; // { lat, lng }
}

// 2) Build Street View image URL
function buildStreetViewUrl({ lat, lng }) {
  const size = "640x640";
  return (
    "https://maps.googleapis.com/maps/api/streetview" +
    "?size=" +
    size +
    "&location=" +
    lat +
    "," +
    lng +
    "&key=" +
    GOOGLE_API_KEY
  );
}

// 3) Call Vision API to count windows
async function countWindowsFromImage(imageUrl) {
  const url =
    "https://vision.googleapis.com/v1/images:annotate?key=" + GOOGLE_API_KEY;

  const body = {
    requests: [
      {
        image: { source: { imageUri: imageUrl } },
        features: [
          { type: "OBJECT_LOCALIZATION", maxResults: 100 },
          { type: "LABEL_DETECTION", maxResults: 50 },
        ],
      },
    ],
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  const visionResp = data.responses && data.responses[0];
  if (!visionResp) {
    console.log("Vision: no responses", JSON.stringify(data));
    return { windowCount: 0 };
  }

  let windowCount = 0;

  // OBJECT_LOCALIZATION: look for objects named "Window"
  if (visionResp.localizedObjectAnnotations) {
    for (const obj of visionResp.localizedObjectAnnotations) {
      if (obj.name && obj.name.toLowerCase().includes("window")) {
        windowCount++;
      }
    }
  }

  // Fallback – if Vision thinks the image is full of "Window" labels,
  // we can approximate count using score.
  if (windowCount === 0 && visionResp.labelAnnotations) {
    const windowLabel = visionResp.labelAnnotations.find((l) =>
      (l.description || "").toLowerCase().includes("window")
    );
    if (window
