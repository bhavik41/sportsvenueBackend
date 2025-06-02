import express from "express";
import morgan from "morgan";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import UserRoutes from "./routes/UserRoutes";
import cloudinary from "cloudinary";
import adminGroundRoutes from "./routes/admin/GroundRoutes";
import userGroundRoutes from "./routes/user/GroundRoutes";

const app = express();

dotenv.config();

const PORT = process.env.PORT || 3000;

app.use(morgan("dev"));
app.use(cors());
app.use(express.json());
app.use(cookieParser());

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

app.use("/auth", UserRoutes);
app.use("/admin/grounds", adminGroundRoutes);
app.use("/user/grounds", userGroundRoutes);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

app.use(express.urlencoded({ extended: true }));
