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
exports.deleteGround = exports.getAllGroundsByAdminId = exports.getAllGrounds = exports.updateGround = exports.createGround = void 0;
const client_1 = require("@prisma/client");
const cloudinary_1 = __importDefault(require("cloudinary"));
const prisma = new client_1.PrismaClient();
// Helper function to upload images to Cloudinary
function uploadImages(files) {
    return __awaiter(this, void 0, void 0, function* () {
        const uploadPromises = files.map((file) => cloudinary_1.default.v2.uploader.upload(file.path, { folder: "grounds" }));
        const results = yield Promise.all(uploadPromises);
        return results.map((result) => result.secure_url);
    });
}
const createGround = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const groundData = JSON.parse(req.body.groundData);
        const images = req.files;
        // Upload images to Cloudinary
        const imageUrls = yield uploadImages(images);
        console.log(imageUrls);
        const ground = yield prisma.ground.create({
            data: Object.assign(Object.assign({}, groundData), { images: imageUrls, slots: {
                    create: groundData.slots.map((slot) => ({
                        startTime: slot.startTime,
                        endTime: slot.endTime,
                        price: slot.price,
                        isAvailable: slot.isAvailable,
                        days: slot.days,
                    })),
                }, offers: {
                    create: groundData.offers.map((offer) => ({
                        title: offer.title,
                        description: offer.description,
                        discountType: offer.discountType,
                        discountValue: offer.discountValue,
                        validFrom: new Date(offer.validFrom),
                        validTo: new Date(offer.validTo),
                        isActive: offer.isActive,
                        applicableSlots: offer.applicableSlots,
                    })),
                } }),
            include: {
                slots: true,
                offers: true,
            },
        });
        console.log("Ground", ground);
        res.status(201).json(ground);
    }
    catch (error) {
        res.status(400).json({
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.createGround = createGround;
const updateGround = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const groundData = JSON.parse(req.body.groundData);
        console.log(groundData);
        const images = req.files;
        // Upload new images to Cloudinary
        const imageUrls = yield uploadImages(images);
        const allImages = [...(groundData.images || []), ...imageUrls];
        // Step 1: Update ground basic data
        const updatedGround = yield prisma.ground.update({
            where: { id: req.params.id },
            data: {
                name: groundData.name,
                description: groundData.description,
                location: groundData.location,
                groundType: groundData.groundType,
                amenities: groundData.amenities,
                basePrice: groundData.basePrice,
                isActive: groundData.isActive,
                images: allImages,
                admin: {
                    connect: { id: groundData.adminId },
                },
            },
        });
        // Step 2: Update or create time slots
        for (const slot of groundData.slots) {
            const existingSlot = yield prisma.timeSlot.findUnique({
                where: { id: slot.id },
            });
            if (existingSlot) {
                // Update existing slot
                yield prisma.timeSlot.update({
                    where: { id: slot.id },
                    data: {
                        startTime: slot.startTime,
                        endTime: slot.endTime,
                        price: slot.price,
                        isAvailable: slot.isAvailable,
                        days: slot.days,
                        groundId: updatedGround.id,
                    },
                });
            }
            else {
                // Create new slot
                yield prisma.timeSlot.create({
                    data: {
                        startTime: slot.startTime,
                        endTime: slot.endTime,
                        price: slot.price,
                        isAvailable: slot.isAvailable,
                        days: slot.days,
                        groundId: updatedGround.id,
                    },
                });
            }
        }
        // Step 3: Update or create offers
        for (const offer of groundData.offers) {
            const existingOffer = yield prisma.offer.findUnique({
                where: { id: offer.id },
            });
            if (existingOffer) {
                // Update existing offer
                yield prisma.offer.update({
                    where: { id: offer.id },
                    data: {
                        title: offer.title,
                        description: offer.description,
                        discountType: offer.discountType,
                        discountValue: offer.discountValue,
                        validFrom: new Date(offer.validFrom),
                        validTo: new Date(offer.validTo),
                        isActive: offer.isActive,
                        applicableSlots: offer.applicableSlots,
                        groundId: updatedGround.id,
                    },
                });
            }
            else {
                // Create new offer
                yield prisma.offer.create({
                    data: {
                        title: offer.title,
                        description: offer.description,
                        discountType: offer.discountType,
                        discountValue: offer.discountValue,
                        validFrom: new Date(offer.validFrom),
                        validTo: new Date(offer.validTo),
                        isActive: offer.isActive,
                        applicableSlots: offer.applicableSlots,
                        groundId: updatedGround.id,
                    },
                });
            }
        }
        // Step 4: Return updated ground with slots and offers
        const finalGround = yield prisma.ground.findUnique({
            where: { id: req.params.id },
            include: {
                slots: true,
                offers: true,
                admin: true,
            },
        });
        res.json(finalGround);
    }
    catch (error) {
        console.error("Error updating ground:", error);
        res.status(400).json({
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.updateGround = updateGround;
const getAllGrounds = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { search, type, city } = req.query;
        const userId = req.user.userId;
        // Ensure query params are strings
        const searchStr = Array.isArray(search)
            ? search[0]
            : search;
        const cityStr = Array.isArray(city)
            ? city[0]
            : city;
        const where = Object.assign(Object.assign(Object.assign({ adminId: userId }, (searchStr && {
            OR: [
                { name: { contains: searchStr, mode: "insensitive" } },
                { location: { contains: searchStr, mode: "insensitive" } },
            ],
        })), (typeof type === "string" && { groundType: type.toUpperCase() })), (cityStr && { location: { contains: cityStr, mode: "insensitive" } }));
        const grounds = yield prisma.ground.findMany({
            where,
            include: {
                slots: true,
                offers: true,
                _count: {
                    select: {
                        bookings: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });
        res.json(grounds);
    }
    catch (error) {
        console.error("Fetch grounds error:", error);
        res.status(500).json({ error: "Server error" });
    }
});
exports.getAllGrounds = getAllGrounds;
const getAllGroundsByAdminId = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // try {
    const { search, type, city } = req.query;
    const userId = req.user.userId;
    // Ensure query params are strings
    const searchStr = Array.isArray(search)
        ? search[0]
        : search;
    const cityStr = Array.isArray(city) ? city[0] : city;
    const where = Object.assign(Object.assign(Object.assign({ adminId: userId }, (searchStr && {
        OR: [
            { name: { contains: searchStr, mode: "insensitive" } },
            { location: { contains: searchStr, mode: "insensitive" } },
        ],
    })), (typeof type === "string" && { groundType: type.toUpperCase() })), (cityStr && { location: { contains: cityStr, mode: "insensitive" } }));
    const grounds = yield prisma.ground.findMany({
        where,
        include: {
            slots: true,
            offers: true,
            _count: {
                select: {
                    bookings: true,
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });
    res.json(grounds);
    // } catch (error) {
    //   console.error("Fetch grounds error:", error);
    //   res.status(500).json({ error: "Server error" });
    // }
});
exports.getAllGroundsByAdminId = getAllGroundsByAdminId;
// export const getGroundById = async (
//   req: AuthenticatedRequest,
//   res: Response
// ) => {
//   try {
//     const ground = await prisma.ground.findUnique({
//       where: { id: req.params.id },
//       include: {
//         slots: true,
//         offers: true,
//         _count: {
//           select: {
//             bookings: true,
//           },
//         },
//       },
//     });
//     res.json(ground);
//   } catch (error) {
//     console.error("Fetch ground error:", error);
//     res.status(500).json({ error: "Server error" });
//   }
//   if (!req.user) {
//     return res.status(401).json({ error: "Unauthorized" });
//   }
//   if (req.params.id == null) {
//     return res.status(400).json({ error: "Invalid ground ID" });
//   }
//   try {
//     const ground = await prisma.ground.findFirst({
//       where: {
//         id: req.params.id,
//         adminId: req.user.id,
//       },
//       include: {
//         slots: true,
//         offers: true,
//       },
//     });
//     if (!ground) {
//       return res.status(404).json({ error: "Ground not found" });
//     }
//     res.json(ground);
//   } catch (error) {
//     console.error("Fetch ground error:", error);
//     res.status(500).json({ error: "Server error" });
//   }
// };
const deleteGround = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const ground = yield prisma.ground.delete({
            where: { id: req.params.id },
        });
        const slots = yield prisma.timeSlot.deleteMany({
            where: {
                groundId: req.params.id,
            },
        });
        res.status(200).json(ground);
    }
    catch (error) {
        console.error("Delete ground error:", error);
        res.status(500).json({ error: "Server error" });
    }
});
exports.deleteGround = deleteGround;
