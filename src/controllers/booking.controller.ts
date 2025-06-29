import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface AuthRequest extends Request {
  user?: any;
}

// Create a new booking
export const createBooking = async (
  req: AuthRequest,
  res: Response
): Promise<any> => {
  try {
    const { groundId, timeSlotId, date, totalAmount } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Check if the time slot is available
    const timeSlot = await prisma.timeSlot.findUnique({
      where: { id: timeSlotId },
      include: { bookings: true },
    });

    if (!timeSlot || !timeSlot.isAvailable) {
      return res.status(400).json({ message: "Time slot is not available" });
    }

    // Check for existing bookings on the same date and time slot
    const existingBooking = await prisma.booking.findFirst({
      where: {
        timeSlotId,
        date: new Date(date),
        status: { not: "cancelled" },
      },
    });

    if (existingBooking) {
      return res.status(400).json({
        message: "This time slot is already booked for the selected date",
      });
    }

    // Create the booking
    const booking = await prisma.booking.create({
      data: {
        userId,
        groundId,
        timeSlotId,
        date: new Date(date),
        totalAmount,
        status: "pending",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.status(201).json(booking);
  } catch (error) {
    console.error("Error creating booking:", error);
    res.status(500).json({ message: "Error creating booking" });
  }
};

// Get all bookings for a user
export const getBookings = async (
  req: AuthRequest,
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

// Get all bookings for grounds owned by the current admin
// export const getBookingsForGroundOwner = async (
//   req: AuthRequest,
//   res: Response
// ): Promise<any> => {
//   try {
//     const userId = req.user?.userId;
//     if (!userId) {
//       return res.status(401).json({ message: "Unauthorized" });
//     }

//     // Find all ground IDs owned by this admin
//     const grounds = await prisma.ground.findMany({
//       where: { adminId: userId },
//       select: { id: true },
//     });
//     const groundIds = grounds.map((g) => g.id);

//     // Get all bookings for these grounds
//     const bookings = await prisma.booking.findMany({
//       where: { groundId: { in: groundIds } },
//       include: {
//         ground: true,
//         timeSlot: true,
//         // user: true, // Removed because 'user' is not a valid relation
//       },
//       orderBy: { createdAt: "desc" },
//     });

//     res.json(bookings);
//   } catch (error) {
//     console.error("Error fetching owner bookings:", error);
//     res.status(500).json({ message: "Error fetching bookings" });
//   }
// };

export const getBookingDetails = async (
  req: AuthRequest,
  res: Response
): Promise<any> => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Find the booking and verify admin owns the ground
    const bookings = await prisma.booking.findMany({
      where: {
        id,
        ground: {
          adminId: userId,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        ground: {
          include: {
            admin: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        timeSlot: {
          select: {
            price: true,
            endTime: true,
            startTime: true,
            groundId: true,
            id: true,
          },
        },
      },
    });

    console.log(bookings);

    if (!bookings) {
      return res.status(404).json({
        message: "Booking not found or you don't have permission to view it",
      });
    }

    res.json(bookings);
  } catch (error) {
    console.error("Error fetching booking details:", error);
    res.status(500).json({ message: "Error fetching booking details" });
  }
};

// Update booking status (for admin)
export const updateBookingStatus = async (
  req: AuthRequest,
  res: Response
): Promise<any> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const booking = await prisma.booking.update({
      where: { id },
      data: { status },
    });

    res.json(booking);
  } catch (error) {
    console.error("Error updating booking status:", error);
    res.status(500).json({ message: "Error updating booking status" });
  }
};

// Cancel booking
export const cancelBooking = async (
  req: AuthRequest,
  res: Response
): Promise<any> => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
    });

    if (!booking || booking.userId !== userId) {
      return res
        .status(403)
        .json({ message: "Not authorized to cancel this booking" });
    }

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: { status: "cancelled" },
    });

    res.json(updatedBooking);
  } catch (error) {
    console.error("Error canceling booking:", error);
    res.status(500).json({ message: "Error canceling booking" });
  }
};
