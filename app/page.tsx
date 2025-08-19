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
import {
	getUserWallets,
	createWallet,
	deleteWallet,
	createAccount,
	loginWithPassword,
	logout,
	type Wallet
} from "@/lib/userUtils";
import { Copy, Trash2, Eye, EyeOff, MessageCircle, Plus, Wallet as WalletIcon, UserPlus, LogIn, LogOut, Loader } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";

export default function Home() {
	const router = useRouter();
	const { isAuthenticated, hasAccount, user, loading, refreshAuth } = useAuth();
	
	const [walletType, setWalletType] = useState<"ETHEREUM" | "SOLANA">("ETHEREUM");
	const [walletName, setWalletName] = useState("");
	const [wallets, setWallets] = useState<Wallet[]>([]);
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
	const [isChatDialogOpen, setIsChatDialogOpen] = useState(false);
	const [isCreateAccountDialogOpen, setIsCreateAccountDialogOpen] = useState(false);
	const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);
	const [recipientPublicKey, setRecipientPublicKey] = useState("");
	const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
	const [visiblePrivateKeys, setVisiblePrivateKeys] = useState<Set<string>>(new Set());
	const [isSigning, setIsSigning] = useState(false);
	const [isCreatingAccount, setIsCreatingAccount] = useState(false);

	// Account creation state
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [generatedSeed, setGeneratedSeed] = useState("");
	const [showSeed, setShowSeed] = useState(false);

	// Login state
	const [loginPassword, setLoginPassword] = useState("");

	// Load wallets when user is authenticated
	useEffect(() => {
		if (isAuthenticated) {
			loadWallets();
		}
	}, [isAuthenticated]);

	const loadWallets = async () => {
		try {
			const userWallets = await getUserWallets();
			setWallets(userWallets);
		} catch (error) {
			console.error("Error loading wallets:", error);
			toast.error("Failed to load wallets");
		}
	};

	const handleCreateAccount = async () => {
		if (password !== confirmPassword) {
			toast.error("Passwords don't match");
			return;
		}

		if (password.length < 6) {
			toast.error("Password must be at least 6 characters long");
			return;
		}

		setIsCreatingAccount(true);
		try {
			const result = await createAccount(password);
			setGeneratedSeed(result.masterSeed);
			setShowSeed(true);
			toast.success("Account created successfully! Please save your seed phrase.");
		} catch (error) {
			console.error("Error creating account:", error);
			toast.error(error instanceof Error ? error.message : "Failed to create account");
		} finally {
			setIsCreatingAccount(false);
		}
	};

	const handleLogin = async () => {
		try {
			await loginWithPassword(loginPassword);
			await refreshAuth();
			setIsLoginDialogOpen(false);
			setLoginPassword("");
			toast.success("Logged in successfully!");
		} catch (error) {
			console.error("Error logging in:", error);
			toast.error(error instanceof Error ? error.message : "Login failed");
		}
	};

	const handleCreateWallet = async () => {
		if (!walletName.trim()) {
			toast.error("Please enter a wallet name");
			return;
		}

		try {
			await createWallet(walletName.trim(), walletType);
			await loadWallets();
			setIsCreateDialogOpen(false);
			setWalletName("");
			toast.success(`${walletType} wallet created successfully!`);
		} catch (error) {
			console.error("Error creating wallet:", error);
			toast.error(error instanceof Error ? error.message : "Failed to create wallet");
		}
	};

	const handleDeleteWallet = async (walletId: string) => {
		try {
			await deleteWallet(walletId);
			await loadWallets();
			toast.success("Wallet deleted successfully!");
		} catch (error) {
			console.error("Error deleting wallet:", error);
			toast.error("Failed to delete wallet");
		}
	};

	const copyToClipboard = (text: string, type: string) => {
		navigator.clipboard.writeText(text);
		toast.success(`${type} copied to clipboard!`);
	};

	const togglePrivateKeyVisibility = (walletId: string) => {
		setVisiblePrivateKeys(prev => {
			const newSet = new Set(prev);
			if (newSet.has(walletId)) {
				newSet.delete(walletId);
			} else {
				newSet.add(walletId);
			}
			return newSet;
		});
	};

	const handleStartChat = async () => {
		if (!recipientPublicKey.trim()) {
			toast.error("Please enter a recipient public key");
			return;
		}

		if (!selectedWallet) {
			toast.error("Please select a wallet to send from");
			return;
		}

		setIsSigning(true);
		try {
			// Create a chat room identifier based on the two public keys
			const chatId = [selectedWallet.publicKey, recipientPublicKey.trim()]
				.sort()
				.join("-")
				.replace(/[^a-zA-Z0-9]/g, "");

			router.push(`/chat/${chatId}?from=${selectedWallet.publicKey}&to=${recipientPublicKey.trim()}`);
		} catch (error) {
			console.error("Error starting chat:", error);
			toast.error("Failed to start chat");
		} finally {
			setIsSigning(false);
			setIsChatDialogOpen(false);
			setRecipientPublicKey("");
			setSelectedWallet(null);
		}
	};

	const handleAccountCreationComplete = async () => {
		setIsCreateAccountDialogOpen(false);
		setShowSeed(false);
		setPassword("");
		setConfirmPassword("");
		setGeneratedSeed("");
		await refreshAuth();
	};

	const handleLogout = () => {
		logout();
		refreshAuth();
		setWallets([]);
		toast.success("Logged out successfully");
	};

	const handleCopy = (text: string) => {
		navigator.clipboard.writeText(text);
		toast.success("Copied to clipboard!");
	};

	const handleCompleteSeedView = async () => {
		setShowSeed(false);
		setIsCreateAccountDialogOpen(false);
		setPassword("");
		setConfirmPassword("");
		setGeneratedSeed("");
		await refreshAuth();
	};

	// Loading state
	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center space-y-4">
					<Loader className="h-8 w-8 animate-spin mx-auto" />
					<p className="text-muted-foreground">Loading...</p>
				</div>
			</div>
		);
	}

	// Authentication required - No account exists
	if (!hasAccount) {
		return (
			<section className="min-h-screen flex items-center justify-center bg-white dark:bg-neutral-900 text-gray-800 dark:text-gray-200 p-4">
				<div className="max-w-md w-full">
					<div className="text-center mb-8">
						<WalletIcon className="h-16 w-16 mx-auto mb-4 text-blue-600 dark:text-blue-400" />
						<h1 className="text-3xl font-bold mb-2">Welcome to Web3 Khalti</h1>
						<p className="text-gray-600 dark:text-gray-300">
							Create your secure Web3 account to get started with wallet management and secure messaging.
						</p>
					</div>

					<div className="space-y-4">
						<Dialog open={isCreateAccountDialogOpen} onOpenChange={setIsCreateAccountDialogOpen}>
							<DialogTrigger asChild>
								<Button className="w-full" size="lg">
									<UserPlus className="mr-2 h-5 w-5" />
									Create New Account
								</Button>
							</DialogTrigger>
							<DialogContent className="sm:max-w-md">
								<DialogHeader>
									<DialogTitle>Create Your Account</DialogTitle>
									<DialogDescription>
										{!showSeed 
											? "Set up your secure account with a strong password. You'll receive a 12-word recovery phrase."
											: "Important: Save your recovery phrase in a secure location. You'll need it to recover your account."
										}
									</DialogDescription>
								</DialogHeader>

								{!showSeed ? (
									<div className="space-y-4">
										<div>
											<Label htmlFor="password">Password</Label>
											<Input
												id="password"
												type="password"
												placeholder="Enter a strong password (min 6 characters)"
												value={password}
												onChange={(e) => setPassword(e.target.value)}
											/>
										</div>
										<div>
											<Label htmlFor="confirmPassword">Confirm Password</Label>
											<Input
												id="confirmPassword"
												type="password"
												placeholder="Confirm your password"
												value={confirmPassword}
												onChange={(e) => setConfirmPassword(e.target.value)}
												onKeyPress={(e) => e.key === 'Enter' && handleCreateAccount()}
											/>
										</div>
										<Button 
											onClick={handleCreateAccount} 
											disabled={isCreatingAccount || !password || !confirmPassword}
											className="w-full"
										>
											{isCreatingAccount ? (
												<>
													<Loader className="mr-2 h-4 w-4 animate-spin" />
													Creating Account...
												</>
											) : (
												"Create Account"
											)}
										</Button>
									</div>
								) : (
									<div className="space-y-4">
										<div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
											<h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
												🔒 Your Recovery Phrase
											</h4>
											<p className="text-sm text-yellow-700 dark:text-yellow-300">
												Write down these 12 words in order and store them safely. Never share them with anyone!
											</p>
										</div>
										
										<div className="grid grid-cols-3 gap-2">
											{generatedSeed.split(" ").map((word, index) => (
												<div 
													key={index} 
													className="flex items-center space-x-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg"
												>
													<span className="text-sm font-mono text-gray-500 w-6">
														{index + 1}.
													</span>
													<span className="font-medium">{word}</span>
												</div>
											))}
										</div>
										
										<Button 
											onClick={() => handleCopy(generatedSeed)}
											variant="outline"
											className="w-full"
										>
											<Copy className="mr-2 h-4 w-4" />
											Copy Recovery Phrase
										</Button>
										
										<Button 
											onClick={handleCompleteSeedView}
											className="w-full"
										>
											I've Saved My Recovery Phrase
										</Button>
									</div>
								)}
							</DialogContent>
						</Dialog>
					</div>
				</div>
			</section>
		);
	}

	// Login required - Account exists but not logged in
	if (!isAuthenticated) {
		return (
			<section className="min-h-screen flex items-center justify-center bg-white dark:bg-neutral-900 text-gray-800 dark:text-gray-200 p-4">
				<div className="max-w-md w-full">
					<div className="text-center mb-8">
						<WalletIcon className="h-16 w-16 mx-auto mb-4 text-blue-600 dark:text-blue-400" />
						<h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
						<p className="text-gray-600 dark:text-gray-300">
							Please sign in to access your Web3 Khalti account.
						</p>
					</div>

					<div className="space-y-4">
						<Dialog open={isLoginDialogOpen} onOpenChange={setIsLoginDialogOpen}>
							<DialogTrigger asChild>
								<Button className="w-full" size="lg">
									<LogIn className="mr-2 h-5 w-5" />
									Sign In
								</Button>
							</DialogTrigger>
							<DialogContent className="sm:max-w-md">
								<DialogHeader>
									<DialogTitle>Sign In to Your Account</DialogTitle>
									<DialogDescription>
										Enter your password to access your Web3 Khalti account.
									</DialogDescription>
								</DialogHeader>

								<div className="space-y-4">
									<div>
										<Label htmlFor="loginPassword">Password</Label>
										<Input
											id="loginPassword"
											type="password"
											placeholder="Enter your password"
											value={loginPassword}
											onChange={(e) => setLoginPassword(e.target.value)}
											onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
										/>
									</div>
									<Button onClick={handleLogin} className="w-full" disabled={!loginPassword}>
										Sign In
									</Button>
								</div>
							</DialogContent>
						</Dialog>
						
						<Link href="/forgot-password">
							<Button variant="outline" className="w-full">
								Forgot Password?
							</Button>
						</Link>
					</div>
				</div>
			</section>
		);
	}

	// Main authenticated dashboard
	return (
		<section className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-neutral-900 text-gray-800 dark:text-gray-200 p-4">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex justify-between items-center mb-8">
					<div>
						<h1 className="text-4xl font-bold">Web3 Khalti Dashboard</h1>
						<p className="text-lg text-gray-600 dark:text-gray-400">
							Manage your wallets and secure messaging
						</p>
					</div>
					<Button 
						variant="outline" 
						onClick={handleLogout}
						className="flex items-center gap-2"
					>
						<LogOut className="h-4 w-4" />
						Logout
					</Button>
				</div>
				
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
								<div className="space-y-2">
									<Label htmlFor="wallet-name">Wallet Name</Label>
									<Input
										id="wallet-name"
										value={walletName}
										onChange={(e) => setWalletName(e.target.value)}
										placeholder="Enter wallet name"
									/>
								</div>
								<div className="space-y-2">
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
												onClick={() => handleDeleteWallet(wallet.id)}
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
			</div>
		</section>
	);
}
