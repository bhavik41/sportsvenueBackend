import { Router } from "express";
import { authenticate } from "../middleware/auth";
import {
  createBooking,
  getBookings,
  updateBookingStatus,
  cancelBooking,
  getBookingDetails,
} from "../controllers/booking.controller";

const router = Router();

// Create a new booking
router.post("/", authenticate, createBooking);

// Get all bookings for a user
router.get("/user", authenticate, getBookings);

router.get("/admin", authenticate, getBookingDetails);

// Update booking status (for admin)
router.patch("/:id/status", authenticate, updateBookingStatus);

// Cancel booking
router.patch("/:id/cancel", authenticate, cancelBooking);

export default router;
