"use server";

import { prisma } from "@/lib/prisma";
import { deriveSolanaFromMnemonic, deriveEthereumFromMnemonic } from "@/lib/keys";

export async function createWallet(sessionId: string, name: string, type: "ETHEREUM" | "SOLANA") {
	try {
		if (!sessionId || !name || !type) {
			return { error: "Missing required fields" };
		}

		// Find user
		const user = await prisma.user.findUnique({
			where: { sessionId },
			include: { wallets: true },
		});

		if (!user) {
			return { error: "User not found" };
		}

		// Generate wallet keys from master seed
		const walletIndex = user.wallets.length;
		const derivationPath = `m/44'/${type === "ETHEREUM" ? "60" : "501"}'/${walletIndex}'/0/0`;

		let publicKey: string;
		let privateKey: string;

		if (type === "ETHEREUM") {
			const ethWallet = deriveEthereumFromMnemonic(user.masterSeed, derivationPath);
			publicKey = ethWallet.address; // Use the Ethereum address as the public key
			privateKey = ethWallet.privateKeyHex0x; // 0x-prefixed private key
		} else {
			const solWallet = await deriveSolanaFromMnemonic(user.masterSeed, derivationPath);
			publicKey = solWallet.publicKeyBase58; // Base58 encoded public key
			privateKey = solWallet.privateKeyHex; // Hex encoded private key
		}

		// Create wallet
		const wallet = await prisma.wallet.create({
			data: {
				name,
				type,
				publicKey,
				privateKey,
				derivationPath,
				userId: user.id,
			},
		});

		return { wallet };
	} catch (error) {
		console.error("Error creating wallet:", error);
		return { error: "Internal server error" };
	}
}

export async function getUserWallets(sessionId: string) {
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

		return { wallets: user.wallets };
	} catch (error) {
		console.error("Error fetching wallets:", error);
		return { error: "Internal server error" };
	}
}

export async function deleteWallet(sessionId: string, walletId: string) {
	try {
		if (!sessionId || !walletId) {
			return { error: "Session ID and wallet ID required" };
		}

		// Find user
		const user = await prisma.user.findUnique({
			where: { sessionId },
		});

		if (!user) {
			return { error: "User not found" };
		}

		// Delete wallet (ensure it belongs to the user)
		await prisma.wallet.deleteMany({
			where: {
				id: walletId,
				userId: user.id,
			},
		});

		return { success: true };
	} catch (error) {
		console.error("Error deleting wallet:", error);
		return { error: "Internal server error" };
	}
}