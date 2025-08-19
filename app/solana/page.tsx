"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Copy, Plus, Trash } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth-provider";
import { getUserWallets, createWallet, deleteWallet, type Wallet } from "@/lib/userUtils";
import { useRouter } from "next/navigation";

export default function SolanaPage() {
    const router = useRouter();
    const { isAuthenticated, hasAccount, loading, user } = useAuth();
    const [wallets, setWallets] = useState<Wallet[]>([]);
    const [isPrivateKeyVisible, setIsPrivateKeyVisible] = useState<{ [key: string]: boolean }>({});
    const [walletName, setWalletName] = useState("");

    useEffect(() => {
        if (!loading && !hasAccount) {
            toast.error("Please create an account first");
            router.push("/");
            return;
        }

        if (!loading && !isAuthenticated) {
            toast.error("Please log in first");
            router.push("/");
            return;
        }

        if (isAuthenticated) {
            loadSolanaWallets();
        }
    }, [isAuthenticated, hasAccount, loading, router]);

    const loadSolanaWallets = async () => {
        try {
            const userWallets = await getUserWallets();
            const solanaWallets = userWallets.filter(wallet => wallet.type === "SOLANA");
            setWallets(solanaWallets);
        } catch (error) {
            console.error("Error loading Solana wallets:", error);
            toast.error("Failed to load Solana wallets");
        }
    };

    const handleCopy = (text: string, type: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`${type} copied to clipboard!`);
    };

    const handleCreateWallet = async () => {
        if (!walletName.trim()) {
            toast.error("Please enter a wallet name");
            return;
        }

        try {
            await createWallet(walletName.trim(), "SOLANA");
            await loadSolanaWallets();
            setWalletName("");
            toast.success("Solana wallet created successfully!");
        } catch (error) {
            console.error("Error creating Solana wallet:", error);
            toast.error("Failed to create Solana wallet");
        }
    };

    const handleDeleteWallet = async (walletId: string) => {
        if (window.confirm("Are you sure you want to delete this wallet?")) {
            try {
                await deleteWallet(walletId);
                await loadSolanaWallets();
                toast.success("Wallet deleted successfully!");
            } catch (error) {
                console.error("Error deleting wallet:", error);
                toast.error("Failed to delete wallet");
            }
        }
    };

    const togglePrivateKeyVisibility = (walletId: string) => {
        setIsPrivateKeyVisible(prev => ({
            ...prev,
            [walletId]: !prev[walletId]
        }));
    };

    if (loading) {
        return (
            <section className="min-h-screen bg-white dark:bg-neutral-900 text-gray-800 dark:text-gray-200 p-4">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">Loading...</div>
                </div>
            </section>
        );
    }

    if (!hasAccount || !isAuthenticated) {
        return null; // Redirect is handled in useEffect
    }

    return (
        <section className="min-h-screen bg-white dark:bg-neutral-900 text-gray-800 dark:text-gray-200 p-4">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-bold text-center mb-8">
                    Your Solana Wallets
                </h1>

                {user && (
                    <div className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4">Your Seed Phrase</h2>
                        <div
                            className="grid grid-cols-3 gap-4 bg-gray-100 dark:bg-neutral-800 p-4 rounded-lg cursor-pointer"
                            onClick={() => handleCopy(user.masterSeed, "Seed phrase")}
                        >
                            {user.masterSeed.split(" ").map((word: string, index: number) => (
                                <span
                                    key={index}
                                    className="bg-white dark:bg-neutral-700 p-2 rounded text-center hover:bg-gray-50 dark:hover:bg-neutral-600 transition-colors"
                                >
                                    {index + 1}. {word}
                                </span>
                            ))}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 text-center">
                            Click to copy seed phrase
                        </p>
                    </div>
                )}

                {/* Create New Wallet */}
                <div className="mb-8 bg-gray-100 dark:bg-neutral-800 p-6 rounded-lg">
                    <h3 className="text-xl font-semibold mb-4">Create New Solana Wallet</h3>
                    <div className="flex gap-4">
                        <input
                            type="text"
                            placeholder="Enter wallet name"
                            value={walletName}
                            onChange={(e) => setWalletName(e.target.value)}
                            className="flex-1 px-4 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700"
                        />
                        <Button
                            onClick={handleCreateWallet}
                            className="flex items-center gap-2"
                        >
                            <Plus className="h-4 w-4" />
                            Create Wallet
                        </Button>
                    </div>
                </div>

                {/* Existing Wallets */}
                <div className="space-y-6">
                    {wallets.length === 0 ? (
                        <div className="text-center text-gray-600 dark:text-gray-400">
                            No Solana wallets found. Create your first wallet above.
                        </div>
                    ) : (
                        wallets.map((wallet) => (
                            <div
                                key={wallet.id}
                                className="bg-gray-100 dark:bg-neutral-800 p-6 rounded-lg"
                            >
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-xl font-semibold">{wallet.name}</h3>
                                    <Button
                                        onClick={() => handleDeleteWallet(wallet.id)}
                                        variant="destructive"
                                        size="sm"
                                        className="flex items-center gap-2"
                                    >
                                        <Trash className="h-4 w-4" />
                                        Delete
                                    </Button>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <h4 className="text-lg font-medium mb-2">Public Key</h4>
                                        <div className="flex items-center justify-between bg-white dark:bg-neutral-700 p-4 rounded border">
                                            <p className="truncate mr-4">{wallet.publicKey}</p>
                                            <Button
                                                onClick={() => handleCopy(wallet.publicKey, "Public key")}
                                                size="sm"
                                                variant="outline"
                                            >
                                                <Copy className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-lg font-medium mb-2">Private Key</h4>
                                        <div className="flex items-center justify-between bg-white dark:bg-neutral-700 p-4 rounded border">
                                            <p className="truncate mr-4">
                                                {isPrivateKeyVisible[wallet.id] ? wallet.privateKey : "••••••••••••••••••••"}
                                            </p>
                                            <div className="flex gap-2">
                                                <Button
                                                    onClick={() => togglePrivateKeyVisibility(wallet.id)}
                                                    size="sm"
                                                    variant="outline"
                                                >
                                                    {isPrivateKeyVisible[wallet.id] ? (
                                                        <EyeOff className="h-4 w-4" />
                                                    ) : (
                                                        <Eye className="h-4 w-4" />
                                                    )}
                                                </Button>
                                                <Button
                                                    onClick={() => handleCopy(wallet.privateKey, "Private key")}
                                                    size="sm"
                                                    variant="outline"
                                                >
                                                    <Copy className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </section>
    );
}
