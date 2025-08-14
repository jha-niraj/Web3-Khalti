"use client";

import { Button } from "@/components/ui/button";
import {
	Dialog, DialogContent, DialogDescription, 
	DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { getUserWallets, createWallet, deleteWallet, isUserConnected, type Wallet } from "@/lib/userUtils";
import { Copy, Trash2, Eye, EyeOff, MessageCircle, Plus, Wallet as WalletIcon } from "lucide-react";
import { toast } from "sonner";

export default function Home() {
	const [walletType, setWalletType] = useState<"ETHEREUM" | "SOLANA">("ETHEREUM");
	const [walletName, setWalletName] = useState("");
	const [wallets, setWallets] = useState<Wallet[]>([]);
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
	const [isChatDialogOpen, setIsChatDialogOpen] = useState(false);
	const [recipientPublicKey, setRecipientPublicKey] = useState("");
	const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
	const [visiblePrivateKeys, setVisiblePrivateKeys] = useState<Set<string>>(new Set());
	const [isConnected, setIsConnected] = useState(false);

	// Initialize the router for navigation
	const router = useRouter();

	useEffect(() => {
		checkConnectionAndLoadWallets();

		// Listen for wallet connection events
		const handleWalletConnected = () => {
			checkConnectionAndLoadWallets();
		};

		window.addEventListener('walletConnected', handleWalletConnected);
		
		return () => {
			window.removeEventListener('walletConnected', handleWalletConnected);
		};
	}, []);

	const checkConnectionAndLoadWallets = async () => {
		const connected = isUserConnected();
		setIsConnected(connected);
		
		if (connected) {
			await loadWallets();
		}
	};

	const loadWallets = async () => {
		try {
			const userWallets = await getUserWallets();
			setWallets(userWallets);
		} catch (error) {
			console.error("Error loading wallets:", error);
		}
	};

	const handleCreateWallet = async () => {
		if (!walletName.trim()) {
			toast.error("Please enter a wallet name");
			return;
		}

		try {
			await createWallet(walletName, walletType);
			toast.success("Wallet created successfully!");
			setWalletName("");
			setIsCreateDialogOpen(false);
			await loadWallets();
		} catch (error) {
			console.error("Error creating wallet:", error);
			toast.error("Failed to create wallet");
		}
	};

	const handleDeleteWallet = async (wallet: Wallet) => {
		try {
			await deleteWallet(wallet.id);
			toast.success("Wallet deleted successfully!");
			await loadWallets();
		} catch (error) {
			console.error("Error deleting wallet:", error);
			toast.error("Failed to delete wallet");
		}
	};

	const handleCopy = (text: string) => {
		navigator.clipboard.writeText(text);
		toast.success("Copied to clipboard!");
	};

	const togglePrivateKeyVisibility = (walletId: string) => {
		const newVisible = new Set(visiblePrivateKeys);
		if (newVisible.has(walletId)) {
			newVisible.delete(walletId);
		} else {
			newVisible.add(walletId);
		}
		setVisiblePrivateKeys(newVisible);
	};

	const handleStartChat = () => {
		if (!selectedWallet) {
			toast.error("Please select a wallet first");
			return;
		}
		
		if (!recipientPublicKey.trim()) {
			toast.error("Please enter recipient's public key");
			return;
		}

		// Create a unique chat room ID based on the two public keys
		const participants = [selectedWallet.publicKey, recipientPublicKey].sort();
		const chatRoomId = btoa(participants.join("|")).replace(/[+/=]/g, "");
		
		// Navigate to chat page
		router.push(`/chat/${chatRoomId}?wallet=${selectedWallet.id}&recipient=${encodeURIComponent(recipientPublicKey)}`);
		
		setIsChatDialogOpen(false);
		setRecipientPublicKey("");
		setSelectedWallet(null);
	};

	return (
		<section className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-neutral-900 text-gray-800 dark:text-gray-200 p-4">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<h1 className="text-4xl font-bold text-center mb-4">Welcome to Web3 Khalti</h1>
				<p className="text-lg text-center text-gray-800 dark:text-gray-200 mb-8">
					Your one-stop solution for all things Web3. Explore our features and get started today!
				</p>
				
				{!isConnected ? (
					<div className="text-center space-y-6">
						<div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-8 max-w-md mx-auto">
							<WalletIcon className="h-16 w-16 mx-auto mb-4 text-blue-600 dark:text-blue-400" />
							<h2 className="text-2xl font-semibold mb-2">Connect Your Wallet</h2>
							<p className="text-gray-600 dark:text-gray-300 mb-4">
								To start using Web3 Khalti, you need to connect your wallet first.
							</p>
							<p className="text-sm text-gray-500 dark:text-gray-400">
								Click "Connect Wallet" in the navigation bar above to get started.
							</p>
						</div>
					</div>
				) : (
					<>
						{/* Action Buttons */}
						<div className="flex justify-center space-x-4 mb-8">
							<Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
								<DialogTrigger asChild>
									<Button className="cursor-pointer">
										<Plus className="mr-2 h-4 w-4" />
										Create Wallet
									</Button>
								</DialogTrigger>
								<DialogContent className="sm:max-w-[425px] bg-white dark:bg-neutral-900">
									<DialogHeader>
										<DialogTitle>Create New Wallet</DialogTitle>
										<DialogDescription>
											Create a new wallet for your selected blockchain.
										</DialogDescription>
									</DialogHeader>
									<div className="flex flex-col gap-4 py-4">
										<div>
											<Label htmlFor="wallet-name">Wallet Name</Label>
											<Input
												id="wallet-name"
												value={walletName}
												onChange={(e) => setWalletName(e.target.value)}
												placeholder="Enter wallet name"
											/>
										</div>
										
										<div>
											<Label>Wallet Type</Label>
											<div className="flex gap-2 mt-2">
												<Button
													variant={walletType === "ETHEREUM" ? "default" : "outline"}
													onClick={() => setWalletType("ETHEREUM")}
													className="flex-1"
												>
													Ethereum
												</Button>
												<Button
													variant={walletType === "SOLANA" ? "default" : "outline"}
													onClick={() => setWalletType("SOLANA")}
													className="flex-1"
												>
													Solana
												</Button>
											</div>
										</div>

										<Button onClick={handleCreateWallet} className="mt-4">
											Create Wallet
										</Button>
									</div>
								</DialogContent>
							</Dialog>

							{wallets.length > 0 && (
								<Dialog open={isChatDialogOpen} onOpenChange={setIsChatDialogOpen}>
									<DialogTrigger asChild>
										<Button variant="outline" className="cursor-pointer">
											<MessageCircle className="mr-2 h-4 w-4" />
											Start Chat
										</Button>
									</DialogTrigger>
									<DialogContent className="sm:max-w-[425px] bg-white dark:bg-neutral-900">
										<DialogHeader>
											<DialogTitle>Start Secure Chat</DialogTitle>
											<DialogDescription>
												Select your wallet and enter the recipient's public key to start a secure chat.
											</DialogDescription>
										</DialogHeader>
										<div className="flex flex-col gap-4 py-4">
											<div>
												<Label>Select Your Wallet</Label>
												<div className="mt-2 space-y-2 max-h-32 overflow-y-auto">
													{wallets.map((wallet) => (
														<div
															key={wallet.id}
															className={`p-3 border rounded-lg cursor-pointer transition-colors ${
																selectedWallet?.id === wallet.id
																	? "bg-blue-50 border-blue-500 dark:bg-blue-900"
																	: "hover:bg-gray-50 dark:hover:bg-gray-800"
															}`}
															onClick={() => setSelectedWallet(wallet)}
														>
															<div className="flex items-center justify-between">
																<div>
																	<p className="font-medium">{wallet.name}</p>
																	<p className="text-sm text-gray-500">
																		{wallet.publicKey.substring(0, 20)}...
																	</p>
																</div>
																<span className={`text-xs px-2 py-1 rounded ${
																	wallet.type === "ETHEREUM" 
																		? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" 
																		: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
																}`}>
																	{wallet.type.toLowerCase()}
																</span>
															</div>
														</div>
													))}
												</div>
											</div>

											<div>
												<Label htmlFor="recipient-key">Recipient's Public Key</Label>
												<Input
													id="recipient-key"
													value={recipientPublicKey}
													onChange={(e) => setRecipientPublicKey(e.target.value)}
													placeholder="Enter recipient's public key"
												/>
											</div>

											<Button onClick={handleStartChat} className="mt-4" disabled={!selectedWallet}>
												Start Chat
											</Button>
										</div>
									</DialogContent>
								</Dialog>
							)}
						</div>

						{/* Wallets Display */}
						{wallets.length > 0 ? (
							<div className="space-y-6">
								<h2 className="text-2xl font-bold text-center">Your Wallets</h2>
								<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
									{wallets.map((wallet) => (
										<div key={wallet.id} className="bg-gray-100 dark:bg-neutral-800 p-6 rounded-lg">
											<div className="flex items-center justify-between mb-4">
												<h3 className="font-semibold text-lg">{wallet.name}</h3>
												<div className="flex items-center gap-2">
													<span className={`text-xs px-2 py-1 rounded ${
														wallet.type === "ETHEREUM" 
															? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" 
															: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
													}`}>
														{wallet.type.toLowerCase()}
													</span>
													<Button
														variant="ghost"
														size="sm"
														onClick={() => handleDeleteWallet(wallet)}
														className="text-red-500 hover:text-red-700"
													>
														<Trash2 className="h-4 w-4" />
													</Button>
												</div>
											</div>

											<div className="mb-4">
												<Label className="text-sm font-medium">Public Key</Label>
												<div className="flex items-center justify-between mt-1">
													<p className="text-sm font-mono bg-white dark:bg-neutral-700 p-2 rounded flex-1 truncate mr-2">
														{wallet.publicKey}
													</p>
													<Button
														variant="ghost"
														size="sm"
														onClick={() => handleCopy(wallet.publicKey)}
													>
														<Copy className="h-4 w-4" />
													</Button>
												</div>
											</div>

											<div>
												<Label className="text-sm font-medium">Private Key</Label>
												<div className="flex items-center justify-between mt-1">
													<p className="text-sm font-mono bg-white dark:bg-neutral-700 p-2 rounded flex-1 mr-2">
														{visiblePrivateKeys.has(wallet.id)
															? wallet.privateKey
															: "••••••••••••••••••••••••••••••••"}
													</p>
													<div className="flex gap-1">
														<Button
															variant="ghost"
															size="sm"
															onClick={() => togglePrivateKeyVisibility(wallet.id)}
														>
															{visiblePrivateKeys.has(wallet.id) ? (
																<EyeOff className="h-4 w-4" />
															) : (
																<Eye className="h-4 w-4" />
															)}
														</Button>
														{visiblePrivateKeys.has(wallet.id) && (
															<Button
																variant="ghost"
																size="sm"
																onClick={() => handleCopy(wallet.privateKey)}
															>
																<Copy className="h-4 w-4" />
															</Button>
														)}
													</div>
												</div>
											</div>
										</div>
									))}
								</div>
							</div>
						) : (
							<div className="text-center space-y-6">
								<div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 max-w-md mx-auto">
									<WalletIcon className="h-16 w-16 mx-auto mb-4 text-gray-400" />
									<h2 className="text-2xl font-semibold mb-2">No Wallets Yet</h2>
									<p className="text-gray-600 dark:text-gray-300 mb-4">
										Create your first wallet to get started with Web3 Khalti.
									</p>
									<Button onClick={() => setIsCreateDialogOpen(true)}>
										<Plus className="mr-2 h-4 w-4" />
										Create Your First Wallet
									</Button>
								</div>
							</div>
						)}
					</>
				)}
			</div>
		</section>
	);
}