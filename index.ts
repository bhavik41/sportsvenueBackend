import express from "express";
import morgan from "morgan";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
import UserRoutes from "./src/routes/UserRoutes";

const app = express();

dotenv.config();
const PORT = process.env.PORT || 3000;

app.use(morgan("dev"));
app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

app.get("/", async (req: any, res) => {
  await prisma.user.findMany();
  res.send("Hello TypeScript + Express!");
});

app.use("/auth", UserRoutes);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
