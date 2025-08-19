import { generateMnemonic } from "bip39";
import { createUser, getUserBySession, verifySeedPhrase as verifySeedAction, loginUser, resetPassword } from "./actions/user.action";
import { createWallet as createWalletAction, getUserWallets as getUserWalletsAction, deleteWallet as deleteWalletAction } from "./actions/wallet.action";

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
    updatedAt: Date;
}

// Create new account with password
export const createAccount = async (password: string): Promise<{ user: User; masterSeed: string; sessionId: string; error: string | null }> => {
    if (typeof window === "undefined") {
        throw new Error("This function can only be called on the client side");
    }

    if (!password || password.length < 6) {
        throw new Error("Password must be at least 6 characters long");
    }

    // Generate session ID and master seed
    const sessionId = generateSessionId();
    const masterSeed = generateMnemonic(128); // 12 words

    try {
        const result = await createUser(sessionId, masterSeed, password);

        if (result.error) {
            localStorage.removeItem("web3khalti_session");
            throw new Error(result.error);
        }

        // Store session ID in localStorage
        localStorage.setItem("web3khalti_session", sessionId);
        localStorage.setItem("web3khalti_password", result?.user?.passwordHash || "");

        return { 
            user: result.user!, 
            masterSeed, sessionId,
            error: null
        };
    } catch (error) {
        console.error("Error creating account:", error);
        throw error;
    }
};

// Login with password
export const loginWithPassword = async (password: string): Promise<User> => {
    if (typeof window === "undefined") {
        throw new Error("This function can only be called on the client side");
    }

    const sessionId = localStorage.getItem("web3khalti_session");
    if (!sessionId) {
        throw new Error("No account found. Please create an account first.");
    }

    try {
        const result = await loginUser(sessionId, password);

        if (result.error) {
            throw new Error(result.error);
        }

        // Store password for convenience
        localStorage.setItem("web3khalti_password", password);

        return result.user!;
    } catch (error) {
        console.error("Error logging in:", error);
        throw error;
    }
};

// Reset password with seed phrase verification
export const resetPasswordWithSeed = async (newPassword: string, seedWords: string[]): Promise<void> => {
    if (typeof window === "undefined") {
        throw new Error("This function can only be called on the client side");
    }

    const sessionId = localStorage.getItem("web3khalti_session");
    if (!sessionId) {
        throw new Error("No account found");
    }

    try {
        const result = await resetPassword(sessionId, newPassword, seedWords);

        if (result.error) {
            throw new Error(result.error);
        }

        // Update stored password
        localStorage.setItem("web3khalti_password", newPassword);
    } catch (error) {
        console.error("Error resetting password:", error);
        throw error;
    }
};

// Check if account exists
export const accountExists = (): boolean => {
    if (typeof window === "undefined") return false;
    return !!localStorage.getItem("web3khalti_session");
};

// Check if user is logged in
export const isLoggedIn = (): boolean => {
    if (typeof window === "undefined") return false;
    return !!localStorage.getItem("web3khalti_session") && !!localStorage.getItem("web3khalti_password");
};

// Get or create user session (legacy - used only for wallet connection flow)
export const getOrCreateUserSession = async (): Promise<{ user: User; isNewUser: boolean }> => {
    if (typeof window === "undefined") {
        throw new Error("This function can only be called on the client side");
    }

    let sessionId = localStorage.getItem("web3khalti_session");

    if (!sessionId) {
        throw new Error("No user session found. Please create an account first or Login In");
    }

    try {
        // Try to find existing user
        const userResult = await getUserBySession(sessionId);

        if (userResult.error) {
            // Create new user - this should not happen with new flow
            throw new Error("Please create an account first");
        }

        // Always return isNewUser as false since this is only called for existing authenticated users
        return { user: userResult.user!, isNewUser: false };
    } catch (error) {
        console.error("Error managing user session:", error);
        throw error;
    }
};

// Check if user is connected (has session and is logged in)
export const isUserConnected = (): boolean => {
    return isLoggedIn();
};

// Get current user if connected
export const getCurrentUser = async (): Promise<User | null> => {
    if (typeof window === "undefined") return null;

    const sessionId = localStorage.getItem("web3khalti_session");
    if (!sessionId) return null;

    try {
        const userResult = await getUserBySession(sessionId);
        return userResult.error ? null : userResult.user!;
    } catch (error) {
        console.error("Error getting current user:", error);
        return null;
    }
};

// Logout user
export const logout = (): void => {
    if (typeof window === "undefined") return;
    localStorage.removeItem("web3khalti_password");
    // Keep session ID for account recovery - user can log back in
};

// Verify seed phrase
export const verifySeedPhrase = async (seedPhrase: string[]): Promise<boolean> => {
    if (typeof window === "undefined") return false;

    const sessionId = localStorage.getItem("web3khalti_session");
    if (!sessionId) return false;

    try {
        const result = await verifySeedAction(sessionId, seedPhrase.join(" "));
        return result.valid || false;
    } catch (error) {
        console.error("Error verifying seed phrase:", error);
        return false;
    }
};

// Create new wallet
export const createWallet = async (name: string, type: "ETHEREUM" | "SOLANA"): Promise<Wallet> => {
    if (typeof window === "undefined") {
        throw new Error("This function can only be called on the client side");
    }

    const sessionId = localStorage.getItem("web3khalti_session");
    if (!sessionId) {
        throw new Error("No user session found");
    }

    try {
        const result = await createWalletAction(sessionId, name, type);

        if (result.error) {
            throw new Error(result.error);
        }

        return result.wallet!;
    } catch (error) {
        console.error("Error creating wallet:", error);
        throw error;
    }
};

// Get user wallets
export const getUserWallets = async (): Promise<Wallet[]> => {
    if (typeof window === "undefined") return [];

    const sessionId = localStorage.getItem("web3khalti_session");
    if (!sessionId) return [];

    try {
        const result = await getUserWalletsAction(sessionId);
        return result.error ? [] : (result.wallets || []);
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

    const sessionId = localStorage.getItem("web3khalti_session");
    if (!sessionId) {
        throw new Error("No user session found");
    }

    try {
        const result = await deleteWalletAction(sessionId, walletId);

        if (result.error) {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error("Error deleting wallet:", error);
        throw error;
    }
};

// Disconnect wallet (clear session)
export const disconnectWallet = (): void => {
    if (typeof window === "undefined") return;
    localStorage.removeItem("web3khalti_session");
};

// Generate session ID
const generateSessionId = (): string => {
    return Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15) +
        Date.now().toString(36);
};

// Utility functions for seed phrase display
export const splitSeedPhrase = (seedPhrase: string): string[] => {
    return seedPhrase.split(" ");
};

export const formatSeedPhraseForDisplay = (seedPhrase: string): { word: string; index: number }[] => {
    return splitSeedPhrase(seedPhrase).map((word, index) => ({ word, index: index + 1 }));
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

// Authentication helper functions - optimized for components using AuthProvider
export const getAuthenticationStatus = () => {
    if (typeof window === "undefined") {
        return { hasAccount: false, isAuthenticated: false };
    }
    
    return {
        hasAccount: accountExists(),
        isAuthenticated: isLoggedIn()
    };
};
