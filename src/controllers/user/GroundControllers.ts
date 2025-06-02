import { GroundType } from "@prisma/client";
import { Request, Response } from "express";
import { describe } from "node:test";
import prisma from "../../util/Prisma";

interface AuthenticatedRequest extends Request {
  user?: any;
}

export const getAllGrounds = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<any> => {
  try {
    const skip = Math.max(0, Number(req.query.skip) || 0);
    const limit = Math.max(1, Number(req.query.limit) || 10);
    const totalGrounds = await prisma.ground.count();
    const grounds = await prisma.ground.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        groundType: true,
        basePrice: true,
        images: true,
      },
      skip,
      take: limit,
    });

    res.status(200).json({ grounds, totalGrounds });
  } catch {}
};

export const getGroundById = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<any> => {
  try {
    if (!req.params.id) {
      return res.status(400).json({ error: "Invalid ground ID" });
    }

    const ground = await prisma.ground.findUnique({
      where: { id: req.params.id },
      include: {
        slots: true,
        offers: true,
        _count: {
          select: {
            bookings: true,
          },
        },
      },
    });
    res.status(200).json(ground);
  } catch (error) {
    console.error("Fetch ground error:", error);
    res.status(500).json({ error: "Server error" });
  }
};
