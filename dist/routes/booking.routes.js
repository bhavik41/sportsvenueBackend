"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const booking_controller_1 = require("../controllers/booking.controller");
const router = (0, express_1.Router)();
// Create a new booking
router.post("/", auth_1.authenticate, booking_controller_1.createBooking);
// Get all bookings for a user
router.get("/user", auth_1.authenticate, booking_controller_1.getBookings);
router.get("/admin", auth_1.authenticate, booking_controller_1.getBookingDetails);
// Update booking status (for admin)
router.patch("/:id/status", auth_1.authenticate, booking_controller_1.updateBookingStatus);
// Cancel booking
router.patch("/:id/cancel", auth_1.authenticate, booking_controller_1.cancelBooking);
exports.default = router;
