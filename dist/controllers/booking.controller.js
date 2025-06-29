"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cancelBooking = exports.updateBookingStatus = exports.getBookingDetails = exports.getBookings = exports.createBooking = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Create a new booking
const createBooking = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { groundId, timeSlotId, date, totalAmount } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        // Check if the time slot is available
        const timeSlot = yield prisma.timeSlot.findUnique({
            where: { id: timeSlotId },
            include: { bookings: true },
        });
        if (!timeSlot || !timeSlot.isAvailable) {
            return res.status(400).json({ message: "Time slot is not available" });
        }
        // Check for existing bookings on the same date and time slot
        const existingBooking = yield prisma.booking.findFirst({
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
        const booking = yield prisma.booking.create({
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
    }
    catch (error) {
        console.error("Error creating booking:", error);
        res.status(500).json({ message: "Error creating booking" });
    }
});
exports.createBooking = createBooking;
// Get all bookings for a user
const getBookings = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        console.log(userId);
        const bookings = yield prisma.booking.findMany({
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
    }
    catch (error) {
        console.error("Error fetching bookings:", error);
        res.status(500).json({ message: "Error fetching bookings" });
    }
});
exports.getBookings = getBookings;
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
const getBookingDetails = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.params;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        // Find the booking and verify admin owns the ground
        const bookings = yield prisma.booking.findMany({
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
    }
    catch (error) {
        console.error("Error fetching booking details:", error);
        res.status(500).json({ message: "Error fetching booking details" });
    }
});
exports.getBookingDetails = getBookingDetails;
// Update booking status (for admin)
const updateBookingStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const booking = yield prisma.booking.update({
            where: { id },
            data: { status },
        });
        res.json(booking);
    }
    catch (error) {
        console.error("Error updating booking status:", error);
        res.status(500).json({ message: "Error updating booking status" });
    }
});
exports.updateBookingStatus = updateBookingStatus;
// Cancel booking
const cancelBooking = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.params;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const booking = yield prisma.booking.findUnique({
            where: { id },
        });
        if (!booking || booking.userId !== userId) {
            return res
                .status(403)
                .json({ message: "Not authorized to cancel this booking" });
        }
        const updatedBooking = yield prisma.booking.update({
            where: { id },
            data: { status: "cancelled" },
        });
        res.json(updatedBooking);
    }
    catch (error) {
        console.error("Error canceling booking:", error);
        res.status(500).json({ message: "Error canceling booking" });
    }
});
exports.cancelBooking = cancelBooking;
