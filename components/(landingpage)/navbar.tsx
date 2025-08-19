"use client"

import Image from "next/image"
import { Button } from "../ui/button"
import { Moon, Sun, Wallet, LogIn, LogOut, UserPlus } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import Link from "next/link"
import {
	Dialog, DialogContent, DialogDescription,
	DialogHeader, DialogTitle, DialogTrigger
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { getOrCreateUserSession, verifySeedPhrase, formatSeedPhraseForDisplay, logout } from "@/lib/userUtils";
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

	useEffect(() => {
		const handleScroll = () => {
			setScrolled(window.scrollY > 20);
		};

		window.addEventListener('scroll', handleScroll);
		return () => window.removeEventListener('scroll', handleScroll);
	}, []);

	const handleConnectWallet = async () => {
		try {
			const { user, isNewUser: newUser } = await getOrCreateUserSession();
			setIsNewUser(newUser);

			if (newUser) {
				// Show the full seed phrase for new users
				setUserSeed(user.masterSeed);
				setSeedWords(user.masterSeed.split(" "));
				toast.success("Welcome! Please save your seed phrase securely.");
			} else {
				// Show verification for existing users
				setUserSeed(user.masterSeed);
				setSeedWords(user.masterSeed.split(" "));
				toast.info("Please verify your seed phrase to continue.");
			}

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

	const handleLogout = () => {
		logout();
		refreshAuth();
		toast.success("Logged out successfully");
	};

	const handleNewUserComplete = async () => {
		setIsConnectDialogOpen(false);
		await refreshAuth();
	};

	return (
		<nav className={`w-full fixed top-0 h-12 mt-2 right-0 z-30`}>
			<div className={`max-w-7xl mx-auto p-3 rounded-2xl flex justify-between bg-background/80 backdrop-blur-xl border-b border-border transition-all duration-300 ${scrolled ? 'shadow-sm bg-background/95' : ''}`}>
				<div className="flex items-center">
					<Link href="/" className="flex items-center">
						<Image
							src="/web3khalti.png"
							alt="Logo"
							width={40}
							height={40}
							className="h-8 w-8"
						/>
						<span className="ml-2 text-xl font-semibold">Web3 Khalti</span>
					</Link>
				</div>
				<div className="flex items-center gap-4">
					{/* Authentication State */}
					{loading ? (
						<div className="h-8 w-24 bg-muted animate-pulse rounded-md" />
					) : !hasAccount ? (
						// No account exists - show sign up
						<Link href="/">
							<Button
								variant="outline"
								size="sm"
								className="hidden md:flex items-center gap-2"
							>
								<UserPlus className="h-4 w-4" />
								Sign Up
							</Button>
						</Link>
					) : !isAuthenticated ? (
						// Account exists but not authenticated - show sign in
						<Link href="/">
							<Button
								variant="outline"
								size="sm"
								className="hidden md:flex items-center gap-2"
							>
								<LogIn className="h-4 w-4" />
								Sign In
							</Button>
						</Link>
					) : (
						// Authenticated - show connect wallet and logout
						<div className="flex items-center gap-2">
							<Dialog open={isConnectDialogOpen} onOpenChange={handleDialogClose}>
								<DialogTrigger asChild>
									<Button
										variant="outline"
										size="sm"
										onClick={handleConnectWallet}
										className="hidden md:flex items-center gap-2"
									>
										<Wallet className="h-4 w-4" />
										Connect Wallet
									</Button>
								</DialogTrigger>
								<DialogContent className="sm:max-w-[500px]">
									<DialogHeader>
										<DialogTitle>
											{isNewUser ? "Welcome to Web3 Khalti!" : "Verify Your Identity"}
										</DialogTitle>
										<DialogDescription>
											{isNewUser
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
												<div className="grid grid-cols-3 gap-2">
													{
														seedWords.map((word, index) => (
															<div
																key={index}
																className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
															>
																<span className="text-sm font-mono text-gray-500 w-6">
																	{index + 1}.
																</span>
																<span className="font-medium">{word}</span>
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
												<div className="grid grid-cols-3 gap-2">
													{
														seedWords.map((word, index) => (
															<div
																key={index}
																className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
															>
																<span className="text-sm font-mono text-gray-500 w-6">
																	{index + 1}.
																</span>
																<span className="font-medium">
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
								className="hidden md:flex items-center gap-2"
							>
								<LogOut className="h-4 w-4" />
								Logout
							</Button>
						</div>
					)}
					<div className="hidden md:flex items-center bg-muted/50 rounded-xl p-1 border border-border/50">
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
					<div>

					</div>
				</div>
			</div>
		</nav>
	)
}

export default Navbar;