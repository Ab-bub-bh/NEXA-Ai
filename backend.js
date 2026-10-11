import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 5000);

app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.use((req, res, next) => {
  const requestId =
    req.headers["x-request-id"] ||
    `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  req.requestId = requestId;
  res.setHeader("x-request-id", requestId);

  const start = Date.now();
  console.log(`[${requestId}] ${req.method} ${req.originalUrl}`);

  res.on("finish", () => {
    console.log(
      `[${requestId}] ${req.method} ${req.originalUrl} -> ${res.statusCode} in ${Date.now() - start}ms`
    );
  });

  next();
});

app.get("/", (_req, res) => {
  res.json({ status: "ok", message: "Backend is running" });
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok", uptime: process.uptime().toFixed(2) });
});

app.post("/debug", (req, res) => {
  const { message } = req.body || {};

  console.log(`[${req.requestId}] Debug payload:`, { message });

  res.json({
    success: true,
    requestId: req.requestId,
    received: message || null,
  });
});

app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  console.error(`[${req.requestId || "unknown"}] Unhandled error:`, err);

  res.status(err.status || 500).json({
    success: false,
    error: err.message || "Internal server error",
    requestId: req.requestId,
  });
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection:", reason);
});

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}

export { app };
