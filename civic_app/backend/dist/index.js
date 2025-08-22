"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// backend/src/index.ts
const dotenv_1 = __importDefault(require("dotenv"));
const database_1 = require("./config/database");
const app_1 = __importDefault(require("./app"));
dotenv_1.default.config();
const PORT = process.env.PORT || 4000;
(0, database_1.connectDB)()
    .then(() => {
    app_1.default.listen(PORT, () => {
        console.log(`Server is running on port : ${PORT}`);
    });
})
    .catch((err) => {
    console.warn("DB connect rejected (continuing without DB):", err);
    app_1.default.listen(PORT, () => {
        console.log(`Server is running on port : ${PORT} (no DB)`);
    });
});
