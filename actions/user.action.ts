"use server";

import { prisma } from "@/lib/prisma";

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

export async function createUser(sessionId: string, masterSeed: string) {
	try {
		if (!sessionId || !masterSeed) {
			return { error: "Session ID and master seed required" };
		}

		// Check if user already exists
		const existingUser = await prisma.user.findUnique({
			where: { sessionId },
		});

		if (existingUser) {
			return { error: "User already exists" };
		}

		const user = await prisma.user.create({
			data: {
				sessionId,
				masterSeed,
			},
		});

		return { user };
	} catch (error) {
		console.error("Error creating user:", error);
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
