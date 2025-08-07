"use client";

import { Button } from "@/components/ui/button";
import {
	Dialog, DialogContent, DialogDescription, 
	DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { generateMnemonic } from "bip39";
import { 
	generateEthereumPublicKey, generateEthereumPrivateKey,
	generateSolanaPublicKey, generateSolanaPrivateKey
 } from "@/lib/generateKeys";
import { Label } from "@/components/ui/label";

export default function Home() {
	const [walletType, setWalletType] = useState("");
	const [walletName, setWalletName] = useState("");
	const [walletSecretPhrase, setWalletSecretPhrase] = useState("");

	// Initialize the router for navigation
	const router = useRouter();

	useEffect(() => {
		// Check if a wallet type is already set in localStorage
	}, []);

	const handleGenerate = () => {
		if (walletType === "solana") {
			const mnemonic = generateMnemonic();
			localStorage.setItem("solanaMnemonic", mnemonic);

			const publicKey = generateSolanaPublicKey(mnemonic);
			const privateKey = generateSolanaPrivateKey(mnemonic);
			
			localStorage.setItem("solanaPublicKey", publicKey);
			localStorage.setItem("solanaPrivateKey", privateKey);
			
			router.push("/solana");
		} else if (walletType === "ethereum") {
			const mnemonic = generateMnemonic();
			localStorage.setItem("ethereumMnemonic", mnemonic);
			
			const publicKey = generateEthereumPublicKey(mnemonic);
			const privateKey = generateEthereumPrivateKey(mnemonic);

			localStorage.setItem("ethereumPublicKey", publicKey);
			localStorage.setItem("ethereumPrivateKey", privateKey);

			router.push("/ethereum");
		}
	};

	return (
		<section className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-neutral-900 text-gray-800 dark:text-gray-200 p-4">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<h1 className="text-4xl font-bold text-center">Welcome to Web3 Khalti</h1>
				<p className="text-lg text-center text-gray-800 dark:text-gray-200 mb-8">
					Your one-stop solution for all things Web3. Explore our features and get started today!
				</p>
			</div>
			<Dialog>
				<DialogTrigger asChild>
					<div className="flex space-x-4">
						<Button
							className="cursor-pointer"
							onClick={() => setWalletType("solana")}
						>
							Solana
						</Button>
						<Button
							className="cursor-pointer"
							onClick={() => setWalletType("ethereum")}
						>
							Ethereum
						</Button>
					</div>
				</DialogTrigger>
				<DialogContent className="sm:max-w-[425px] bg-white dark:bg-neutral-900">
					<DialogHeader>
						<DialogTitle>Connect your wallet</DialogTitle>
						<DialogDescription>
							Enter your secret phrase or generate a new wallet.
						</DialogDescription>
					</DialogHeader>
					<div className="flex flex-col gap-4 py-4">
						<div className="grid grid-cols-1 gap-2">
							<p>Do you have a secret phrase?</p>
							<Input
								id="secret-phrase"
								onChange={(e) => setWalletSecretPhrase(e.target.value)}
								placeholder="Enter your secret phrase"
								className="col-span-3"
							/>
						</div>
						<p className="text-center">Or</p>
						<Label>Enter your Wallet Name: </Label>
						<Input 
							id="wallet-name"
							onChange={(e) => setWalletName(e.target.value)}
							placeholder="Enter your wallet name"
							className="col-span-3"
						/>
						<div className="flex justify-center">
							<Button
								onClick={handleGenerate}
								className="mt-4"
							>
								Generate a new wallet
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</section>
	);
}