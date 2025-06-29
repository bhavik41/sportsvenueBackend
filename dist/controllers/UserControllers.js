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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserProfile = exports.signIn = exports.signUp = void 0;
const Prisma_1 = __importDefault(require("../util/Prisma"));
const jwt_1 = require("../util/jwt");
const bcypt_1 = require("../util/bcypt");
const signUp = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(req.body);
    try {
        const { name, email, password, role } = req.body;
        if (!name || !email || !password || !role) {
            return res.status(400).json({ message: "All fields are required" });
        }
        const hashedPassword = yield (0, bcypt_1.hashPassword)(password);
        const user = yield Prisma_1.default.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role,
            },
        });
        return res.status(201).json({ message: "User created successfully", user });
    }
    catch (_a) {
        return res.status(500).json({ message: "Internal server error" });
    }
});
exports.signUp = signUp;
const signIn = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(req.body);
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }
        const user = yield Prisma_1.default.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(402).json({ message: "Invalid email or password" });
        }
        const isValidPassword = yield (0, bcypt_1.comparePassword)(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ message: "Invalid email or password" });
        }
        const token = (0, jwt_1.generateToken)(user.id, user.role);
        // Exclude password from user details
        const { password: _ } = user, userWithoutPassword = __rest(user, ["password"]);
        return res.status(200).json({
            message: "User signed in successfully",
            token,
            user: userWithoutPassword,
        });
    }
    catch (_a) {
        return res.status(500).json({ message: "Internal server error" });
    }
});
exports.signIn = signIn;
const getUserProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.userId;
        const user = yield Prisma_1.default.user.findUnique({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        const { password: _ } = user, userWithoutPassword = __rest(user, ["password"]);
        return res.status(200).json({ user: userWithoutPassword });
    }
    catch (error) {
        console.error("Error fetching user profile:", error);
        return res.status(500).json({ error: "Failed to fetch user profile" });
    }
});
exports.getUserProfile = getUserProfile;
