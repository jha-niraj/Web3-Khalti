"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function getUserBySession(sessionId: string) {
    try {
        if (!sessionId) {
            return { error: "Session ID required" };
        }

        const user = await prisma.user.findUnique({
            where: { sessionId },
            include: {
                wallets: {
                    orderBy: { createdAt: "desc" },
                },
            },
        });

        if (!user) {
            return { error: "User not found" };
        }

        return { user };
    } catch (error) {
        console.error("Error finding user session:", error);
        return { error: "Internal server error" };
    }
}

export async function createUser(sessionId: string, masterSeed: string, password: string) {
    try {
        if (!sessionId || !masterSeed || !password) {
            return { error: "Session ID, master seed, and password required" };
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { sessionId },
        });

        if (existingUser) {
            return { error: "User already exists" };
        }

        // Hash the password
        const saltRounds = 12;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        const user = await prisma.user.create({
            data: {
                sessionId,
                masterSeed,
                passwordHash,
            },
        });

        return { user };
    } catch (error) {
        console.error("Error creating user:", error);
        return { error: "Internal server error" };
    }
}

export async function loginUser(sessionId: string, password: string) {
    try {
        if (!sessionId || !password) {
            return { error: "Session ID and password required" };
        }

        const user = await prisma.user.findUnique({
            where: { sessionId },
            include: {
                wallets: {
                    orderBy: { createdAt: "desc" },
                },
            },
        });

        if (!user) {
            return { error: "User not found" };
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            return { error: "Invalid password" };
        }

        return { user };
    } catch (error) {
        console.error("Error logging in user:", error);
        return { error: "Internal server error" };
    }
}

export async function verifySeedPhrase(sessionId: string, seedPhrase: string) {
    try {
        if (!sessionId || !seedPhrase) {
            return { error: "Session ID and seed phrase required" };
        }

        const user = await prisma.user.findUnique({
            where: { sessionId },
        });

        if (!user) {
            return { error: "User not found" };
        }

        const isValid = user.masterSeed === seedPhrase;

        return { valid: isValid };
    } catch (error) {
        console.error("Error verifying seed phrase:", error);
        return { error: "Internal server error" };
    }
}

export async function resetPassword(sessionId: string, newPassword: string, seedWords: string[]) {
    try {
        if (!sessionId || !newPassword || !seedWords || seedWords.length < 3) {
            return { error: "Session ID, new password, and seed words required" };
        }

        const user = await prisma.user.findUnique({
            where: { sessionId },
        });

        if (!user) {
            return { error: "User not found" };
        }

        // Verify the seed words (4th, 6th, 8th positions - indices 3, 5, 7)
        const userSeedWords = user.masterSeed.split(" ");
        if (
            userSeedWords[3] !== seedWords[0] ||
            userSeedWords[5] !== seedWords[1] ||
            userSeedWords[7] !== seedWords[2]
        ) {
            return { error: "Invalid seed words" };
        }

        // Hash the new password
        const saltRounds = 12;
        const passwordHash = await bcrypt.hash(newPassword, saltRounds);

        // Update the password
        await prisma.user.update({
            where: { sessionId },
            data: { passwordHash },
        });

        return { success: true };
    } catch (error) {
        console.error("Error resetting password:", error);
        return { error: "Internal server error" };
    }
}
