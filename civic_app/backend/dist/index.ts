// backend/src/index.ts
import dotenv from "dotenv";
import { connectDB } from "./config/database";
import app from "./app";

dotenv.config();

const PORT = process.env.PORT || 4000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on port : ${PORT}`);
    });
  })
  .catch((err) => {
    console.warn("DB connect rejected (continuing without DB):", err);
    app.listen(PORT, () => {
      console.log(`Server is running on port : ${PORT} (no DB)`);
    });
  });
