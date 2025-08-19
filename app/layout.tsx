import Navbar from "@/components/(landingpage)/navbar";
import "./globals.css";
import { ThemeProvider } from "@/components/themeproviders";
import { Geist, Geist_Mono, Poppins, Space_Grotesk } from "next/font/google";
import Footer from "@/components/(landingpage)/footer";
import { Toaster as SonnerToaster } from "sonner";

const poppins = Poppins({ subsets: ["latin"], weight: "300" });
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<>
			<html lang="en" suppressHydrationWarning>
				<head>
					<link rel="icon" href="/vercel.svg" />
					<meta name="google-site-verification" content="B9KrfCl7J9ie_47H_sbiV-g0f5lZz5XCfLIShKuoDuc" />
				</head>
				<body className={`${spaceGrotesk.className} ${geistSans.variable} ${geistMono.variable} antialiased`}>

					<ThemeProvider
						attribute="class"
						defaultTheme="system"
						enableSystem
						disableTransitionOnChange
					>
						<Navbar />
						{children}
						<Footer />
						<SonnerToaster position="top-center" closeButton richColors />
					</ThemeProvider>
				</body>
			</html>
		</>
	)
}