import express, { Request, Response } from "express";
import Prisma from "../util/Prisma";

import { verifyToken, generateToken } from "../util/jwt";
import { comparePassword, hashPassword } from "../util/bcypt";

interface AuthenticatedRequest extends Request {
  user?: any;
}

export const signUp = async (req: Request, res: Response): Promise<any> => {
  console.log(req.body);
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const hashedPassword = await hashPassword(password);

    const user = await Prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
      },
    });

    return res.status(201).json({ message: "User created successfully", user });
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const signIn = async (req: Request, res: Response): Promise<any> => {
  console.log(req.body);
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const user = await Prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(402).json({ message: "Invalid email or password" });
    }

    const isValidPassword = await comparePassword(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = generateToken(user.id, user.role);

    // Exclude password from user details
    const { password: _, ...userWithoutPassword } = user;

    return res.status(200).json({
      message: "User signed in successfully",
      token,
      user: userWithoutPassword,
    });
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getUserProfile = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<any> => {
  try {
    const userId = req.user.userId;
    const user = await Prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const { password: _, ...userWithoutPassword } = user;

    return res.status(200).json({ user: userWithoutPassword });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return res.status(500).json({ error: "Failed to fetch user profile" });
  }
};
