// index.js / server.js - ClearView backend with tech login, house-type helper & quote saving

import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 10000;

// ---- Technicians (PIN login) ----
const technicians = [
  { id: 1, name: "Ryan", pin: "1111" },
  { id: 2, name: "Karen", pin: "2222" },
];

// ---- In-memory quote store (resets if server restarts) ----
const quotes = [];

// ---- Services (tweak prices as you like) ----
const services = [
  { id: 1, name: "Window Cleaning", pricePerUnit: 7, unitLabel: "window" },
  { id: 2, name: "Gutter Cleaning", pricePerUnit: 150, unitLabel: "job" },
  { id: 3, name: "Pressure Washing", pricePerUnit: 125, unitLabel: "hour" },
  { id: 4, name: "House Washing", pricePerUnit: 60, unitLabel: "hour" },
  { id: 5, name: "Rope Access", pricePerUnit: 50, unitLabel: "hour" },
];

const TAX_RATE = 0.05;

app.use(cors());
app.use(express.json());

// Root
app.get("/", (req, res) => {
  res.send("ClearView backend is running");
});

// ---- Technician login (PIN) ----
app.post("/login", (req, res) => {
  const { pin } = req.body || {};
  if (!pin) {
    return res.status(400).json({ error: "PIN is required" });
  }

  const tech = technicians.find((t) => t.pin === String(pin));
  if (!tech) {
    return res.status(401).json({ error: "Invalid PIN" });
  }

  return res.json({
    message: "Login successful",
    tech: { id: tech.id, name: tech.name },
  });
});

// ---- List services ----
app.get("/services", (req, res) => {
  res.json(services);
});

// ---- Basic quote calculation (used by frontend) ----
app.post("/quotes", (req, res) => {
  const { serviceId, units, address, customerName, houseType, technicianId } =
    req.body || {};

  const service = services.find((s) => s.id === Number(serviceId));
  if (!service) {
    return res.status(400).json({ error: "Invalid service" });
  }

  const unitsNum = Number(units);
  if (Number.isNaN(unitsNum) || unitsNum <= 0) {
    return res.status(400).json({ error: "Units/hours must be > 0" });
  }

  let subtotal = unitsNum * service.pricePerUnit;

  // Example min: gutter cleaning min $150
  if (service.name.toLowerCase().includes("gutter") && subtotal < 150) {
    subtotal = 150;
  }

  const tax = +(subtotal * TAX_RATE).toFixed(2);
  const total = +(subtotal + tax).toFixed(2);

  const result = {
    id: Date.now(),
    createdAt: new Date().toISOString(),
    customerName: customerName || "",
    address: address || "",
    houseType: houseType || "",
    technicianId: technicianId || null,
    service: service.name,
    units: unitsNum,
    pricePerUnit: service.pricePerUnit,
    subtotal,
    tax,
    total,
  };

  res.json(result);
});

// ---- Save quote (stores in memory) ----
app.post("/quotes/save", (req, res) => {
  const {
    quote,
    technician,
  } = req.body || {};

  if (!quote) {
    return res.status(400).json({ error: "Quote object required" });
  }

  const id = Date.now();
  const saved = {
    id,
    ...quote,
    savedAt: new Date().toISOString(),
    technician: technician || null,
  };

  quotes.unshift(saved); // latest first
  res.json({ message: "Quote saved", quote: saved });
});

// ---- Get saved quotes (optionally filter by techId) ----
app.get("/quotes", (req, res) => {
  const techId = req.query.techId;
  if (techId) {
    return res.json(
      quotes.filter(
        (q) =>
          q.technician && String(q.technician.id) === String(techId)
      )
    );
  }
  res.json(quotes);
});

// ---- Auto house-type suggestion ----
// Very simple heuristic based on address content / keywords
app.post("/detect-house-type", (req, res) => {
  const { address = "" } = req.body || {};
  const a = address.toLowerCase();

  let type = "Detached House";
  let confidence = 0.5;

  if (!address.trim()) {
    return res.json({ houseType: type, confidence: 0.3 });
  }

  if (a.includes("apt") || a.includes("apartment") || a.includes("#") || a.includes("unit") || a.includes("suite")) {
    type = "Condo / Apartment";
    confidence = 0.7;
  } else if (a.includes("townhouse") || a.includes("townhome") || a.includes("th")) {
    type = "Townhouse";
    confidence = 0.7;
  } else if (a.includes("office") || a.includes("plaza") || a.includes("mall") || a.includes("rd unit")) {
    type = "Commercial / Storefront";
    confidence = 0.6;
  } else {
    type = "Detached House";
    confidence = 0.8;
  }

  res.json({ houseType: type, confidence });
});

// ------------------------------------------------

app.listen(PORT, () => {
  console.log(`ClearView backend running on port ${PORT}`);
});
