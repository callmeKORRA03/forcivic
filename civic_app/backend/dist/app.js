"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const citizen_routes_1 = __importDefault(require("./routes/citizen.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const issue_routes_1 = __importDefault(require("./routes/issue.routes"));
const civicAuth_route_1 = __importDefault(require("./routes/civicAuth.route"));
const app = (0, express_1.default)();
const rawOrigins = process.env.CORS_ORIGIN || "http://localhost:5173";
const allowedOrigins = rawOrigins.split(",").map((o) => o.trim());
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = `The CORS policy for this site does not allow access from the specified Origin.`;
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true,
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use(express_1.default.static("public"));
app.use((0, cookie_parser_1.default)());
// Civic route must come first
app.use("/api/v1", civicAuth_route_1.default);
// existing routes
app.use("/api/v1", citizen_routes_1.default);
app.use("/api/v1", admin_routes_1.default);
app.use("/api/v1", issue_routes_1.default);
// fallback and heartbeat
app.use("/api", (_req, res) => {
    res.status(404).json({ message: "API route not found" });
});
app.get("/", (_req, res) => {
    res.send("Civic Issue Reporter Backend is Running");
});
exports.default = app;
