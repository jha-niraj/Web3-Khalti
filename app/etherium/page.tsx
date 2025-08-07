"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Copy } from "lucide-react";

export default function EthereumPage() {
	const [isPrivateKeyVisible, setIsPrivateKeyVisible] = useState(false);
	const seedPhrase =
		"lion tiger bear wolf eagle falcon shark whale dolphin seal";
	const publicKey = "ETH_PUBLIC_KEY_PLACEHOLDER";
	const privateKey = "ETH_PRIVATE_KEY_PLACEHOLDER";

	const handleCopy = (text: string) => {
		navigator.clipboard.writeText(text);
		alert("Copied to clipboard!");
	};

	return (
		<section className="min-h-screen bg-white dark:bg-neutral-900 text-gray-800 dark:text-gray-200 p-4">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<h1 className="text-3xl font-bold text-center mb-8">
					Your Ethereum Wallet
				</h1>

				<div className="mb-8">
					<h2 className="text-2xl font-semibold mb-4">Your Seed Phrase</h2>
					<div
						className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-100 dark:bg-neutral-800 p-4 rounded-lg cursor-pointer"
						onClick={() => handleCopy(seedPhrase)}
					>
						{seedPhrase.split(" ").map((word, index) => (
							<div key={index} className="p-2 text-center">
								{index + 1}. {word}
							</div>
						))}
					</div>
					<div className="text-center mt-2">
						<Button
							variant="ghost"
							size="sm"
							onClick={() => handleCopy(seedPhrase)}
						>
							<Copy className="h-4 w-4 mr-2" />
							Copy Phrase
						</Button>
					</div>
				</div>

				<div>
					<h2 className="text-2xl font-semibold mb-4">Wallet Details</h2>
					<div className="bg-gray-100 dark:bg-neutral-800 p-6 rounded-lg">
						<div className="mb-4">
							<h3 className="font-semibold">Wallet Name</h3>
							<p>My Ethereum Wallet</p>
						</div>
						<div className="mb-4">
							<h3 className="font-semibold">Public Key</h3>
							<div className="flex items-center justify-between">
								<p className="truncate mr-4">{publicKey}</p>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => handleCopy(publicKey)}
								>
									<Copy className="h-4 w-4" />
								</Button>
							</div>
						</div>
						<div>
							<h3 className="font-semibold">Private Key</h3>
							<div className="flex items-center justify-between">
								<p className="truncate mr-4">
									{isPrivateKeyVisible ? privateKey : "••••••••••••••••••••"}
								</p>
								<div className="flex items-center">
									<Button
										variant="ghost"
										size="sm"
										onClick={() => setIsPrivateKeyVisible(!isPrivateKeyVisible)}
									>
										{isPrivateKeyVisible ? (
											<EyeOff className="h-4 w-4" />
										) : (
											<Eye className="h-4 w-4" />
										)}
									</Button>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => handleCopy(privateKey)}
									>
										<Copy className="h-4 w-4" />
									</Button>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
