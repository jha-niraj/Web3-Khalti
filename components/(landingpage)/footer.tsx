"use client"

import Link from "next/link";

const Footer = () => {
    return (
        <footer className="bg-white dark:bg-neutral-900 dark:border-2 dark:border-t-gray-200 text-white py-4">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center space-y-2">
                Made with ❤️ by <Link href="https://nirajjha.xyz" target="_blank" className="text-blue-500 hover:underline">Niraj Jha</Link>
            </div>
            <div className="mx-auto text-center">
                <p>&copy; {new Date().getFullYear()} Web3 Khalti. All rights reserved.</p>
            </div>
        </footer>
    );
}

export default Footer;