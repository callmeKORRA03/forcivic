import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import citizenRoutes from "./routes/citizen.routes";
import adminRoutes from "./routes/admin.routes";
import issueRoutes from "./routes/issue.routes";
import civicAuthRouter from "./routes/civicAuth.route";

const app = express();

const rawOrigins = process.env.CORS_ORIGIN || "http://localhost:5173";
const allowedOrigins = rawOrigins.split(",").map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg = `The CORS policy for this site does not allow access from the specified Origin.`;
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cookieParser());

// Civic route must come first
app.use("/api/v1", civicAuthRouter);

// existing routes
app.use("/api/v1", citizenRoutes);
app.use("/api/v1", adminRoutes);
app.use("/api/v1", issueRoutes);

// fallback and heartbeat
app.use("/api", (_req, res) => {
  res.status(404).json({ message: "API route not found" });
});
app.get("/", (_req, res) => {
  res.send("Civic Issue Reporter Backend is Running");
});

export default app;
