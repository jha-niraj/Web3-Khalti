"use client"

import Image from "next/image"
import { Button } from "../ui/button"
import { Moon, Sun, Wallet, LogIn, LogOut, UserPlus, Menu, X, Key } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import Link from "next/link"
import {
	Dialog, DialogContent, DialogDescription,
	DialogHeader, DialogTitle, DialogTrigger
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { verifySeedPhrase, logout, loginWithSeedPhrase } from "@/lib/userUtils";
import { toast } from "sonner";
import { useAuth } from "../auth-provider"

const Navbar = () => {
	const { theme, setTheme } = useTheme();
	const { isAuthenticated, hasAccount, user, loading, refreshAuth } = useAuth();
	const [scrolled, setScrolled] = useState(false);
	const [isConnectDialogOpen, setIsConnectDialogOpen] = useState(false);
	const [userSeed, setUserSeed] = useState<string>("");
	const [seedWords, setSeedWords] = useState<string[]>([]);
	const [userInputs, setUserInputs] = useState<string[]>(["", ""]);
	const [isVerified, setIsVerified] = useState(false);
	const [isNewUser, setIsNewUser] = useState(false);
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
	const [isSeedImportDialogOpen, setIsSeedImportDialogOpen] = useState(false);
	const [importSeedPhrase, setImportSeedPhrase] = useState("");
	const [importPassword, setImportPassword] = useState("");

	useEffect(() => {
		const handleScroll = () => {
			setScrolled(window.scrollY > 20);
		};

		window.addEventListener('scroll', handleScroll);
		return () => window.removeEventListener('scroll', handleScroll);
	}, []);

	const handleConnectWallet = async () => {
		try {
			// Since we're authenticated (from AuthProvider), we can directly use the user from context
			if (!user) {
				toast.error("User not found. Please log in again.");
				return;
			}

			// For wallet connection, we always show verification for existing users
			setIsNewUser(false);
			setUserSeed(user.masterSeed);
			setSeedWords(user.masterSeed.split(" "));
			toast.info("Please verify your seed phrase to continue.");

			setIsConnectDialogOpen(true);
		} catch (error) {
			console.error("Error connecting wallet:", error);
			if (error instanceof Error) {
				toast.error(error.message);
			} else {
				// fallback in case error is not a standard Error
				toast.error("Failed to connect wallet");
			}
		}
	};

	const handleVerifySeed = async () => {
		if (!userInputs[0] || !userInputs[1]) {
			toast.error("Please fill in both missing words");
			return;
		}

		const fullSeedArray = [...seedWords];
		fullSeedArray[3] = userInputs[0]; // 4th word
		fullSeedArray[4] = userInputs[1]; // 5th word

		const isValid = await verifySeedPhrase(fullSeedArray);

		if (isValid) {
			setIsVerified(true);
			toast.success("Seed phrase verified successfully!");
			setTimeout(async () => {
				setIsConnectDialogOpen(false);
				await refreshAuth();
			}, 1000);
		} else {
			toast.error("Invalid seed phrase. Please try again.");
			setUserInputs(["", ""]);
		}
	};

	const handleDialogClose = () => {
		setIsConnectDialogOpen(false);
		setUserInputs(["", ""]);
		setIsVerified(false);
	};

	const handleLogout = async () => {
		logout();
		await refreshAuth();
		toast.success("Logged out successfully");
	};

	const handleNewUserComplete = async () => {
		setIsConnectDialogOpen(false);
		await refreshAuth();
	};

	const handleSeedImport = async () => {
		try {
			if (!importSeedPhrase.trim() || !importPassword.trim()) {
				toast.error("Please enter both seed phrase and password");
				return;
			}

			// Validate seed phrase format (should be 12 words)
			const seedWords = importSeedPhrase.trim().split(/\s+/);
			if (seedWords.length !== 12) {
				toast.error("Seed phrase must be exactly 12 words");
				return;
			}

			if (importPassword.length < 6) {
				toast.error("Password must be at least 6 characters long");
				return;
			}

			const result = await loginWithSeedPhrase(importSeedPhrase.trim(), importPassword);

			if (result.error) {
				toast.error(result.error);
				return;
			}

			toast.success("Successfully imported wallet! Your Ethereum and Solana wallets have been restored.");
			setIsSeedImportDialogOpen(false);
			setImportSeedPhrase("");
			setImportPassword("");
			await refreshAuth();
		} catch (error) {
			console.error("Error importing seed phrase:", error);
			toast.error("Failed to import seed phrase. Please check your seed phrase.");
		}
	};

	const handleSeedImportDialogClose = () => {
		setIsSeedImportDialogOpen(false);
		setImportSeedPhrase("");
		setImportPassword("");
	};

	const closeMobileMenu = () => {
		setIsMobileMenuOpen(false);
	};

	return (
		<nav className={`w-full fixed top-0 h-12 mt-2 right-0 z-30`}>
			<div className={`max-w-7xl mx-auto p-3 rounded-2xl flex justify-between bg-background/80 backdrop-blur-xl border-b border-border transition-all duration-300 ${scrolled ? 'shadow-sm bg-background/95' : ''}`}>
				<div className="flex items-center">
					<Link href="/" className="flex items-center" onClick={closeMobileMenu}>
						<Image
							src="/web3khalti.png"
							alt="Logo"
							width={40}
							height={40}
							className="h-8 w-8"
						/>
						<span className="ml-2 text-xl font-semibold hidden sm:inline">Web3 Khalti</span>
						<span className="ml-2 text-lg font-semibold sm:hidden">Web3</span>
					</Link>
				</div>
				<div className="hidden md:flex items-center gap-4">
					{
						loading ? (
							<div className="h-8 w-24 bg-muted animate-pulse rounded-md" />
						) : !hasAccount ? (
							// No account exists - show sign up and import options
							<div className="flex items-center gap-2">
								<Link href="/">
									<Button
										variant="outline"
										size="sm"
										className="flex items-center gap-2"
									>
										<UserPlus className="h-4 w-4" />
										Sign Up
									</Button>
								</Link>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => setIsSeedImportDialogOpen(true)}
									className="flex items-center gap-2"
								>
									<Key className="h-4 w-4" />
									Import Seed
								</Button>
							</div>
						) : !isAuthenticated ? (
							// Account exists but not authenticated - show sign in and import options
							<div className="flex items-center gap-2">
								<Link href="/">
									<Button
										variant="outline"
										size="sm"
										className="flex items-center gap-2"
									>
										<LogIn className="h-4 w-4" />
										Sign In
									</Button>
								</Link>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => setIsSeedImportDialogOpen(true)}
									className="flex items-center gap-2"
								>
									<Key className="h-4 w-4" />
									Import Seed
								</Button>
							</div>
						) : (
							// Authenticated - show connect wallet and logout
							<div className="flex items-center gap-2">
								<Dialog open={isConnectDialogOpen} onOpenChange={handleDialogClose}>
									<DialogTrigger asChild>
										<Button
											variant="outline"
											size="sm"
											onClick={handleConnectWallet}
											className="flex items-center gap-2"
										>
											<Wallet className="h-4 w-4" />
											Connect Wallet
										</Button>
									</DialogTrigger>
									<DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
										<DialogHeader>
											<DialogTitle>
												{isNewUser ? "Welcome to Web3 Khalti!" : "Verify Your Identity"}
											</DialogTitle>
											<DialogDescription>
												{
													isNewUser
														? "Please save your seed phrase securely. You'll need it to access your wallet."
														: "Please complete your seed phrase to verify your identity."
												}
											</DialogDescription>
										</DialogHeader>
										{
											isNewUser ? (
												<div className="space-y-4">
													<div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
														<h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
															⚠️ Important: Save Your Seed Phrase
														</h4>
														<p className="text-sm text-yellow-700 dark:text-yellow-300">
															This is your only way to recover your wallet. Write it down and store it safely!
														</p>
													</div>
													<div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
														{
															seedWords.map((word, index) => (
																<div
																	key={index}
																	className="flex items-center gap-1 sm:gap-2 p-2 sm:p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
																>
																	<span className="text-xs sm:text-sm font-mono text-gray-500 w-4 sm:w-6">
																		{index + 1}.
																	</span>
																	<span className="font-medium text-xs sm:text-sm">{word}</span>
																</div>
															))
														}
													</div>
													<Button
														onClick={handleNewUserComplete}
														className="w-full"
													>
														I've Saved My Seed Phrase
													</Button>
												</div>
											) : (
												<div className="space-y-4">
													<div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
														{
															seedWords.map((word, index) => (
																<div
																	key={index}
																	className="flex items-center gap-1 sm:gap-2 p-2 sm:p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
																>
																	<span className="text-xs sm:text-sm font-mono text-gray-500 w-4 sm:w-6">
																		{index + 1}.
																	</span>
																	<span className="font-medium text-xs sm:text-sm">
																		{index === 3 || index === 4 ? "___" : word}
																	</span>
																</div>
															))
														}
													</div>
													<div className="space-y-3">
														<div>
															<Label htmlFor="word4">4th word</Label>
															<Input
																id="word4"
																value={userInputs[0]}
																onChange={(e) => setUserInputs([e.target.value, userInputs[1]])}
																placeholder="Enter the 4th word"
															/>
														</div>
														<div>
															<Label htmlFor="word5">5th word</Label>
															<Input
																id="word5"
																value={userInputs[1]}
																onChange={(e) => setUserInputs([userInputs[0], e.target.value])}
																placeholder="Enter the 5th word"
															/>
														</div>
													</div>
													<Button
														onClick={handleVerifySeed}
														className="w-full"
														disabled={!userInputs[0] || !userInputs[1]}
													>
														Verify Seed Phrase
													</Button>
												</div>
											)
										}
									</DialogContent>
								</Dialog>
								<Button
									variant="ghost"
									size="sm"
									onClick={handleLogout}
									className="flex items-center gap-2"
								>
									<LogOut className="h-4 w-4" />
									Logout
								</Button>
							</div>
						)
					}
					<div className="flex items-center bg-muted/50 rounded-xl p-1 border border-border/50">
						<Button
							variant="ghost"
							size="sm"
							className={`h-7 w-7 p-0 rounded-lg transition-all cursor-pointer ${theme === 'light' ? 'bg-background shadow-sm' : 'hover:bg-muted'}`}
							onClick={() => setTheme('light')}
						>
							<Sun className="h-3 w-3 text-amber-500" />
						</Button>
						<Button
							variant="ghost"
							size="sm"
							className={`h-7 w-7 p-0 rounded-lg transition-all cursor-pointer ${theme === 'dark' ? 'bg-background shadow-sm' : 'hover:bg-muted'}`}
							onClick={() => setTheme('dark')}
						>
							<Moon className="h-3 w-3 text-blue-500" />
						</Button>
					</div>
				</div>
				<div className="flex md:hidden items-center gap-2">
					<div className="flex items-center bg-muted/50 rounded-xl p-1 border border-border/50">
						<Button
							variant="ghost"
							size="sm"
							className={`h-6 w-6 p-0 rounded-lg transition-all cursor-pointer ${theme === 'light' ? 'bg-background shadow-sm' : 'hover:bg-muted'}`}
							onClick={() => setTheme('light')}
						>
							<Sun className="h-3 w-3 text-amber-500" />
						</Button>
						<Button
							variant="ghost"
							size="sm"
							className={`h-6 w-6 p-0 rounded-lg transition-all cursor-pointer ${theme === 'dark' ? 'bg-background shadow-sm' : 'hover:bg-muted'}`}
							onClick={() => setTheme('dark')}
						>
							<Moon className="h-3 w-3 text-blue-500" />
						</Button>
					</div>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
						className="h-8 w-8 p-0"
					>
						{isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
					</Button>
				</div>
			</div>
			{
				isMobileMenuOpen && (
					<div className="md:hidden absolute top-14 left-0 right-0 bg-background/95 backdrop-blur-xl border-b border-border shadow-lg z-50">
						<div className="max-w-7xl mx-auto p-4 space-y-3">
							{
								loading ? (
									<div className="h-8 w-24 bg-muted animate-pulse rounded-md" />
								) : !hasAccount ? (
									// No account exists - show sign up and import options
									<div className="space-y-3">
										<Link href="/" onClick={closeMobileMenu}>
											<Button
												variant="outline"
												size="sm"
												className="w-full flex items-center gap-2 justify-center"
											>
												<UserPlus className="h-4 w-4" />
												Sign Up
											</Button>
										</Link>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => {
												setIsSeedImportDialogOpen(true);
												setIsMobileMenuOpen(false);
											}}
											className="w-full flex items-center gap-2 justify-center"
										>
											<Key className="h-4 w-4" />
											Import Seed
										</Button>
									</div>
								) : !isAuthenticated ? (
									// Account exists but not authenticated - show sign in and import options
									<div className="space-y-3">
										<Link href="/" onClick={closeMobileMenu}>
											<Button
												variant="outline"
												size="sm"
												className="w-full flex items-center gap-2 justify-center"
											>
												<LogIn className="h-4 w-4" />
												Sign In
											</Button>
										</Link>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => {
												setIsSeedImportDialogOpen(true);
												setIsMobileMenuOpen(false);
											}}
											className="w-full flex items-center gap-2 justify-center"
										>
											<Key className="h-4 w-4" />
											Import Seed
										</Button>
									</div>
								) : (
									// Authenticated - show connect wallet and logout
									<div className="space-y-3">
										<Dialog open={isConnectDialogOpen} onOpenChange={handleDialogClose}>
											<DialogTrigger asChild>
												<Button
													variant="outline"
													size="sm"
													onClick={() => {
														handleConnectWallet();
														setIsMobileMenuOpen(false);
													}}
													className="w-full flex items-center gap-2 justify-center"
												>
													<Wallet className="h-4 w-4" />
													Connect Wallet
												</Button>
											</DialogTrigger>
											{/* Dialog content is already defined above */}
										</Dialog>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => {
												handleLogout();
												setIsMobileMenuOpen(false);
											}}
											className="w-full flex items-center gap-2 justify-center"
										>
											<LogOut className="h-4 w-4" />
											Logout
										</Button>
									</div>
								)}
						</div>
					</div>
				)
			}
			<Dialog open={isSeedImportDialogOpen} onOpenChange={handleSeedImportDialogClose}>
				<DialogContent className="sm:max-w-[500px]">
					<DialogHeader>
						<DialogTitle>Import Existing Wallet</DialogTitle>
						<DialogDescription>
							Enter your 12-word seed phrase and create a new password to import your existing wallet.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="importSeedPhrase">12-Word Seed Phrase</Label>
							<textarea
								id="importSeedPhrase"
								value={importSeedPhrase}
								onChange={(e) => setImportSeedPhrase(e.target.value)}
								placeholder="Enter your 12-word seed phrase separated by spaces"
								className="w-full p-3 border border-input rounded-lg min-h-[100px] font-mono text-sm bg-background"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="importPassword">New Password</Label>
							<Input
								id="importPassword"
								type="password"
								value={importPassword}
								onChange={(e) => setImportPassword(e.target.value)}
								placeholder="Create a new password (min 6 characters)"
							/>
						</div>
						<Button
							onClick={handleSeedImport}
							className="w-full"
							disabled={!importSeedPhrase.trim() || !importPassword.trim()}
						>
							Import Wallet
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		</nav>
	)
}

export default Navbar;