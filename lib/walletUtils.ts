import { generateMnemonic } from "bip39";
import { generateEthereumPublicKey, generateEthereumPrivateKey, generateSolanaPublicKey, generateSolanaPrivateKey } from "./generateKeys";

export interface Wallet {
	id: string;
	name: string;
	type: "ethereum" | "solana";
	publicKey: string;
	privateKey: string;
	mnemonic: string;
	createdAt: Date;
}

export const getAllWallets = (): Wallet[] => {
	if (typeof window === "undefined") return [];

	const wallets: Wallet[] = [];

	// Get all Ethereum wallets
	for (let i = 0; i < localStorage.length; i++) {
		const key = localStorage.key(i);
		if (key?.startsWith("eth_wallet_")) {
			try {
				const wallet = JSON.parse(localStorage.getItem(key) || "");
				wallets.push(wallet);
			} catch (e) {
				console.error("Error parsing wallet:", e);
			}
		}
	}

	// Get all Solana wallets
	for (let i = 0; i < localStorage.length; i++) {
		const key = localStorage.key(i);
		if (key?.startsWith("sol_wallet_")) {
			try {
				const wallet = JSON.parse(localStorage.getItem(key) || "");
				wallets.push(wallet);
			} catch (e) {
				console.error("Error parsing wallet:", e);
			}
		}
	}

	return wallets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const createNewWallet = (name: string, type: "ethereum" | "solana"): Wallet => {
	const mnemonic = generateMnemonic();
	const id = Math.random().toString(36).substring(2, 15);

	let publicKey: string;
	let privateKey: string;

	if (type === "ethereum") {
		publicKey = generateEthereumPublicKey(mnemonic);
		privateKey = generateEthereumPrivateKey(mnemonic);
	} else {
		publicKey = generateSolanaPublicKey(mnemonic);
		privateKey = generateSolanaPrivateKey(mnemonic);
	}

	const wallet: Wallet = {
		id,
		name,
		type,
		publicKey,
		privateKey,
		mnemonic,
		createdAt: new Date(),
	};

	// Store in localStorage
	const storageKey = type === "ethereum" ? `eth_wallet_${id}` : `sol_wallet_${id}`;
	localStorage.setItem(storageKey, JSON.stringify(wallet));

	return wallet;
};

export const deleteWallet = (walletId: string, type: "ethereum" | "solana"): void => {
	const storageKey = type === "ethereum" ? `eth_wallet_${walletId}` : `sol_wallet_${walletId}`;
	localStorage.removeItem(storageKey);
};

export const importWallet = (name: string, type: "ethereum" | "solana", mnemonic: string): Wallet => {
	const id = Math.random().toString(36).substring(2, 15);

	let publicKey: string;
	let privateKey: string;

	if (type === "ethereum") {
		publicKey = generateEthereumPublicKey(mnemonic);
		privateKey = generateEthereumPrivateKey(mnemonic);
	} else {
		publicKey = generateSolanaPublicKey(mnemonic);
		privateKey = generateSolanaPrivateKey(mnemonic);
	}

	const wallet: Wallet = {
		id,
		name,
		type,
		publicKey,
		privateKey,
		mnemonic,
		createdAt: new Date(),
	};

	// Store in localStorage
	const storageKey = type === "ethereum" ? `eth_wallet_${id}` : `sol_wallet_${id}`;
	localStorage.setItem(storageKey, JSON.stringify(wallet));

	return wallet;
};

// Message signing functions (placeholder - these would need actual crypto implementation)
export const signMessage = (message: string, privateKey: string): string => {
	// This is a placeholder. In a real implementation, you'd use proper crypto libraries
	// For Ethereum: ethers.js or web3.js
	// For Solana: @solana/web3.js
	return `signed_${message}_with_${privateKey.substring(0, 10)}`;
};

export const verifySignature = (message: string, signature: string, publicKey: string): boolean => {
	// This is a placeholder. In a real implementation, you'd verify the signature
	// using the appropriate crypto library for the blockchain
	return signature.includes(message) && signature.includes(publicKey.substring(0, 10));
};
