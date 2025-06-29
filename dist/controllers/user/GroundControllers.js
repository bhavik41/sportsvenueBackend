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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBookings = exports.getGroundById = exports.getAllGrounds = void 0;
const Prisma_1 = __importDefault(require("../../util/Prisma"));
const getAllGrounds = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const skip = Math.max(0, Number(req.query.skip) || 0);
        const limit = Math.max(1, Number(req.query.limit) || 10);
        const searchTerm = req.query.searchTerm || "";
        const groundType = req.query.groundType || "";
        const priceRange = req.query.priceRange || "all";
        // Define a base query
        let query = {
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
            const [minPrice, maxPrice] = (typeof priceRange === "string" ? priceRange : String(priceRange))
                .split("-")
                .map(Number);
            query.where.basePrice = {
                gte: minPrice,
                lte: maxPrice,
            };
        }
        const totalGrounds = yield Prisma_1.default.ground.count({ where: query.where });
        const grounds = yield Prisma_1.default.ground.findMany(Object.assign(Object.assign({}, query), { select: {
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
            } }));
        res.status(200).json({ grounds, totalGrounds });
    }
    catch (error) {
        res.status(500).json({ error: "Failed to fetch grounds" });
    }
});
exports.getAllGrounds = getAllGrounds;
const getGroundById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.params.id) {
            return res.status(400).json({ error: "Invalid ground ID" });
        }
        const ground = yield Prisma_1.default.ground.findUnique({
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
    }
    catch (error) {
        console.error("Fetch ground error:", error);
        res.status(500).json({ error: "Server error" });
    }
});
exports.getGroundById = getGroundById;
const getBookings = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        console.log(userId);
        const bookings = yield Prisma_1.default.booking.findMany({
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
