import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import cloudinary from "cloudinary";

const prisma = new PrismaClient();

interface AuthenticatedRequest extends Request {
  user?: any;
}

// Helper function to upload images to Cloudinary
async function uploadImages(files: Express.Multer.File[]) {
  const uploadPromises = files.map((file) =>
    cloudinary.v2.uploader.upload(file.path, { folder: "grounds" })
  );

  const results = await Promise.all(uploadPromises);
  return results.map((result) => result.secure_url);
}

export const createGround = async (req: Request, res: Response) => {
  try {
    const groundData = JSON.parse(req.body.groundData);
    const images = req.files as Express.Multer.File[];

    // Upload images to Cloudinary
    const imageUrls = await uploadImages(images);
    console.log(imageUrls);

    const ground = await prisma.ground.create({
      data: {
        ...groundData,
        images: imageUrls,
        slots: {
          create: groundData.slots.map((slot: any) => ({
            startTime: slot.startTime,
            endTime: slot.endTime,
            price: slot.price,
            isAvailable: slot.isAvailable,
            days: slot.days,
          })),
        },
        offers: {
          create: groundData.offers.map((offer: any) => ({
            title: offer.title,
            description: offer.description,
            discountType: offer.discountType,
            discountValue: offer.discountValue,
            validFrom: new Date(offer.validFrom),
            validTo: new Date(offer.validTo),
            isActive: offer.isActive,
            applicableSlots: offer.applicableSlots,
          })),
        },
      },
      include: {
        slots: true,
        offers: true,
      },
    });
    console.log("Ground", ground);

    res.status(201).json(ground);
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const updateGround = async (req: Request, res: Response) => {
  try {
    const groundData = JSON.parse(req.body.groundData);
    console.log(groundData);
    const images = req.files as Express.Multer.File[];

    // Upload new images to Cloudinary
    const imageUrls = await uploadImages(images);
    const allImages = [...(groundData.images || []), ...imageUrls];

    // Step 1: Update ground basic data
    const updatedGround = await prisma.ground.update({
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
      const existingSlot = await prisma.timeSlot.findUnique({
        where: { id: slot.id },
      });

      if (existingSlot) {
        // Update existing slot
        await prisma.timeSlot.update({
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
      } else {
        // Create new slot
        await prisma.timeSlot.create({
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
      const existingOffer = await prisma.offer.findUnique({
        where: { id: offer.id },
      });
      if (existingOffer) {
        // Update existing offer
        await prisma.offer.update({
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
      } else {
        // Create new offer
        await prisma.offer.create({
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
    const finalGround = await prisma.ground.findUnique({
      where: { id: req.params.id },
      include: {
        slots: true,
        offers: true,
        admin: true,
      },
    });

    res.json(finalGround);
  } catch (error) {
    console.error("Error updating ground:", error);
    res.status(400).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getAllGrounds = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<any> => {
  try {
    const { search, type, city } = req.query;
    const userId = req.user.userId;

    // Ensure query params are strings
    const searchStr = Array.isArray(search)
      ? search[0]
      : (search as string | undefined);
    const cityStr = Array.isArray(city)
      ? city[0]
      : (city as string | undefined);

    const where: any = {
      adminId: userId,
      ...(searchStr && {
        OR: [
          { name: { contains: searchStr, mode: "insensitive" } },
          { location: { contains: searchStr, mode: "insensitive" } },
        ],
      }),
      ...(typeof type === "string" && { groundType: type.toUpperCase() }),
      ...(cityStr && { location: { contains: cityStr, mode: "insensitive" } }),
    };

    const grounds = await prisma.ground.findMany({
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
  } catch (error) {
    console.error("Fetch grounds error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

export const getAllGroundsByAdminId = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<any> => {
  // try {
  const { search, type, city } = req.query;
  const userId = req.user.userId;

  // Ensure query params are strings
  const searchStr = Array.isArray(search)
    ? search[0]
    : (search as string | undefined);
  const cityStr = Array.isArray(city) ? city[0] : (city as string | undefined);

  const where: any = {
    adminId: userId,
    ...(searchStr && {
      OR: [
        { name: { contains: searchStr, mode: "insensitive" } },
        { location: { contains: searchStr, mode: "insensitive" } },
      ],
    }),
    ...(typeof type === "string" && { groundType: type.toUpperCase() }),
    ...(cityStr && { location: { contains: cityStr, mode: "insensitive" } }),
  };

  const grounds = await prisma.ground.findMany({
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
};

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

export const deleteGround = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const ground = await prisma.ground.delete({
      where: { id: req.params.id },
    });

    const slots = await prisma.timeSlot.deleteMany({
      where: {
        groundId: req.params.id,
      },
    });

    res.status(200).json(ground);
  } catch (error) {
    console.error("Delete ground error:", error);
    res.status(500).json({ error: "Server error" });
  }
};
