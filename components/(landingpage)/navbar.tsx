"use client"

import Image from "next/image"
import { Button } from "../ui/button"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import Link from "next/link"

const Navbar = () => {
	const { theme, setTheme } = useTheme();
	const [scrolled, setScrolled] = useState(false);

	useEffect(() => {
		const handleScroll = () => {
			setScrolled(window.scrollY > 20);
		};

		window.addEventListener('scroll', handleScroll);
		return () => window.removeEventListener('scroll', handleScroll);
	}, []);

	return (
		<nav className={`w-full fixed top-0 h-12 mt-2 right-0 z-30`}>
			<div className={`max-w-7xl mx-auto p-3 rounded-2xl flex justify-between bg-background/80 backdrop-blur-xl border-b border-border transition-all duration-300 ${scrolled ? 'shadow-sm bg-background/95' : ''}`}>
				<div className="flex items-center">
					<Link href="/" className="flex items-center">
						<Image
							src="/favicon.ico"
							alt="Logo"
							width={40}
							height={40}
							className="h-8 w-8"
						/>
						<span className="ml-2 text-xl font-semibold">Web3 Khalti</span>
					</Link>
				</div>
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
			</div>
		</nav>
	)
}

export default Navbar;