const express = require("express");
const app = express();

app.use(express.json());

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  next();
});

const SERVICES = [
  { id: "window_exterior", label: "Window Cleaning - Exterior Only", unit: "pane", baseRate: 4 },
  { id: "window_inout", label: "Window Cleaning - Inside & Outside", unit: "pane", baseRate: 6 },
  { id: "gutter_clean", label: "Gutter Cleaning", unit: "linear_ft", baseRate: 1.5 },
  { id: "roof_clean", label: "Roof Cleaning", unit: "sq_ft", baseRate: 0.70 },
  { id: "pressure_drive", label: "Pressure Washing - Driveway", unit: "sq_ft", baseRate: 0.35 },
  { id: "house_wash", label: "House Wash / Siding", unit: "sq_ft", baseRate: 0.45 }
];

app.get("/services", (req,res) => res.json(SERVICES));

app.post("/quotes", (req,res) => {
  const { serviceId, units } = req.body;
  const svc = SERVICES.find(s => s.id === serviceId);

  if (!svc) return res.status(400).json({ message: "Unknown service" });

  const base = svc.baseRate * units;
  const buffer = base * 0.05;
  const subtotal = Math.max(120, base + buffer);
  const tax = subtotal * 0.05;
  const total = subtotal + tax;

  res.json({
    serviceName: svc.label,
    units,
    subtotal: subtotal.toFixed(2),
    tax: tax.toFixed(2),
    total: total.toFixed(2)
  });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log("Backend running on:", PORT));
