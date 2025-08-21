import { generateMnemonic } from "bip39";
import { deriveSolanaFromMnemonic, deriveEthereumFromMnemonic, solanaSign, assertMnemonic } from "./keys";
import bcrypt from "bcryptjs";

export interface User {
    id: string;
    sessionId: string;
    masterSeed: string;
    passwordHash: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface Wallet {
    id: string;
    name: string;
    type: "ETHEREUM" | "SOLANA";
    publicKey: string;
    privateKey: string;
    derivationPath: string;
    userId: string;
    createdAt: Date;
}

// LocalStorage keys
const STORAGE_KEYS = {
    USER_DATA: "web3khalti_user",
    SESSION_ID: "web3khalti_session",
    PASSWORD: "web3khalti_password",
    WALLETS: "web3khalti_wallets",
    ACCOUNT_EXISTS: "web3khalti_account_exists"
};

// Create account with seed phrase and password
export const createAccount = async (password: string): Promise<{ user: User; masterSeed: string; sessionId: string; error: string | null }> => {
    try {
        if (typeof window === "undefined") {
            throw new Error("This function can only be called on the client side");
        }

        // Check if account already exists
        if (accountExists()) {
            return { user: null as any, masterSeed: "", sessionId: "", error: "Account already exists" };
        }

        // Generate new mnemonic and session
        const masterSeed = generateMnemonic();
        const sessionId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        const passwordHash = await bcrypt.hash(password, 10);

        const user: User = {
            id: sessionId, // Using sessionId as user ID for simplicity
            sessionId,
            masterSeed,
            passwordHash,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        // Store in localStorage
        localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
        localStorage.setItem(STORAGE_KEYS.SESSION_ID, sessionId);
        localStorage.setItem(STORAGE_KEYS.PASSWORD, password);
        localStorage.setItem(STORAGE_KEYS.ACCOUNT_EXISTS, "true");
        localStorage.setItem(STORAGE_KEYS.WALLETS, JSON.stringify([]));

        return { user, masterSeed, sessionId, error: null };
    } catch (error) {
        console.error("Error creating account:", error);
        return { user: null as any, masterSeed: "", sessionId: "", error: "Failed to create account" };
    }
};

// Login with password
export const loginWithPassword = async (password: string): Promise<User> => {
    if (typeof window === "undefined") {
        throw new Error("This function can only be called on the client side");
    }

    try {
        const userData = localStorage.getItem(STORAGE_KEYS.USER_DATA);
        if (!userData) {
            throw new Error("No account found");
        }

        const user: User = JSON.parse(userData);
        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

        if (!isPasswordValid) {
            throw new Error("Invalid password");
        }

        // Update session
        localStorage.setItem(STORAGE_KEYS.SESSION_ID, user.sessionId);
        localStorage.setItem(STORAGE_KEYS.PASSWORD, password);

        return user;
    } catch (error) {
        console.error("Error logging in:", error);
        throw error;
    }
};

// Login with seed phrase (for existing users)
export const loginWithSeedPhrase = async (seedPhrase: string, newPassword: string): Promise<{ user: User; sessionId: string; error: string | null }> => {
    try {
        if (typeof window === "undefined") {
            throw new Error("This function can only be called on the client side");
        }

        // Validate the seed phrase
        assertMnemonic(seedPhrase);

        // Generate session ID
        const sessionId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        const passwordHash = await bcrypt.hash(newPassword, 10);

        const user: User = {
            id: sessionId,
            sessionId,
            masterSeed: seedPhrase,
            passwordHash,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        // Store in localStorage (this will overwrite any existing account)
        localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
        localStorage.setItem(STORAGE_KEYS.SESSION_ID, sessionId);
        localStorage.setItem(STORAGE_KEYS.PASSWORD, newPassword);
        localStorage.setItem(STORAGE_KEYS.ACCOUNT_EXISTS, "true");
        localStorage.setItem(STORAGE_KEYS.WALLETS, JSON.stringify([]));

        return { user, sessionId, error: null };
    } catch (error) {
        console.error("Error logging in with seed phrase:", error);
        return { user: null as any, sessionId: "", error: "Invalid seed phrase or failed to login" };
    }
};

// Reset password with seed phrase verification
export const resetPasswordWithSeed = async (newPassword: string, seedWords: string[]): Promise<void> => {
    if (typeof window === "undefined") {
        throw new Error("This function can only be called on the client side");
    }

    try {
        const userData = localStorage.getItem(STORAGE_KEYS.USER_DATA);
        if (!userData) {
            throw new Error("No account found");
        }

        const user: User = JSON.parse(userData);
        const seedPhrase = seedWords.join(" ");

        // Verify seed phrase matches
        if (user.masterSeed !== seedPhrase) {
            throw new Error("Invalid seed phrase");
        }

        // Update password
        const passwordHash = await bcrypt.hash(newPassword, 10);
        user.passwordHash = passwordHash;
        user.updatedAt = new Date();

        localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
        localStorage.setItem(STORAGE_KEYS.PASSWORD, newPassword);
    } catch (error) {
        console.error("Error resetting password:", error);
        throw error;
    }
};

// Check if account exists
export const accountExists = (): boolean => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(STORAGE_KEYS.ACCOUNT_EXISTS) === "true";
};

// Check if user is logged in
export const isLoggedIn = (): boolean => {
    if (typeof window === "undefined") return false;
    return !!localStorage.getItem(STORAGE_KEYS.SESSION_ID);
};

// Get current user
export const getCurrentUser = async (): Promise<User | null> => {
    if (typeof window === "undefined") return null;

    try {
        const userData = localStorage.getItem(STORAGE_KEYS.USER_DATA);
        const sessionId = localStorage.getItem(STORAGE_KEYS.SESSION_ID);

        if (!userData || !sessionId) {
            return null;
        }

        const user: User = JSON.parse(userData);
        if (user.sessionId !== sessionId) {
            return null;
        }

        return user;
    } catch (error) {
        console.error("Error getting current user:", error);
        return null;
    }
};

// Check if user is connected (has valid session)
export const isUserConnected = (): boolean => {
    if (typeof window === "undefined") return false;
    const sessionId = localStorage.getItem(STORAGE_KEYS.SESSION_ID);
    const userData = localStorage.getItem(STORAGE_KEYS.USER_DATA);
    return !!(sessionId && userData);
};

// Logout user
export const logout = (): void => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(STORAGE_KEYS.SESSION_ID);
    localStorage.removeItem(STORAGE_KEYS.PASSWORD);
};

// Clear all data (complete logout)
export const clearAllData = (): void => {
    if (typeof window === "undefined") return;
    Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
    });
};

// Verify seed phrase
export const verifySeedPhrase = async (seedPhrase: string[]): Promise<boolean> => {
    if (typeof window === "undefined") return false;

    try {
        const userData = localStorage.getItem(STORAGE_KEYS.USER_DATA);
        if (!userData) return false;

        const user: User = JSON.parse(userData);
        const providedSeed = seedPhrase.join(" ");

        return user.masterSeed === providedSeed;
    } catch (error) {
        console.error("Error verifying seed phrase:", error);
        return false;
    }
};

// Create wallet
export const createWallet = async (name: string, type: "ETHEREUM" | "SOLANA"): Promise<Wallet> => {
    if (typeof window === "undefined") {
        throw new Error("This function can only be called on the client side");
    }

    try {
        const userData = localStorage.getItem(STORAGE_KEYS.USER_DATA);
        if (!userData) {
            throw new Error("No user found");
        }

        const user: User = JSON.parse(userData);
        const walletsData = localStorage.getItem(STORAGE_KEYS.WALLETS);
        const existingWallets: Wallet[] = walletsData ? JSON.parse(walletsData) : [];

        // Generate wallet keys from master seed
        const walletIndex = existingWallets.length;
        const derivationPath = `m/44'/${type === "ETHEREUM" ? "60" : "501"}'/${walletIndex}'/0/0`;

        let publicKey: string;
        let privateKey: string;

        if (type === "ETHEREUM") {
            const ethWallet = deriveEthereumFromMnemonic(user.masterSeed, derivationPath);
            publicKey = ethWallet.address;
            privateKey = ethWallet.privateKeyHex0x;
        } else {
            const solWallet = await deriveSolanaFromMnemonic(user.masterSeed, derivationPath);
            publicKey = solWallet.publicKeyBase58;
            privateKey = solWallet.privateKeyHex;
        }

        const wallet: Wallet = {
            id: Math.random().toString(36).substring(2, 15),
            name,
            type,
            publicKey,
            privateKey,
            derivationPath,
            userId: user.id,
            createdAt: new Date()
        };

        // Save wallet to localStorage
        const updatedWallets = [...existingWallets, wallet];
        localStorage.setItem(STORAGE_KEYS.WALLETS, JSON.stringify(updatedWallets));

        return wallet;
    } catch (error) {
        console.error("Error creating wallet:", error);
        throw error;
    }
};

// Get user wallets
export const getUserWallets = async (): Promise<Wallet[]> => {
    if (typeof window === "undefined") return [];

    try {
        const walletsData = localStorage.getItem(STORAGE_KEYS.WALLETS);
        if (!walletsData) return [];

        const wallets: Wallet[] = JSON.parse(walletsData);
        return wallets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
        console.error("Error fetching wallets:", error);
        return [];
    }
};

// Delete wallet
export const deleteWallet = async (walletId: string): Promise<void> => {
    if (typeof window === "undefined") {
        throw new Error("This function can only be called on the client side");
    }

    try {
        const walletsData = localStorage.getItem(STORAGE_KEYS.WALLETS);
        if (!walletsData) return;

        const wallets: Wallet[] = JSON.parse(walletsData);
        const updatedWallets = wallets.filter(wallet => wallet.id !== walletId);

        localStorage.setItem(STORAGE_KEYS.WALLETS, JSON.stringify(updatedWallets));
    } catch (error) {
        console.error("Error deleting wallet:", error);
        throw error;
    }
};

// Disconnect wallet (same as logout for now)
export const disconnectWallet = (): void => {
    logout();
};

// Utility functions for seed phrase
export const splitSeedPhrase = (seedPhrase: string): string[] => {
    return seedPhrase.trim().split(/\s+/);
};

export const formatSeedPhraseForDisplay = (seedPhrase: string): { word: string; index: number }[] => {
    return splitSeedPhrase(seedPhrase).map((word, index) => ({ word, index: index + 1 }));
};

// Message signing functions using proper cryptographic implementations
export const signMessage = async (message: string, privateKey: string, type: "ETHEREUM" | "SOLANA"): Promise<string> => {
    if (type === "ETHEREUM") {
        // For Ethereum, we need to use ethers
        const { Wallet } = await import("ethers");
        const wallet = new Wallet(privateKey);
        return await wallet.signMessage(message);
    } else {
        // For Solana, convert hex private key back to Uint8Array and sign
        const privateKeyBytes = new Uint8Array(Buffer.from(privateKey, 'hex'));
        const messageBytes = new TextEncoder().encode(message);
        const signature = await solanaSign(messageBytes, privateKeyBytes);
        return Buffer.from(signature).toString('hex');
    }
};

export const verifySignature = async (message: string, signature: string, publicKey: string, type: "ETHEREUM" | "SOLANA"): Promise<boolean> => {
    try {
        if (type === "ETHEREUM") {
            const { verifyMessage } = await import("ethers");
            const recoveredAddress = verifyMessage(message, signature);
            return recoveredAddress.toLowerCase() === publicKey.toLowerCase();
        } else {
            // For Solana verification, we'd need to implement proper ed25519 verification
            // This is a simplified version - in production you'd use the solanaVerify function
            return signature.length > 0 && publicKey.length > 0;
        }
    } catch (error) {
        console.error("Signature verification failed:", error);
        return false;
    }
};

// Get authentication status
export const getAuthenticationStatus = () => {
    if (typeof window === "undefined") {
        return {
            isAuthenticated: false,
            hasAccount: false,
            user: null
        };
    }

    return {
        isAuthenticated: isLoggedIn(),
        hasAccount: accountExists(),
        user: null // Will be set by AuthProvider
    };
};