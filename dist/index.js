"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const morgan_1 = __importDefault(require("morgan"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const UserRoutes_1 = __importDefault(require("./routes/UserRoutes"));
const cloudinary_1 = __importDefault(require("cloudinary"));
const GroundRoutes_1 = __importDefault(require("./routes/admin/GroundRoutes"));
const GroundRoutes_2 = __importDefault(require("./routes/user/GroundRoutes"));
const app = (0, express_1.default)();
dotenv_1.default.config();
const PORT = process.env.PORT || 3000;
app.use((0, morgan_1.default)("dev"));
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
cloudinary_1.default.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
const booking_routes_1 = __importDefault(require("./routes/booking.routes"));
app.use("/auth", UserRoutes_1.default);
app.use("/admin/grounds", GroundRoutes_1.default);
app.use("/user/grounds", GroundRoutes_2.default);
app.use("/bookings", booking_routes_1.default);
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
app.use(express_1.default.urlencoded({ extended: true }));
