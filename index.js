import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// ------------------------
// SERVICES LIST
// ------------------------
const services = [
  { id: 1, name: "Window Cleaning", pricePerUnit: 5 },
  { id: 2, name: "Gutter Cleaning", pricePerUnit: 3 },
  { id: 3, name: "Pressure Washing", pricePerUnit: 8 },
  { id: 4, name: "Roof Cleaning", pricePerUnit: 12 },
  { id: 5, name: "House Washing", pricePerUnit: 10 },
  { id: 6, name: "Soft Wash Siding", pricePerUnit: 7 }
];

// ------------------------
// GET ALL SERVICES
// ------------------------
app.get("/services", (req, res) => {
  res.json(services);
});

// ------------------------
// GENERATE QUOTE
// ------------------------
app.post("/quotes", (req, res) => {
  const { serviceId, units } = req.body;

  const service = services.find(s => s.id === Number(serviceId));
  if (!service) {
    return res.status(400).json({ error: "Invalid service ID" });
  }

  const subtotal = service.pricePerUnit * Number(units);
  const tax = subtotal * 0.12;
  const total = subtotal + tax;

  res.json({
    service: service.name,
    units: Number(units),
    subtotal,
    tax,
    total
  });
});

// ------------------------
// START SERVER
// ------------------------
const PORT = process.env.PORT || 10000;
app.listen(PORT, () =>
  console.log(`🚀 ClearView Backend running on port ${PORT}`)
);
