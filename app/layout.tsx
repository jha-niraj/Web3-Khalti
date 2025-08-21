import Navbar from "@/components/(landingpage)/navbar";
import "./globals.css";
import { ThemeProvider } from "@/components/themeproviders";
import { AuthProvider } from "@/components/auth-provider";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
import Footer from "@/components/(landingpage)/footer";
import { Toaster as SonnerToaster } from "sonner";
import { Metadata } from "next";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});
const spaceGrotesk = Space_Grotesk({
	subsets: ['latin'],
	weight: ['300', '400', '500', '600', '700'],
	display: 'swap',
	variable: '--font-space-grotesk',
})
const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "Web3Khalti",
	description: "Web3 version of the Khalti app",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<>
			<html lang="en" suppressHydrationWarning>
				<head>
					<link rel="icon" href="/web3khalti.ico" />
					<meta name="google-site-verification" content="B9KrfCl7J9ie_47H_sbiV-g0f5lZz5XCfLIShKuoDuc" />
				</head>
				<body className={`${spaceGrotesk.className} ${geistSans.variable} ${geistMono.variable} antialiased`}>

					<ThemeProvider
						attribute="class"
						defaultTheme="system"
						enableSystem
						disableTransitionOnChange
					>
						<AuthProvider>
							<Navbar />
							{children}
							<Footer />
							<SonnerToaster position="top-center" closeButton richColors />
						</AuthProvider>
					</ThemeProvider>
				</body>
			</html>
		</>
	)
}