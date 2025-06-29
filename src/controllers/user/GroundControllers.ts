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
    const searchTerm = req.query.searchTerm || "";
    const groundType = req.query.groundType || "";
    const priceRange = req.query.priceRange || "all";

    // Define a base query
    let query: any = {
      skip,
      take: limit,
      where: {},
    };

    // Add search term to the query
    if (searchTerm) {
      query.where.OR = [
        { name: { contains: searchTerm, mode: "insensitive" } },
        { location: { city: { contains: searchTerm, mode: "insensitive" } } },
      ];
    }

    // Add ground type filter to the query
    if (groundType && groundType !== "all") {
      query.where.groundType = groundType;
    }

    // Add price range filter to the query
    if (priceRange !== "all") {
      const [minPrice, maxPrice] = (
        typeof priceRange === "string" ? priceRange : String(priceRange)
      )
        .split("-")
        .map(Number);
      query.where.basePrice = {
        gte: minPrice,
        lte: maxPrice,
      };
    }

    const totalGrounds = await prisma.ground.count({ where: query.where });
    const grounds = await prisma.ground.findMany({
      ...query,
      select: {
        id: true,
        name: true,
        description: true,
        groundType: true,
        basePrice: true,
        images: true,
        location: true,
        amenities: true,
        isActive: true,
        offers: true,
      },
    });

    res.status(200).json({ grounds, totalGrounds });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch grounds" });
  }
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
        bookings: {
          where: {
            status: { notIn: ["cancelled"] },
          },
          select: {
            id: true,
            timeSlotId: true,
            date: true,
            status: true,
          },
        },
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

export const getBookings = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<any> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    console.log(userId);

    const bookings = await prisma.booking.findMany({
      where: { userId: userId },
      include: {
        ground: {
          select: {
            name: true,
            location: true,
            groundType: true,
          },
        },
        timeSlot: {
          select: {
            startTime: true,
            endTime: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    console.log(bookings);

    res.json(bookings);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ message: "Error fetching bookings" });
  }
};
