"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Copy, Plus, Trash } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth-provider";
import { getUserWallets, createWallet, deleteWallet, type Wallet } from "@/lib/userUtils";
import { useRouter } from "next/navigation";

export default function EthereumPage() {
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
            loadEthereumWallets();
        }
    }, [isAuthenticated, hasAccount, loading, router]);

    const loadEthereumWallets = async () => {
        try {
            const userWallets = await getUserWallets();
            const ethereumWallets = userWallets.filter(wallet => wallet.type === "ETHEREUM");
            setWallets(ethereumWallets);
        } catch (error) {
            console.error("Error loading Ethereum wallets:", error);
            toast.error("Failed to load Ethereum wallets");
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
            await createWallet(walletName.trim(), "ETHEREUM");
            await loadEthereumWallets();
            setWalletName("");
            toast.success("Ethereum wallet created successfully!");
        } catch (error) {
            console.error("Error creating Ethereum wallet:", error);
            toast.error("Failed to create Ethereum wallet");
        }
    };

    const handleDeleteWallet = async (walletId: string) => {
        if (window.confirm("Are you sure you want to delete this wallet?")) {
            try {
                await deleteWallet(walletId);
                await loadEthereumWallets();
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
                <h1 className="text-2xl sm:text-3xl font-bold text-center mb-6 sm:mb-8">
                    Your Ethereum Wallets
                </h1>

                {user && (
                    <div className="mb-8">
                        <h2 className="text-xl sm:text-2xl font-semibold mb-4">Your Seed Phrase</h2>
                        <div
                            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4 bg-gray-100 dark:bg-neutral-800 p-3 sm:p-4 rounded-lg cursor-pointer"
                            onClick={() => handleCopy(user.masterSeed, "Seed phrase")}
                        >
                            {user.masterSeed.split(" ").map((word: string, index: number) => (
                                <span
                                    key={index}
                                    className="bg-white dark:bg-neutral-700 p-2 rounded text-center hover:bg-gray-50 dark:hover:bg-neutral-600 transition-colors text-sm"
                                >
                                    {index + 1}. {word}
                                </span>
                            ))}
                        </div>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-2 text-center">
                            Click to copy seed phrase
                        </p>
                    </div>
                )}

                {/* Create New Wallet */}
                <div className="mb-6 sm:mb-8 bg-gray-100 dark:bg-neutral-800 p-4 sm:p-6 rounded-lg">
                    <h3 className="text-lg sm:text-xl font-semibold mb-4">Create New Ethereum Wallet</h3>
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                        <input
                            type="text"
                            placeholder="Enter wallet name"
                            value={walletName}
                            onChange={(e) => setWalletName(e.target.value)}
                            className="flex-1 px-3 sm:px-4 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-sm sm:text-base"
                        />
                        <Button
                            onClick={handleCreateWallet}
                            className="flex items-center gap-2 justify-center"
                        >
                            <Plus className="h-4 w-4" />
                            <span className="hidden sm:inline">Create Wallet</span>
                            <span className="sm:hidden">Create</span>
                        </Button>
                    </div>
                </div>

                {/* Existing Wallets */}
                <div className="space-y-6">
                    {wallets.length === 0 ? (
                        <div className="text-center text-gray-600 dark:text-gray-400">
                            No Ethereum wallets found. Create your first wallet above.
                        </div>
                    ) : (
                        wallets.map((wallet) => (
                            <div
                                key={wallet.id}
                                className="bg-gray-100 dark:bg-neutral-800 p-4 sm:p-6 rounded-lg"
                            >
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-3">
                                    <h3 className="text-lg sm:text-xl font-semibold">{wallet.name}</h3>
                                    <Button
                                        onClick={() => handleDeleteWallet(wallet.id)}
                                        variant="destructive"
                                        size="sm"
                                        className="flex items-center gap-2 self-start sm:self-auto"
                                    >
                                        <Trash className="h-4 w-4" />
                                        Delete
                                    </Button>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <h4 className="text-base sm:text-lg font-medium mb-2">Public Key</h4>
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white dark:bg-neutral-700 p-3 sm:p-4 rounded border gap-3">
                                            <p className="truncate text-sm sm:text-base font-mono break-all">{wallet.publicKey}</p>
                                            <Button
                                                onClick={() => handleCopy(wallet.publicKey, "Public key")}
                                                size="sm"
                                                variant="outline"
                                                className="flex-shrink-0"
                                            >
                                                <Copy className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-base sm:text-lg font-medium mb-2">Private Key</h4>
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white dark:bg-neutral-700 p-3 sm:p-4 rounded border gap-3">
                                            <p className="truncate text-sm sm:text-base font-mono break-all">
                                                {isPrivateKeyVisible[wallet.id] ? wallet.privateKey : "••••••••••••••••••••"}
                                            </p>
                                            <div className="flex gap-2 flex-shrink-0">
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
